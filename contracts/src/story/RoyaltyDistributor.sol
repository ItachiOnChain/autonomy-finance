// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAutoRepayEngine.sol";

/**
 * @title RoyaltyDistributor
 * @notice Manages IP registration and distributes simulated royalty revenue
 * @dev Uses Story Protocol ipId as primary key for IP tracking
 */
contract RoyaltyDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Royalty token used for distributions
    IERC20 public immutable royaltyToken;

    /// @notice Information about registered IP assets
    struct RoyaltyInfo {
        address owner;
        uint256 royaltyPercent; // 0-100
        bool loggedToLendingPool;
        address lendingPoolAddress;
        uint256 totalEarned; // Cumulative earnings for display
        uint256 lastDistributionTime;
    }

    /// @notice Mapping from Story Protocol ipId to royalty information
    mapping(string => RoyaltyInfo) private ipRegistry;

    /// @notice Mapping from ipId to last simulation timestamp
    mapping(string => uint256) private lastSimulationTime;

    /// @notice Per-IP royalty balance tracking (CRITICAL FIX for isolated balances)
    mapping(string => uint256) private ipRoyaltyBalances;

    /// @notice Emitted when an IP is registered or updated
    event IpRegistered(
        string indexed ipId,
        address indexed owner,
        uint256 royaltyPercent,
        address lendingPoolAddress,
        bool loggedToPool
    );

    /// @notice Emitted when revenue is distributed
    event RevenueDistributed(
        string indexed ipId,
        address indexed payer,
        uint256 totalAmount,
        uint256 royaltyAmount,
        bool forwardedToPool,
        address recipient,
        uint256 timestamp
    );

    /// @notice Emitted when a simulation is executed
    event SimulationExecuted(
        string indexed ipId,
        address indexed owner,
        uint256 numberOfDerivatives,
        uint256 royaltyPerDerivative,
        uint256 royaltyMinted,
        uint256 timestamp
    );

    /// @notice Emitted when royalties are withdrawn
    event RoyaltiesWithdrawn(
        string indexed ipId,
        address indexed owner,
        uint256 amount
    );

    /// @notice AutoRepayEngine contract address for automatic debt repayment
    address public autoRepayEngine;

    /**
     * @notice Constructor initializes the distributor with royalty token
     * @param _royaltyToken Address of the MockERC20 token contract
     */
    constructor(address _royaltyToken) {
        require(_royaltyToken != address(0), "Invalid token address");
        royaltyToken = IERC20(_royaltyToken);
    }

    /**
     * @notice Register or update an IP asset for royalty distribution
     * @param ipId Story Protocol IP identifier (string format)
     * @param owner Address of the IP owner
     * @param royaltyPercent Royalty percentage (0-100)
     * @param lendingPoolAddress Address of lending pool (zero address if not logged)
     */
    function registerIp(
        string memory ipId,
        address owner,
        uint256 royaltyPercent,
        address lendingPoolAddress
    ) external {
        require(bytes(ipId).length > 0, "IP ID cannot be empty");
        require(owner != address(0), "Invalid owner address");
        require(royaltyPercent <= 100, "Royalty percent must be 0-100");

        bool loggedToPool = lendingPoolAddress != address(0);

        ipRegistry[ipId] = RoyaltyInfo({
            owner: owner,
            royaltyPercent: royaltyPercent,
            loggedToLendingPool: loggedToPool,
            lendingPoolAddress: lendingPoolAddress,
            totalEarned: ipRegistry[ipId].totalEarned, // Preserve existing earnings
            lastDistributionTime: ipRegistry[ipId].lastDistributionTime
        });

        emit IpRegistered(
            ipId,
            owner,
            royaltyPercent,
            lendingPoolAddress,
            loggedToPool
        );
    }

    /**
     * @notice Distribute revenue for an IP asset
     * @param ipId Story Protocol IP identifier
     * @param payer Address paying the revenue
     * @param totalAmount Total revenue amount
     * @return royaltyAmount Amount of royalty distributed
     */
    function distributeRevenue(
        string memory ipId,
        address payer,
        uint256 totalAmount
    ) external nonReentrant returns (uint256 royaltyAmount) {
        require(bytes(ipId).length > 0, "IP ID cannot be empty");
        require(payer != address(0), "Invalid payer address");
        require(totalAmount > 0, "Amount must be greater than zero");

        RoyaltyInfo storage info = ipRegistry[ipId];
        require(info.owner != address(0), "IP not registered");

        // Transfer tokens from payer to this contract
        royaltyToken.safeTransferFrom(payer, address(this), totalAmount);

        // Calculate royalty amount
        royaltyAmount = (totalAmount * info.royaltyPercent) / 100;

        address recipient;
        bool forwardedToPool = false;

        // Route royalty based on lending pool status
        if (info.loggedToLendingPool && info.lendingPoolAddress != address(0)) {
            // Forward to lending pool
            royaltyToken.safeTransfer(info.lendingPoolAddress, royaltyAmount);
            recipient = info.lendingPoolAddress;
            forwardedToPool = true;

            // Attempt to call repayOnBehalf if interface exists
            // Silently fail if not implemented (tokens remain in pool address)
            try
                this.callRepayOnBehalf(
                    info.lendingPoolAddress,
                    info.owner,
                    royaltyAmount
                )
            {
                // Success - repayment processed
            } catch {
                // Fail silently - tokens transferred but repayment not processed
            }
        } else {
            // Transfer directly to owner
            royaltyToken.safeTransfer(info.owner, royaltyAmount);
            recipient = info.owner;
        }

        // Update tracking
        info.totalEarned += royaltyAmount;
        info.lastDistributionTime = block.timestamp;

        emit RevenueDistributed(
            ipId,
            payer,
            totalAmount,
            royaltyAmount,
            forwardedToPool,
            recipient,
            block.timestamp
        );

        return royaltyAmount;
    }

    /**
     * @notice Simulate revenue distribution for an IP asset
     * @dev Mints mock tokens directly to IP owner based on SIMPLE MULTIPLICATION
     * @param ipId Story Protocol IP identifier
     * @param numberOfDerivatives Number of derivatives generating revenue
     * @param royaltyPerDerivative Royalty amount per derivative (in USD/token units)
     * @return royaltyMinted Amount of tokens minted to IP owner
     */
    function simulateRevenue(
        string memory ipId,
        uint256 numberOfDerivatives,
        uint256 royaltyPerDerivative
    ) external nonReentrant returns (uint256 royaltyMinted) {
        require(bytes(ipId).length > 0, "IP ID cannot be empty");
        require(numberOfDerivatives > 0, "Number of derivatives must be > 0");
        require(
            royaltyPerDerivative >= 0,
            "Royalty per derivative must be >= 0"
        );

        RoyaltyInfo storage info = ipRegistry[ipId];
        require(info.owner != address(0), "IP not registered");

        // CRITICAL FIX: Simple multiplication - NO percentage division
        // Formula: royaltyToMint = numberOfDerivatives × royaltyPerDerivative
        royaltyMinted = numberOfDerivatives * royaltyPerDerivative;

        require(royaltyMinted > 0, "Royalty to mint cannot be zero");

        // CRITICAL FIX: Track balance per IP instead of minting to owner
        // This ensures each IP has isolated balance
        ipRoyaltyBalances[ipId] += royaltyMinted;

        // Update tracking
        info.totalEarned += royaltyMinted;
        info.lastDistributionTime = block.timestamp;
        lastSimulationTime[ipId] = block.timestamp;

        // CRITICAL: Notify AutoRepayEngine for automatic debt repayment
        if (autoRepayEngine != address(0)) {
            try
                IAutoRepayEngine(autoRepayEngine).onRoyaltyReceived(
                    ipId,
                    royaltyMinted
                )
            {
                // Success - royalties routed to debt repayment
            } catch {
                // Fail silently - royalties stay on IP
            }
        }

        emit SimulationExecuted(
            ipId,
            info.owner,
            numberOfDerivatives,
            royaltyPerDerivative,
            royaltyMinted,
            block.timestamp
        );

        return royaltyMinted;
    }

    /**
     * @notice Get royalty balance for a specific IP
     * @param ipId Story Protocol IP identifier
     * @return balance Royalty balance for this IP
     */
    function getIpRoyaltyBalance(
        string memory ipId
    ) external view returns (uint256 balance) {
        return ipRoyaltyBalances[ipId];
    }

    /**
     * @notice Withdraw royalty balance for an IP to owner's wallet
     * @param ipId Story Protocol IP identifier
     * @param amount Amount to withdraw
     */
    function withdrawRoyalties(
        string memory ipId,
        uint256 amount
    ) external nonReentrant {
        RoyaltyInfo storage info = ipRegistry[ipId];
        require(info.owner != address(0), "IP not registered");

        // Allow either the IP owner OR the AutoRepayEngine to withdraw
        require(
            msg.sender == info.owner || msg.sender == autoRepayEngine,
            "Not authorized to withdraw"
        );

        require(ipRoyaltyBalances[ipId] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be > 0");

        // Update balance before transfer (reentrancy protection)
        ipRoyaltyBalances[ipId] -= amount;

        // Mint tokens to the appropriate recipient:
        // - If called by AutoRepayEngine: mint to AutoRepayEngine (for conversion)
        // - If called by IP owner: mint to owner (direct withdrawal)
        address recipient = (msg.sender == autoRepayEngine) ? msg.sender : info.owner;
        
        (bool success, ) = address(royaltyToken).call(
            abi.encodeWithSignature("mint(address,uint256)", recipient, amount)
        );
        require(success, "Minting failed");

        emit RoyaltiesWithdrawn(ipId, recipient, amount);
    }

    /**
     * @notice Set AutoRepayEngine address
     * @param _autoRepayEngine AutoRepayEngine contract address
     */
    function setAutoRepayEngine(address _autoRepayEngine) external {
        autoRepayEngine = _autoRepayEngine;
    }

    /**
     * @notice External function to call repayOnBehalf on lending pool
     * @dev Used for try-catch pattern to handle pools without this interface
     * @param pool Lending pool address
     * @param borrower Borrower address
     * @param amount Amount to repay
     */
    function callRepayOnBehalf(
        address pool,
        address borrower,
        uint256 amount
    ) external {
        require(msg.sender == address(this), "Only self-callable");

        // Attempt to call repayOnBehalf
        // This will revert if the interface doesn't exist
        (bool success, ) = pool.call(
            abi.encodeWithSignature(
                "repayOnBehalf(address,uint256)",
                borrower,
                amount
            )
        );
        require(success, "RepayOnBehalf call failed");
    }

    /**
     * @notice Get full information about a registered IP
     * @param ipId Story Protocol IP identifier
     * @return RoyaltyInfo struct with all IP information
     */
    function getIpInfo(
        string memory ipId
    ) external view returns (RoyaltyInfo memory) {
        return ipRegistry[ipId];
    }

    /**
     * @notice Get total earnings for an IP
     * @param ipId Story Protocol IP identifier
     * @return Total amount earned by this IP
     */
    function getTotalEarned(
        string memory ipId
    ) external view returns (uint256) {
        return ipRegistry[ipId].totalEarned;
    }

    /**
     * @notice Get royalty balance for an IP owner
     * @dev Returns the token balance of the owner address
     * @param owner IP owner address
     * @return Current token balance
     */
    function getRoyaltyBalance(address owner) external view returns (uint256) {
        return royaltyToken.balanceOf(owner);
    }

    /**
     * @notice Check if an IP is registered
     * @param ipId Story Protocol IP identifier
     * @return bool True if IP is registered
     */
    function isIpRegistered(string memory ipId) external view returns (bool) {
        return ipRegistry[ipId].owner != address(0);
    }

    /**
     * @notice Get last simulation time for an IP
     * @param ipId Story Protocol IP identifier
     * @return timestamp Last simulation timestamp (0 if never simulated)
     */
    function getLastSimulationTime(
        string memory ipId
    ) external view returns (uint256) {
        return lastSimulationTime[ipId];
    }
}
