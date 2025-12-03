// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILendingPool
 * @notice Interface for the multi-asset lending pool
 */
interface ILendingPool {
    struct AssetConfig {
        bool isActive;
        bool canBeCollateral;
        uint256 maxLTV; // Basis points (7500 = 75%)
        uint256 liquidationThreshold; // Basis points
        uint256 liquidationBonus; // Basis points
    }

    struct UserPosition {
        uint256 supplied;
        uint256 borrowed;
        uint256 lastUpdateTimestamp;
    }

    // Events
    event Supply(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Liquidation(address indexed liquidator, address indexed borrower, address indexed collateralAsset, address debtAsset, uint256 debtToCover, uint256 liquidatedCollateral);
    
    // E-Mode events
    event UserEModeSet(address indexed user, uint8 categoryId);
    event EModeAssetCategorySet(address indexed asset, uint8 categoryId);
    event EModeCategoryConfigured(uint8 indexed categoryId, uint256 ltv, uint256 liquidationThreshold, string label);

    // Core functions
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function borrow(address asset, uint256 amount) external;
    function repay(address asset, uint256 amount) external;
    function repayOnBehalf(address asset, uint256 amount, address onBehalfOf) external;

    // View functions
    function getUserPosition(address user, address asset) external view returns (UserPosition memory);
    function getTotalSupply(address asset) external view returns (uint256);
    function getTotalBorrowed(address asset) external view returns (uint256);
    function getAvailableLiquidity(address asset) external view returns (uint256);
    function getUtilizationRate(address asset) external view returns (uint256);
    function getUserHealthFactor(address user) external view returns (uint256);
    function getUserTotalCollateralValue(address user) external view returns (uint256);
    function getUserTotalDebtValue(address user) external view returns (uint256);
}