// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../oracles/RWAOracle.sol";
import "../tokens/MintableBurnableERC20.sol";
import "../base/FixedPointMath.sol";
import "../base/Errors.sol";

/// @notice RWA Adapter - ERC-4626-like semantics with NAV-based pricing
/// @dev Uses RWAOracle for NAV updates instead of on-chain APY. For the hackathon MVP
///      NAV is expected to be updated off-chain via the RWAOracle.
contract RWAAdapter is ITokenAdapter, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using FixedPointMath for uint256;

    enum Status { Active, RedeemOnly, Blocked }

    IERC20Minimal public immutable underlyingToken;
    MintableBurnableERC20 public immutable _yieldToken;
    RWAOracle public immutable rwaOracle;

    Status public status;
    uint256 public liquidityBuffer;
    uint256 public bufferCap;

    // Redemption queue
    struct RedemptionRequest {
        address user;
        uint256 shares;
        uint256 requestedAt;
        bool processed;
    }

    mapping(uint256 => RedemptionRequest) public redemptionQueue;
    uint256 public nextRedemptionId;
    uint256 public processedRedemptionId;

    event StatusUpdated(Status oldStatus, Status newStatus);
    event LiquidityBufferUpdated(uint256 oldBuffer, uint256 newBuffer);
    event RedemptionRequested(uint256 indexed claimId, address indexed user, uint256 shares);
    event RedemptionProcessed(uint256 indexed claimId, uint256 assets);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
    event DepositPerformed(address indexed from, address indexed to, uint256 amount, uint256 shares);
    event InstantRedemption(address indexed to, uint256 assets);

    constructor(
        address initialOwner,
        IERC20Minimal underlyingToken_,
        string memory yieldTokenName,
        string memory yieldTokenSymbol,
        RWAOracle rwaOracle_
    ) Ownable(initialOwner) {
        underlyingToken = underlyingToken_;
        _yieldToken = new MintableBurnableERC20(yieldTokenName, yieldTokenSymbol, 18);
        _yieldToken.setMinter(address(this));
        rwaOracle = rwaOracle_;
        status = Status.Active;
        liquidityBuffer = 0;
        bufferCap = 0;
        nextRedemptionId = 0;
        processedRedemptionId = 0;
    }

    /// @notice Get the yield token (implements ITokenAdapter interface)
    function yieldToken() external view override returns (IERC20Minimal) {
        return IERC20Minimal(address(_yieldToken));
    }

    /// @notice Get current exchange rate (yield token / underlying token) using NAV
    function getExchangeRate() external view override returns (uint256) {
        return rwaOracle.getNAV();
    }

    /// @notice Accrue RWA (validate staleness)
    function accrue() external override {
        // NAV is updated off-chain via RWAOracle.updateNAV()
        // This function validates staleness
        require(!rwaOracle.isStale(), "RWAAdapter: stale NAV");
    }

    /// @notice Deposit underlying tokens and receive yield tokens
    /// @dev mints yield tokens to recipient based on current NAV.
    function deposit(uint256 amount, address recipient) external override nonReentrant returns (uint256) {
        if (amount == 0) revert Errors.InvalidAmount();
        require(status == Status.Active, "RWAAdapter: deposits blocked");
        require(!rwaOracle.isStale(), "RWAAdapter: stale NAV");

        IERC20(address(underlyingToken)).safeTransferFrom(msg.sender, address(this), amount);

        uint256 nav = rwaOracle.getNAV();
        uint256 shares = amount.wdiv(nav);
        _yieldToken.mint(recipient, shares);

        emit DepositPerformed(msg.sender, recipient, amount, shares);

        return shares;
    }

    /// @notice Withdraw underlying tokens by burning yield tokens
    /// @dev Burns `shares` from the caller (Autonomy/core) and attempts to return underlying
    ///      to `recipient`. If liquidityBuffer is insufficient, creates a queued redemption.
    function withdraw(uint256 shares, address recipient) external override nonReentrant returns (uint256) {
        if (shares == 0) revert Errors.InvalidAmount();
        require(status != Status.Blocked, "RWAAdapter: withdrawals blocked");
        require(!rwaOracle.isStale(), "RWAAdapter: stale NAV");

        // Burn yield tokens from caller (Autonomy/core) — matches the custodial model.
        _yieldToken.burnFrom(msg.sender, shares);

        uint256 nav = rwaOracle.getNAV();
        uint256 amount = shares.wmul(nav);

        // Try instant redemption from buffer
        if (amount <= liquidityBuffer) {
            liquidityBuffer -= amount;
            IERC20(address(underlyingToken)).safeTransfer(recipient, amount);
            emit InstantRedemption(recipient, amount);
            return amount;
        }

        // Queue redemption if buffer insufficient (owner/keeper will process later)
        redemptionQueue[nextRedemptionId] = RedemptionRequest({
            user: recipient,
            shares: shares,
            requestedAt: block.timestamp,
            processed: false
        });

        emit RedemptionRequested(nextRedemptionId, recipient, shares);
        nextRedemptionId++;

        // Return partial amount from buffer if available
        if (liquidityBuffer > 0) {
            uint256 partialAmount = liquidityBuffer;
            liquidityBuffer = 0;
            IERC20(address(underlyingToken)).safeTransfer(recipient, partialAmount);
            emit InstantRedemption(recipient, partialAmount);
            return partialAmount;
        }

        return 0;
    }

    /// @notice Harvest yield (no-op for RWA, NAV updated off-chain)
    function harvest() external override returns (uint256) {
        require(!rwaOracle.isStale(), "RWAAdapter: stale NAV");
        return 0; // NAV updates happen off-chain
    }

    /// @notice Get total value locked in underlying terms
    function totalValue() external view override returns (uint256) {
        uint256 totalShares = _yieldToken.totalSupply();
        uint256 nav = rwaOracle.getNAV();
        return totalShares.wmul(nav);
    }

    /// @notice Convert shares to assets using NAV
    function convertToAssets(uint256 shares) external view returns (uint256) {
        uint256 nav = rwaOracle.getNAV();
        return shares.wmul(nav);
    }

    /// @notice Convert assets to shares using NAV
    function convertToShares(uint256 assets) external view returns (uint256) {
        uint256 nav = rwaOracle.getNAV();
        return assets.wdiv(nav);
    }

    /// @notice Process redemption from queue (owner/keeper)
    /// @dev Owner/keeper must ensure contract has sufficient underlying balance before calling.
    function processRedemption(uint256 claimId, uint256 assets) external onlyOwner {
        RedemptionRequest storage request = redemptionQueue[claimId];
        require(!request.processed, "RWAAdapter: already processed");
        require(request.user != address(0), "RWAAdapter: invalid request");

        request.processed = true;
        IERC20(address(underlyingToken)).safeTransfer(request.user, assets);

        emit RedemptionProcessed(claimId, assets);
    }

    /// @notice Set adapter status
    function setStatus(Status newStatus) external onlyOwner {
        Status oldStatus = status;
        status = newStatus;
        emit StatusUpdated(oldStatus, newStatus);
    }

    /// @notice Add liquidity to buffer
    function addLiquidityBuffer(uint256 amount) external {
        if (amount == 0) revert Errors.InvalidAmount();
        IERC20(address(underlyingToken)).safeTransferFrom(msg.sender, address(this), amount);
        uint256 oldBuffer = liquidityBuffer;
        liquidityBuffer += amount;
        if (liquidityBuffer > bufferCap) {
            bufferCap = liquidityBuffer;
        }
        emit LiquidityBufferUpdated(oldBuffer, liquidityBuffer);
    }

    /// @notice Set buffer cap
    function setBufferCap(uint256 cap) external onlyOwner {
        bufferCap = cap;
    }

    /// @notice Emergency withdraw (owner-only)
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        // Must be in an emergency status to allow admin extraction
        require(status == Status.Blocked || status == Status.RedeemOnly, "RWAAdapter: not emergency");
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }
}