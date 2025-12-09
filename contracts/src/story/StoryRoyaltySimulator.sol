// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoyaltyToken.sol";
import "./AutoRepayVault.sol";

/**
 * @title StoryRoyaltySimulator
 * @notice Simulates derivative creation and mints real royalty tokens
 * @dev Routes tokens based on IP lock status (auto-repay vs accumulate)
 */
contract StoryRoyaltySimulator {
    /// @notice The royalty token contract
    RoyaltyToken public immutable royaltyToken;

    /// @notice The auto-repay vault contract (for lock status and routing)
    AutoRepayVault public immutable autoRepayVault;

    /// @notice Default royalty amount per derivative (100 tokens with 18 decimals)
    uint256 public constant ROYALTY_PER_DERIVATIVE = 100 * 10 ** 18;

    /// @notice Maximum derivatives per simulation
    uint256 public constant MAX_DERIVATIVES = 100;

    /// @notice Emitted when royalties are simulated
    event RoyaltiesSimulated(
        address indexed ipId,
        address indexed owner,
        uint256 derivativeCount,
        uint256 totalRoyalties,
        bool isLocked,
        uint256 timestamp
    );

    constructor(address _royaltyToken, address _autoRepayVault) {
        require(_royaltyToken != address(0), "Invalid royalty token");
        // Allow zero address for autoRepayVault for standalone deployment
        royaltyToken = RoyaltyToken(_royaltyToken);
        autoRepayVault = AutoRepayVault(_autoRepayVault);
    }

    /**
     * @notice Simulate derivative creation and mint royalty tokens
     * @param ipId The Story Protocol IP identifier (address format)
     * @param derivativeCount Number of derivatives to simulate (1-100)
     */
    function simulateRoyalties(address ipId, uint256 derivativeCount) external {
        require(ipId != address(0), "Invalid IP ID");
        require(
            derivativeCount > 0 && derivativeCount <= MAX_DERIVATIVES,
            "Invalid derivative count"
        );

        // Calculate total royalties
        uint256 totalRoyalties = derivativeCount * ROYALTY_PER_DERIVATIVE;

        // Check if IP is locked (only if vault is set)
        bool isLocked = address(autoRepayVault) != address(0) &&
            autoRepayVault.isIPLocked(ipId);

        // If locked, mint to Vault inside (for auto-processing), else mint to IP
        if (isLocked) {
            royaltyToken.mintRoyalties(address(autoRepayVault), totalRoyalties);
            autoRepayVault.routeRoyalties(ipId, totalRoyalties);
        } else {
            royaltyToken.mintRoyalties(ipId, totalRoyalties);
        }

        emit RoyaltiesSimulated(
            ipId,
            msg.sender,
            derivativeCount,
            totalRoyalties,
            isLocked,
            block.timestamp
        );
    }

    /**
     * @notice Simulate royalties with custom amount per derivative
     * @param ipId The Story Protocol IP identifier
     * @param derivativeCount Number of derivatives
     * @param amountPerDerivative Custom royalty amount per derivative
     */
    function simulateRoyaltiesCustom(
        address ipId,
        uint256 derivativeCount,
        uint256 amountPerDerivative
    ) external {
        require(ipId != address(0), "Invalid IP ID");
        require(
            derivativeCount > 0 && derivativeCount <= MAX_DERIVATIVES,
            "Invalid derivative count"
        );
        require(amountPerDerivative > 0, "Invalid amount");

        uint256 totalRoyalties = derivativeCount * amountPerDerivative;

        // Check if IP is locked (only if vault is set)
        bool isLocked = address(autoRepayVault) != address(0) &&
            autoRepayVault.isIPLocked(ipId);

        if (isLocked) {
            royaltyToken.mintRoyalties(address(autoRepayVault), totalRoyalties);
            autoRepayVault.routeRoyalties(ipId, totalRoyalties);
        } else {
            royaltyToken.mintRoyalties(ipId, totalRoyalties);
        }

        emit RoyaltiesSimulated(
            ipId,
            msg.sender,
            derivativeCount,
            totalRoyalties,
            isLocked,
            block.timestamp
        );
    }

    /**
     * @notice Get total royalties earned by an IP
     * @param ipId The IP identifier
     */
}
