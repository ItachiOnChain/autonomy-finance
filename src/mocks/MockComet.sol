// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Mock Comet contract for local testing
/// @dev Simulates Compound Comet (cmETH) with yield accrual
contract MockComet is ERC20 {
    IERC20 public immutable asset;
    uint256 public exchangeRate; // WAD format
    uint256 public lastAccrueTime;
    uint256 public supplyAPY; // Annual yield in WAD (e.g., 0.04e18 = 4%)
    
    event Supplied(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event YieldAccrued(uint256 newRate);
    
    constructor(
        address asset_,
        string memory name_,
        string memory symbol_,
        uint256 initialAPY_
    ) ERC20(name_, symbol_) {
        asset = IERC20(asset_);
        exchangeRate = 1e18; // Start at 1:1
        lastAccrueTime = block.timestamp;
        supplyAPY = initialAPY_;
    }
    
    /// @notice Supply assets and mint cmETH shares
    function supply(address asset_, uint256 amount) external {
        require(asset_ == address(asset), "wrong asset");
        
        // Accrue interest before supply
        _accrue();
        
        // Transfer assets from user
        asset.transferFrom(msg.sender, address(this), amount);
        
        // Mint shares at current exchange rate
        uint256 shares = (amount * 1e18) / exchangeRate;
        _mint(msg.sender, shares);
        
        emit Supplied(msg.sender, amount);
    }
    
    /// @notice Withdraw assets by burning cmETH shares
    function withdraw(address asset_, uint256 amount) external {
        require(asset_ == address(asset), "wrong asset");
        
        // Accrue interest before withdrawal
        _accrue();
        
        // Calculate shares to burn
        uint256 shares = (amount * 1e18) / exchangeRate;
        _burn(msg.sender, shares);
        
        // Transfer assets to user
        asset.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /// @notice Accrue yield by increasing exchange rate
    function _accrue() internal {
        uint256 timeElapsed = block.timestamp - lastAccrueTime;
        if (timeElapsed == 0) return;
        
        // Calculate yield: rate * time * APY / seconds_per_year
        uint256 secondsPerYear = 365 days;
        uint256 yield = (exchangeRate * timeElapsed * supplyAPY) / (secondsPerYear * 1e18);
        
        exchangeRate += yield;
        lastAccrueTime = block.timestamp;
        
        emit YieldAccrued(exchangeRate);
    }
    
    /// @notice Get current exchange rate
    function getExchangeRate() external view returns (uint256) {
        return exchangeRate;
    }
    
    /// @notice Set APY (for testing)
    function setAPY(uint256 newAPY) external {
        _accrue();
        supplyAPY = newAPY;
    }
    
    /// @notice Force accrue (for testing)
    function accrue() external {
        _accrue();
    }
}
