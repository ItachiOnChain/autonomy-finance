// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/ILendingPool.sol";

/**
 * @title AutoRepayEngine
 * @notice Automatically converts IP royalties (MOC tokens) into debt repayments
 * @dev Integrates with RoyaltyDistributor, PriceOracle, and LendingPool
 */
contract AutoRepayEngine is ReentrancyGuard, Ownable {
    // ============ State Variables ============

    /// @notice RoyaltyDistributor contract address
    address public royaltyDistributor;

    /// @notice PriceOracle contract address
    IPriceOracle public priceOracle;

    /// @notice LendingPool contract address
    ILendingPool public lendingPool;

    /// @notice MOC token address (royalty token)
    address public mocToken;

    /// @notice IP locking status
    mapping(string => bool) public lockedIPs;

    /// @notice IP owner mapping
    mapping(string => address) public ipOwner;

    /// @notice Borrowed token for each locked IP
    mapping(string => address) public borrowedToken;

    /// @notice Outstanding debt tracking (user => token => amount)
    mapping(address => mapping(address => uint256)) public outstandingDebt;

    // ============ Events ============

    event IPLocked(
        string indexed ipId,
        address indexed owner,
        address indexed borrowedToken,
        uint256 initialDebt
    );

    event IPUnlocked(string indexed ipId, address indexed owner);

    event RoyaltiesClaimed(
        string indexed ipId,
        uint256 mocAmount,
        uint256 usdAmount,
        uint256 repaymentAmount,
        address indexed token
    );

    event AutoRepayment(
        string indexed ipId,
        uint256 mocAmount,
        uint256 repaymentAmount,
        address indexed token,
        uint256 remainingDebt
    );

    event DebtFullyRepaid(
        string indexed ipId,
        address indexed user,
        address indexed token
    );

    // ============ Constructor ============

    constructor(
        address _royaltyDistributor,
        address _priceOracle,
        address _lendingPool,
        address _mocToken
    ) Ownable(msg.sender) {
        require(
            _royaltyDistributor != address(0),
            "Invalid RoyaltyDistributor"
        );
        require(_priceOracle != address(0), "Invalid PriceOracle");
        require(_lendingPool != address(0), "Invalid LendingPool");
        require(_mocToken != address(0), "Invalid MOC token");

        royaltyDistributor = _royaltyDistributor;
        priceOracle = IPriceOracle(_priceOracle);
        lendingPool = ILendingPool(_lendingPool);
        mocToken = _mocToken;
    }

    // ============ Core Functions ============

    /**
     * @notice Lock an IP asset for auto-repay mode
     * @param ipId Story Protocol IP identifier
     * @param _borrowedToken Token that was borrowed (WETH, USDC, etc.)
     */
    function lockIP(
        string memory ipId,
        address _borrowedToken
    ) external nonReentrant {
        // Validation 1: Check if IP is already locked
        require(
            !lockedIPs[ipId],
            "AutoRepay: IP already locked for auto-repay"
        );

        // Validation 2: Check token address
        require(
            _borrowedToken != address(0),
            "AutoRepay: Invalid borrowed token address"
        );

        // Validation 3: Check if IP is registered in RoyaltyDistributor
        (bool regSuccess, bytes memory regData) = royaltyDistributor.call(
            abi.encodeWithSignature("isIpRegistered(string)", ipId)
        );
        require(
            regSuccess && regData.length > 0,
            "AutoRepay: Failed to check IP registration"
        );

        bool isRegistered;
        assembly {
            isRegistered := mload(add(regData, 32))
        }
        require(
            isRegistered,
            "AutoRepay: IP not registered in RoyaltyDistributor. Please register IP first."
        );

        // Validation 4: Verify IP ownership
        (bool ownerSuccess, bytes memory ownerData) = royaltyDistributor.call(
            abi.encodeWithSignature("getIpInfo(string)", ipId)
        );

        if (!ownerSuccess || ownerData.length < 32) {
            revert(
                "AutoRepay: Failed to verify IP ownership. IP may not be registered."
            );
        }

        address owner;
        assembly {
            owner := mload(add(ownerData, 32))
        }

        require(
            owner == msg.sender,
            "AutoRepay: You are not the owner of this IP"
        );

        // Validation 5: Check user has outstanding debt
        ILendingPool.UserPosition memory position = lendingPool.getUserPosition(
            msg.sender,
            _borrowedToken
        );
        uint256 debt = position.borrowed;

        require(
            debt > 0,
            "AutoRepay: No outstanding debt to repay. Borrow tokens first."
        );

        // All validations passed - Lock the IP
        lockedIPs[ipId] = true;
        ipOwner[ipId] = msg.sender;
        borrowedToken[ipId] = _borrowedToken;
        outstandingDebt[msg.sender][_borrowedToken] = debt;

        emit IPLocked(ipId, msg.sender, _borrowedToken, debt);
    }

    /**
     * @notice Claim existing royalties and apply to debt
     * @param ipId Story Protocol IP identifier
     * @return repaymentAmount Amount repaid in borrowed token
     */
    function claimRoyalties(
        string memory ipId
    ) external nonReentrant returns (uint256 repaymentAmount) {
        require(lockedIPs[ipId], "IP not locked");
        require(ipOwner[ipId] == msg.sender, "Not IP owner");

        address token = borrowedToken[ipId];

        // Query CURRENT debt from LendingPool (not stored value)
        // This ensures we always use fresh debt even if user borrowed more after locking
        ILendingPool.UserPosition memory position = lendingPool.getUserPosition(
            msg.sender,
            token
        );
        uint256 debt = position.borrowed; // In token's native decimals (e.g., 6 for USDC)
        require(debt > 0, "No outstanding debt");

        // Get token decimals to convert debt to 18 decimals for calculations
        uint8 tokenDecimals = _getTokenDecimals(token);
        uint256 debt18; // Debt in 18 decimals for comparison

        if (tokenDecimals < 18) {
            // Convert up from token decimals to 18 decimals
            debt18 = debt * (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            // Convert down from token decimals to 18 decimals
            debt18 = debt / (10 ** (tokenDecimals - 18));
        } else {
            debt18 = debt;
        }

        // Get IP's current royalty balance (MOC tokens)
        (bool success, bytes memory data) = royaltyDistributor.call(
            abi.encodeWithSignature("getIpRoyaltyBalance(string)", ipId)
        );
        require(success, "Failed to get balance");

        uint256 mocBalance;
        assembly {
            mocBalance := mload(add(data, 32))
        }
        require(mocBalance > 0, "No royalties to claim");

        // Convert MOC to USD (1:1 ratio)
        uint256 usdAmount = mocBalance; // 1 MOC = 1 USD

        // Get token price from oracle (price is in USD with 18 decimals, e.g., 1e18 = $1.00)
        uint256 tokenPriceUSD = priceOracle.getPrice(token);
        require(tokenPriceUSD > 0, "Invalid token price");

        // Calculate repayment amount in borrowed token (18 decimals)
        // usdAmount is in 18 decimals, tokenPriceUSD is in 18 decimals
        // We need result in 18 decimals, so: (usdAmount * 1e18) / tokenPriceUSD
        repaymentAmount = (usdAmount * 1e18) / tokenPriceUSD;

        // Cap at outstanding debt (both in 18 decimals now)
        if (repaymentAmount > debt18) {
            repaymentAmount = debt18;
        }

        // Calculate how much MOC we actually need (might be less than balance if debt is small)
        uint256 mocNeeded = (repaymentAmount * tokenPriceUSD) / 1e18;
        if (mocNeeded > mocBalance) {
            mocNeeded = mocBalance;
        }

        // Withdraw only the needed MOC from RoyaltyDistributor
        // This will mint MOC tokens to this contract
        (success, ) = royaltyDistributor.call(
            abi.encodeWithSignature(
                "withdrawRoyalties(string,uint256)",
                ipId,
                mocNeeded
            )
        );
        require(success, "Failed to withdraw royalties");

        // Burn the MOC tokens we received (convert royalty to debt repayment)
        (success, ) = mocToken.call(
            abi.encodeWithSignature(
                "burn(address,uint256)",
                address(this),
                mocNeeded
            )
        );
        // Note: If burn fails, MOC stays in contract (acceptable)

        // Convert repaymentAmount from 18 decimals to token's native decimals
        // repaymentAmount is currently in wei (18 decimals)
        // We need to convert it to the token's decimals (e.g., 6 for USDC)
        // Note: tokenDecimals already retrieved earlier
        uint256 tokenAmount;

        if (tokenDecimals < 18) {
            // Convert down from 18 decimals to token decimals
            tokenAmount = repaymentAmount / (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            // Convert up from 18 decimals to token decimals
            tokenAmount = repaymentAmount * (10 ** (tokenDecimals - 18));
        } else {
            // Same decimals, no conversion needed
            tokenAmount = repaymentAmount;
        }

        // Mint borrowed tokens to this contract (in token's native decimals)
        _mintToken(token, tokenAmount);

        // Approve LendingPool to spend tokens (in token's native decimals)
        IERC20(token).approve(address(lendingPool), tokenAmount);

        // Repay debt on behalf of user (in token's native decimals)
        lendingPool.repayOnBehalf(token, tokenAmount, msg.sender);

        // Update debt tracking - sync with actual LendingPool debt after repayment
        ILendingPool.UserPosition memory updatedPosition = lendingPool
            .getUserPosition(msg.sender, token);
        outstandingDebt[msg.sender][token] = updatedPosition.borrowed;

        // Check if debt is fully repaid
        if (outstandingDebt[msg.sender][token] == 0) {
            emit DebtFullyRepaid(ipId, msg.sender, token);
        }

        emit RoyaltiesClaimed(
            ipId,
            mocBalance,
            usdAmount,
            repaymentAmount,
            token
        );

        return repaymentAmount;
    }

    /**
     * @notice Called when IP receives new royalties (hook from RoyaltyDistributor)
     * @param ipId Story Protocol IP identifier
     * @param amount MOC tokens received
     */
    function onRoyaltyReceived(
        string memory ipId,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == royaltyDistributor, "Only RoyaltyDistributor");

        // Check if IP is locked for auto-repay
        if (!lockedIPs[ipId]) {
            // Not locked, royalties stay on IP
            return;
        }

        address user = ipOwner[ipId];
        address token = borrowedToken[ipId];

        // Query CURRENT debt from LendingPool (not stored value)
        ILendingPool.UserPosition memory position = lendingPool.getUserPosition(
            user,
            token
        );
        uint256 debt = position.borrowed; // In token's native decimals

        // Check if user still has debt
        if (debt == 0) {
            // Debt fully repaid, stop routing
            return;
        }

        // Get token decimals to convert debt to 18 decimals for calculations
        uint8 tokenDecimals = _getTokenDecimals(token);
        uint256 debt18; // Debt in 18 decimals for comparison

        if (tokenDecimals < 18) {
            // Convert up from token decimals to 18 decimals
            debt18 = debt * (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            // Convert down from token decimals to 18 decimals
            debt18 = debt / (10 ** (tokenDecimals - 18));
        } else {
            debt18 = debt;
        }

        // Convert MOC to USD (1:1)
        uint256 usdAmount = amount;

        // Get token price from oracle
        uint256 tokenPriceUSD = priceOracle.getPrice(token);
        require(tokenPriceUSD > 0, "Invalid token price");

        // Calculate repayment amount in 18 decimals
        uint256 repaymentAmount = (usdAmount * 1e18) / tokenPriceUSD;

        // Cap at debt (both in 18 decimals)
        if (repaymentAmount > debt18) {
            repaymentAmount = debt18;
        }

        // Convert repaymentAmount from 18 decimals to token's native decimals
        uint256 tokenAmount;
        if (tokenDecimals < 18) {
            tokenAmount = repaymentAmount / (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            tokenAmount = repaymentAmount * (10 ** (tokenDecimals - 18));
        } else {
            tokenAmount = repaymentAmount;
        }

        // Mint borrowed tokens (in token's native decimals)
        _mintToken(token, tokenAmount);

        // Approve and repay (in token's native decimals)
        IERC20(token).approve(address(lendingPool), tokenAmount);
        lendingPool.repayOnBehalf(token, tokenAmount, user);

        // Update debt tracking - sync with actual LendingPool debt after repayment
        ILendingPool.UserPosition memory updatedPosition = lendingPool
            .getUserPosition(user, token);
        outstandingDebt[user][token] = updatedPosition.borrowed;
        uint256 remainingDebt = updatedPosition.borrowed;

        // Check if debt is now zero
        if (remainingDebt == 0) {
            emit DebtFullyRepaid(ipId, user, token);
        }

        emit AutoRepayment(ipId, amount, tokenAmount, token, remainingDebt);
    }

    /**
     * @notice Unlock IP to restore normal royalty flow
     * @param ipId Story Protocol IP identifier
     */
    function unlockIP(string memory ipId) external nonReentrant {
        require(lockedIPs[ipId], "IP not locked");
        require(ipOwner[ipId] == msg.sender, "Not IP owner");

        // Unlock
        lockedIPs[ipId] = false;
        delete ipOwner[ipId];
        delete borrowedToken[ipId];

        emit IPUnlocked(ipId, msg.sender);
    }

    // ============ Internal Functions ============

    /**
     * @notice Mint borrowed tokens (calls mint function on token contract)
     * @param token Token address
     * @param amount Amount to mint
     */
    function _mintToken(address token, uint256 amount) internal {
        // Call mint function on the token contract
        // Assumes token has mint(address,uint256) function
        (bool success, ) = token.call(
            abi.encodeWithSignature(
                "mint(address,uint256)",
                address(this),
                amount
            )
        );
        require(success, "Token minting failed");
    }

    /**
     * @notice Get token decimals
     * @param token Token address
     * @return decimals Number of decimals
     */
    function _getTokenDecimals(address token) internal view returns (uint8) {
        // Call decimals() function on the token contract
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("decimals()")
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint8));
        }

        // Default to 18 if call fails
        return 18;
    }

    // ============ View Functions ============

    /**
     * @notice Check if an IP is locked
     * @param ipId IP identifier
     * @return locked Whether IP is locked
     */
    function isIPLocked(string memory ipId) external view returns (bool) {
        return lockedIPs[ipId];
    }

    /**
     * @notice Get IP lock info
     * @param ipId IP identifier
     * @return owner IP owner
     * @return token Borrowed token
     * @return debt Outstanding debt
     */
    function getIPLockInfo(
        string memory ipId
    ) external view returns (address owner, address token, uint256 debt) {
        owner = ipOwner[ipId];
        token = borrowedToken[ipId];
        if (owner != address(0) && token != address(0)) {
            debt = outstandingDebt[owner][token];
        }
    }

    /**
     * @notice Get user's debt for a token
     * @param user User address
     * @param token Token address
     * @return debt Outstanding debt amount
     */
    function getUserDebt(
        address user,
        address token
    ) external view returns (uint256) {
        return outstandingDebt[user][token];
    }

    /**
     * @notice Preview conversion: MOC amount to borrowed token amount
     * @param mocAmount MOC tokens
     * @param token Borrowed token address
     * @return tokenAmount Amount in borrowed token
     */
    function previewConversion(
        uint256 mocAmount,
        address token
    ) external view returns (uint256 tokenAmount) {
        uint256 usdAmount = mocAmount; // 1 MOC = 1 USD
        uint256 tokenPriceUSD = priceOracle.getPrice(token);
        require(tokenPriceUSD > 0, "Invalid token price");

        tokenAmount = (usdAmount * 1e18) / tokenPriceUSD;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update RoyaltyDistributor address (admin only)
     * @param _royaltyDistributor New address
     */
    function setRoyaltyDistributor(
        address _royaltyDistributor
    ) external onlyOwner {
        require(_royaltyDistributor != address(0), "Invalid address");
        royaltyDistributor = _royaltyDistributor;
    }

    /**
     * @notice Update PriceOracle address (admin only)
     * @param _priceOracle New address
     */
    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Invalid address");
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @notice Update LendingPool address (admin only)
     * @param _lendingPool New address
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "Invalid address");
        lendingPool = ILendingPool(_lendingPool);
    }
}
