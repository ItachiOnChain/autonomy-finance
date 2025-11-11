// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC20Minimal.sol";
import "./ITokenAdapter.sol";

/// @notice Core Autonomy V1 interface for Mantle MVP
interface IAutonomyV1 {
    // Events
    event Deposit(address indexed sender, address indexed yieldToken, uint256 amount, uint256 shares);
    event Withdraw(address indexed sender, address indexed yieldToken, uint256 amount, uint256 shares);
    event Mint(address indexed sender, address indexed debtToken, uint256 amount);
    event Repay(address indexed sender, address indexed debtToken, uint256 amount);
    event Harvest(address indexed yieldToken, uint256 yield);
    event Liquidate(address indexed account, address indexed yieldToken, uint256 shares);

    // View functions
    function getTotalDeposited(address yieldToken) external view returns (uint256);
    function getTotalDebt(address debtToken) external view returns (uint256);
    function getDebt(address account, address debtToken) external view returns (uint256);
    function getCollateralValue(address account) external view returns (uint256);
    function getDebtValue(address account) external view returns (uint256);
    function getLiquidationLimit(address account) external view returns (uint256);
    function isLiquidatable(address account) external view returns (bool);

    // User functions
    function deposit(address yieldToken, uint256 amount, address recipient) external returns (uint256);
    function withdraw(address yieldToken, uint256 shares, address recipient) external returns (uint256);
    function mint(address debtToken, uint256 amount, address recipient) external;
    function repay(address debtToken, uint256 amount, address recipient) external;
    function liquidate(address account, address yieldToken, uint256 shares) external;

    // Keeper functions
    function harvest(address yieldToken) external returns (uint256);
}

