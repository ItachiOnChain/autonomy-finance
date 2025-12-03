// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IIPManager.sol";
import "./interfaces/IAutonomyVault.sol";
import "./libraries/Errors.sol";

/**
 * @title IPManager
 * @notice Manages IP assets from Story Protocol for collateralization
 * @dev Handles IP ownership transfer, royalty collection, and return logic
 */
contract IPManager is IIPManager, Ownable, ReentrancyGuard {
    IAutonomyVault public vault;
    address public autoRepayEngine;

    // ===== IPA Collateral Registry =====

    // IPA ID => owner address
    mapping(bytes32 => address) public ipaOwner;

    // IPA ID => collateral value (in USD, 18 decimals)
    mapping(bytes32 => uint256) public ipaCollateralValue;

    // IPA ID => lending position (vault address)
    mapping(bytes32 => address) public ipaLendingPosition;

    // User => IPA ID (for quick lookup)
    mapping(address => bytes32) public userIPA;

    // ===== Multi-Token Royalty Tracking =====

    // IPA ID => token address => royalty balance
    mapping(bytes32 => mapping(address => uint256)) public royaltyBalances;

    // ===== Legacy Support (deprecated) =====

    // Mapping from user to their locked IP asset (legacy, for backward compatibility)
    mapping(address => address) private lockedIP;

    // Legacy royalty balances (address-based)
    mapping(address => uint256) private legacyRoyaltyBalances;

    // ===== Events =====

    // Events are inherited from IIPManager interface

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set the vault contract
     * @param _vault Address of AutonomyVault contract
     */
    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert Errors.ZeroAddress();
        vault = IAutonomyVault(_vault);
    }

    /**
     * @notice Set the auto repay engine contract
     * @param _autoRepayEngine Address of AutoRepayEngine contract
     */
    function setAutoRepayEngine(address _autoRepayEngine) external onlyOwner {
        if (_autoRepayEngine == address(0)) revert Errors.ZeroAddress();
        autoRepayEngine = _autoRepayEngine;
    }

    // ===== IPA Collateral Registry Functions =====

    /**
     * @notice Lock IPA as collateral
     * @param ipaId IPA ID (bytes32 from Story Protocol)
     * @param owner Owner of the IPA
     * @param collateralValue Collateral value in USD (18 decimals)
     */
    function lockIPA(
        bytes32 ipaId,
        address owner,
        uint256 collateralValue
    ) external nonReentrant {
        require(owner != address(0), "Invalid owner");
        require(msg.sender == owner, "Unauthorized");
        // Allow zero collateral for auto-repay-only use case
        // Collateral value validation moved to borrow function
        require(ipaOwner[ipaId] == address(0), "IPA already locked");
        require(userIPA[owner] == bytes32(0), "User already has locked IPA");

        // Register IPA
        ipaOwner[ipaId] = owner;
        ipaCollateralValue[ipaId] = collateralValue;
        ipaLendingPosition[ipaId] = address(vault);
        userIPA[owner] = ipaId;

        // Link to vault position
        vault.linkIP(owner, address(uint160(uint256(ipaId)))); // Convert bytes32 to address for legacy support

        emit IPALocked(ipaId, owner, collateralValue);
    }

    /**
     * @notice Unlock IPA (only when debt is zero)
     * @param ipaId IPA ID
     */
    function unlockIPA(bytes32 ipaId) external nonReentrant {
        address owner = ipaOwner[ipaId];
        require(owner != address(0), "IPA not locked");
        require(
            msg.sender == owner || msg.sender == address(vault),
            "Unauthorized"
        );

        // Verify debt is zero
        IAutonomyVault.Position memory position = vault.getPosition(owner);
        if (position.debtAmount > 0) revert Errors.DebtNotZero();

        // Clear IPA registration
        delete ipaOwner[ipaId];
        delete ipaCollateralValue[ipaId];
        delete ipaLendingPosition[ipaId];
        delete userIPA[owner];

        emit IPAUnlocked(ipaId, owner);
    }

    /**
     * @notice Update IPA collateral value
     * @param ipaId IPA ID
     * @param newValue New collateral value
     */
    function updateIPACollateralValue(
        bytes32 ipaId,
        uint256 newValue
    ) external onlyOwner {
        require(ipaOwner[ipaId] != address(0), "IPA not locked");
        require(newValue > 0, "Invalid value");

        uint256 oldValue = ipaCollateralValue[ipaId];
        ipaCollateralValue[ipaId] = newValue;

        emit IPACollateralValueUpdated(ipaId, oldValue, newValue);
    }

    /**
     * @notice Get IPA collateral value
     * @param ipaId IPA ID
     * @return value Collateral value in USD (18 decimals)
     */
    function getIPACollateralValue(
        bytes32 ipaId
    ) external view returns (uint256) {
        return ipaCollateralValue[ipaId];
    }

    /**
     * @notice Get IPA owner
     * @param ipaId IPA ID
     * @return owner Owner address
     */
    function getIPAOwner(bytes32 ipaId) external view returns (address) {
        return ipaOwner[ipaId];
    }

    /**
     * @notice Check if IPA is locked
     * @param ipaId IPA ID
     * @return locked True if locked
     */
    function isIPALocked(bytes32 ipaId) external view returns (bool) {
        return ipaOwner[ipaId] != address(0);
    }

    // ===== Multi-Token Royalty Functions =====

    /**
     * @notice Deposit royalties for an IPA
     * @param ipaId IPA ID
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositRoyalties(
        bytes32 ipaId,
        address token,
        uint256 amount
    ) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        royaltyBalances[ipaId][token] += amount;

        emit RoyaltyDeposited(ipaId, token, amount);
    }

    /**
     * @notice Withdraw royalties for repayment
     * @param ipaId IPA ID
     * @param token Token address
     * @param amount Amount to withdraw
     * @return withdrawn Actual amount withdrawn
     */
    function withdrawRoyalties(
        bytes32 ipaId,
        address token,
        uint256 amount
    ) external returns (uint256) {
        require(
            msg.sender == owner() ||
                msg.sender == autoRepayEngine ||
                msg.sender == ipaOwner[ipaId],
            "Unauthorized"
        );

        uint256 available = royaltyBalances[ipaId][token];
        uint256 withdrawn = amount > available ? available : amount;

        if (withdrawn > 0) {
            royaltyBalances[ipaId][token] -= withdrawn;
            emit RoyaltyWithdrawn(ipaId, token, withdrawn, msg.sender);
        }

        return withdrawn;
    }

    /**
     * @notice Get royalty balance for an IPA and token
     * @param ipaId IPA ID
     * @param token Token address
     * @return balance Royalty balance
     */
    function getRoyaltyBalance(
        bytes32 ipaId,
        address token
    ) external view returns (uint256) {
        return royaltyBalances[ipaId][token];
    }

    // ===== Legacy Functions (for backward compatibility) =====

    /**
     * @notice Accept IP asset from user
     * @param user User transferring the IP
     * @param ipAsset Address of the IP asset (Story Protocol NFT)
     */
    function acceptIP(address user, address ipAsset) external nonReentrant {
        if (ipAsset == address(0)) revert Errors.ZeroAddress();
        if (lockedIP[user] != address(0)) revert Errors.IPAlreadyLocked();

        // In production, this would transfer Story Protocol IP ownership
        // For MVP, we just track the association
        lockedIP[user] = ipAsset;

        // Link IP to user's vault position
        vault.linkIP(user, ipAsset);

        emit IPAccepted(user, ipAsset);
    }

    /**
     * @notice Return IP asset to user (when debt is zero)
     * @param user User to return IP to
     */
    function returnIP(address user) external nonReentrant {
        if (msg.sender != address(vault)) revert Errors.UnauthorizedCaller();

        address ipAsset = lockedIP[user];
        bytes32 ipaId = userIPA[user];

        if (ipAsset == address(0) && ipaId == bytes32(0))
            revert Errors.IPNotLocked();

        // Verify debt is zero
        IAutonomyVault.Position memory position = vault.getPosition(user);
        if (position.debtAmount > 0) revert Errors.DebtNotZero();

        // Handle legacy IP
        if (ipAsset != address(0)) {
            delete lockedIP[user];
            emit IPReturned(user, ipAsset);
        }

        // Handle new IPA
        if (ipaId != bytes32(0)) {
            delete ipaOwner[ipaId];
            delete ipaCollateralValue[ipaId];
            delete ipaLendingPosition[ipaId];
            delete userIPA[user];
            emit IPAUnlocked(ipaId, user);
        }
    }

    /**
     * @notice Collect royalties from IP asset
     * @param ipAsset IP asset to collect from
     * @return amount Amount of royalties collected
     */
    function collectRoyalties(
        address ipAsset
    ) external nonReentrant returns (uint256) {
        if (ipAsset == address(0)) revert Errors.ZeroAddress();

        // In production, this would call Story Protocol royalty modules
        // For MVP/testing, we simulate royalty collection
        // This would be replaced with actual Story Protocol integration:
        // uint256 royalties = IStoryRoyaltyModule(storyModule).collectRoyalties(ipAsset);

        uint256 royalties = 0; // Placeholder - would be actual royalties from Story

        if (royalties > 0) {
            legacyRoyaltyBalances[ipAsset] += royalties;
            emit RoyaltiesCollected(ipAsset, royalties);
        }

        return royalties;
    }

    /**
     * @notice Simulate royalty deposit (for testing)
     * @param ipAsset IP asset
     * @param amount Amount to deposit
     */
    function depositRoyalties(address ipAsset, uint256 amount) external {
        if (ipAsset == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount();

        legacyRoyaltyBalances[ipAsset] += amount;
        emit RoyaltiesCollected(ipAsset, amount);
    }

    /**
     * @notice Get royalty balance for IP asset
     * @param ipAsset IP asset address
     * @return balance Royalty balance
     */
    function getRoyaltyBalance(
        address ipAsset
    ) external view returns (uint256) {
        return legacyRoyaltyBalances[ipAsset];
    }

    /**
     * @notice Withdraw royalties for repayment
     * @param ipAsset IP asset
     * @param amount Amount to withdraw
     */
    function withdrawRoyalties(
        address ipAsset,
        uint256 amount
    ) external returns (uint256) {
        if (msg.sender != owner() && msg.sender != autoRepayEngine)
            revert Errors.UnauthorizedCaller();

        uint256 available = legacyRoyaltyBalances[ipAsset];
        uint256 withdrawAmount = amount > available ? available : amount;

        if (withdrawAmount > 0) {
            legacyRoyaltyBalances[ipAsset] -= withdrawAmount;
        }

        return withdrawAmount;
    }

    /**
     * @notice Get locked IP for user
     * @param user User address
     * @return ipAsset Locked IP asset address
     */
    function getLockedIP(address user) external view returns (address) {
        return lockedIP[user];
    }

    /**
     * @notice Check if user has locked IP
     * @param user User address
     * @return locked True if IP is locked
     */
    function isIPLocked(address user) external view returns (bool) {
        return lockedIP[user] != address(0);
    }
}
