// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUniswapRouter
 * @notice Mock Uniswap V2 Router for local testing
 * @dev Simulates token swaps with configurable exchange rates
 */
contract MockUniswapRouter is Ownable {
    using SafeERC20 for IERC20;
    
    // Token pair => exchange rate (in 18 decimals)
    // Rate represents how much tokenOut you get per 1 tokenIn
    mapping(address => mapping(address => uint256)) public exchangeRates;
    
    // Slippage simulation (in basis points)
    uint256 public simulatedSlippage = 50; // 0.5% default
    
    // Events
    event ExchangeRateSet(address indexed tokenIn, address indexed tokenOut, uint256 rate);
    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Set exchange rate for a token pair
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param rate Exchange rate (18 decimals)
     */
    function setExchangeRate(address tokenIn, address tokenOut, uint256 rate) external onlyOwner {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid tokens");
        require(rate > 0, "Rate must be > 0");
        
        exchangeRates[tokenIn][tokenOut] = rate;
        
        emit ExchangeRateSet(tokenIn, tokenOut, rate);
    }
    
    /**
     * @notice Set simulated slippage
     * @param slippageBps Slippage in basis points
     */
    function setSimulatedSlippage(uint256 slippageBps) external onlyOwner {
        require(slippageBps <= 1000, "Slippage too high"); // Max 10%
        simulatedSlippage = slippageBps;
    }
    
    /**
     * @notice Swap exact tokens for tokens (Uniswap V2 interface)
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses (path[0] = tokenIn, path[path.length-1] = tokenOut)
     * @param to Recipient address
     * @param deadline Transaction deadline (ignored in mock)
     * @return amounts Array of amounts for each step in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        require(amountIn > 0, "Amount must be > 0");
        require(to != address(0), "Invalid recipient");
        require(deadline >= block.timestamp, "Expired");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        // Get exchange rate
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "No exchange rate set");
        
        // Calculate output amount
        uint256 amountOut = calculateAmountOut(tokenIn, tokenOut, amountIn);
        
        // Check slippage
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(to, amountOut);
        
        // Prepare return array
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
        
        // Fill intermediate amounts (simplified for mock)
        for (uint256 i = 1; i < path.length - 1; i++) {
            amounts[i] = amountIn; // Simplified
        }
        
        emit Swap(tokenIn, tokenOut, amountIn, amountOut, to);
        
        return amounts;
    }
    
    /**
     * @notice Calculate output amount for a swap
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @return amountOut Output amount (with simulated slippage)
     */
    function calculateAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256) {
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "No exchange rate");
        
        // Get token decimals
        uint8 decimalsIn = IERC20Metadata(tokenIn).decimals();
        uint8 decimalsOut = IERC20Metadata(tokenOut).decimals();
        
        // Calculate base amount out
        // amountOut = amountIn * rate / 1e18, adjusted for decimals
        uint256 baseAmountOut = (amountIn * rate) / 1e18;
        
        // Adjust for decimal differences
        if (decimalsOut > decimalsIn) {
            baseAmountOut = baseAmountOut * (10 ** (decimalsOut - decimalsIn));
        } else if (decimalsIn > decimalsOut) {
            baseAmountOut = baseAmountOut / (10 ** (decimalsIn - decimalsOut));
        }
        
        // Apply simulated slippage
        uint256 amountOut = (baseAmountOut * (10000 - simulatedSlippage)) / 10000;
        
        return amountOut;
    }
    
    /**
     * @notice Get amounts out for a path (Uniswap V2 interface)
     * @param amountIn Input amount
     * @param path Token path
     * @return amounts Output amounts for each step
     */
    function getAmountsOut(uint256 amountIn, address[] calldata path) 
        external 
        view 
        returns (uint256[] memory amounts) 
    {
        require(path.length >= 2, "Invalid path");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        amounts[path.length - 1] = calculateAmountOut(tokenIn, tokenOut, amountIn);
        
        // Fill intermediate amounts (simplified)
        for (uint256 i = 1; i < path.length - 1; i++) {
            amounts[i] = amountIn;
        }
        
        return amounts;
    }
    
    /**
     * @notice Withdraw stuck tokens (owner only)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
