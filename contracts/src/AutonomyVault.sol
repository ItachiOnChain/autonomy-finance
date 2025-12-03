// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAutonomyVault.sol";
import "./interfaces/IIPManager.sol";
import "./libraries/Errors.sol";

/**
 * @title AutonomyVault
 * @notice Core lending/borrowing vault with dual collateral support (ERC20 + IP)
 * @dev Inspired by Alchemix V3 architecture
 */
contract AutonomyVault is IAutonomyVault, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // State variables
    IERC20 public immutable collateralToken;
    IIPManager public ipManager;
    address public autoRepayEngine;
    
    uint256 public constant MAX_LTV = 7500; // 75% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    mapping(address => Position) private positions;
    
    constructor(address _collateralToken) Ownable(msg.sender) {
        if (_collateralToken == address(0)) revert Errors.ZeroAddress();
        collateralToken = IERC20(_collateralToken);
    }
    
    /**
     * @notice Set the IP manager contract
     * @param _ipManager Address of IPManager contract
     */
    function setIPManager(address _ipManager) external onlyOwner {
        if (_ipManager == address(0)) revert Errors.ZeroAddress();
        ipManager = IIPManager(_ipManager);
    }
    
    /**
     * @notice Set the auto repay engine contract
     * @param _autoRepayEngine Address of AutoRepayEngine contract
     */
    function setAutoRepayEngine(address _autoRepayEngine) external onlyOwner {
        if (_autoRepayEngine == address(0)) revert Errors.ZeroAddress();
        autoRepayEngine = _autoRepayEngine;
    }
    
    /**
     * @notice Deposit collateral to the vault
     * @param amount Amount of collateral to deposit
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        if (amount == 0) revert Errors.InvalidAmount();
        
        Position storage position = positions[msg.sender];
        position.collateralAmount += amount;
        
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit CollateralDeposited(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw collateral from the vault
     * @param amount Amount of collateral to withdraw
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        if (amount == 0) revert Errors.InvalidAmount();
        
        Position storage position = positions[msg.sender];
        if (position.collateralAmount < amount) revert Errors.InsufficientBalance();
        
        // Check if withdrawal would violate LTV
        uint256 newCollateral = position.collateralAmount - amount;
        if (position.debtAmount > 0) {
            uint256 maxDebt = (newCollateral * MAX_LTV) / BASIS_POINTS;
            if (position.debtAmount > maxDebt) revert Errors.ExceedsMaxLTV();
        }
        
        position.collateralAmount = newCollateral;
        
        collateralToken.safeTransfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Borrow against collateral
     * @param amount Amount to borrow
     */
    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert Errors.InvalidAmount();
        
        Position storage position = positions[msg.sender];
        
        uint256 maxBorrow = getMaxBorrowAmount(msg.sender);
        if (amount > maxBorrow) revert Errors.ExceedsMaxLTV();
        
        position.debtAmount += amount;
        
        // Transfer borrowed amount to user
        collateralToken.safeTransfer(msg.sender, amount);
        
        emit Borrowed(msg.sender, amount);
    }
    
    /**
     * @notice Repay debt
     * @param amount Amount to repay
     */
    function repay(uint256 amount) external nonReentrant {
        if (amount == 0) revert Errors.InvalidAmount();
        
        Position storage position = positions[msg.sender];
        if (position.debtAmount == 0) revert Errors.NoDebt();
        
        uint256 repayAmount = amount > position.debtAmount ? position.debtAmount : amount;
        position.debtAmount -= repayAmount;
        
        collateralToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        
        emit Repaid(msg.sender, repayAmount);
        
        // If debt is zero and IP is locked, trigger return
        if (position.debtAmount == 0 && position.hasIP) {
            ipManager.returnIP(msg.sender);
            position.hasIP = false;
            position.ipAsset = address(0);
        }
    }
    
    /**
     * @notice Reduce debt (called by AutoRepayEngine)
     * @param user User whose debt to reduce
     * @param amount Amount to reduce
     */
    function reduceDebt(address user, uint256 amount) external nonReentrant {
        if (msg.sender != address(ipManager) && msg.sender != autoRepayEngine && msg.sender != owner()) {
            revert Errors.UnauthorizedCaller();
        }
        
        Position storage position = positions[user];
        if (position.debtAmount == 0) revert Errors.NoDebt();
        
        uint256 reductionAmount = amount > position.debtAmount ? position.debtAmount : amount;
        position.debtAmount -= reductionAmount;
        
        emit DebtReduced(user, reductionAmount, position.debtAmount);
        
        // If debt is zero and IP is locked, trigger return
        if (position.debtAmount == 0 && position.hasIP) {
            ipManager.returnIP(user);
            position.hasIP = false;
            position.ipAsset = address(0);
        }
    }
    
    /**
     * @notice Link IP asset to user position
     * @param user User address
     * @param ipAsset IP asset address
     */
    function linkIP(address user, address ipAsset) external {
        if (msg.sender != address(ipManager)) revert Errors.UnauthorizedCaller();
        
        Position storage position = positions[user];
        position.ipAsset = ipAsset;
        position.hasIP = true;
    }
    
    /**
     * @notice Get user position
     * @param user User address
     * @return position User's position
     */
    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }
    
    /**
     * @notice Get maximum borrow amount for user
     * @param user User address
     * @return maxBorrow Maximum amount user can borrow
     */
    function getMaxBorrowAmount(address user) public view returns (uint256) {
        Position memory position = positions[user];
        
        uint256 maxDebt = (position.collateralAmount * MAX_LTV) / BASIS_POINTS;
        
        if (maxDebt <= position.debtAmount) return 0;
        
        return maxDebt - position.debtAmount;
    }
}
