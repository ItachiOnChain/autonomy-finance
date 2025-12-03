// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title PriceOracle
 * @notice Mock price oracle for local testing
 */
contract PriceOracle is IPriceOracle, Ownable {
    mapping(address => uint256) private prices;

    event PriceUpdated(address indexed asset, uint256 price);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Get the price of an asset in USD (18 decimals)
     */
    function getPrice(address asset) external view override returns (uint256) {
        uint256 price = prices[asset];
        require(price > 0, "PriceOracle: Price not set");
        return price;
    }

    /**
     * @notice Set the price of an asset (admin only)
     */
    function setPrice(address asset, uint256 price) external override onlyOwner {
        require(price > 0, "PriceOracle: Invalid price");
        prices[asset] = price;
        emit PriceUpdated(asset, price);
    }

    /**
     * @notice Batch set prices for multiple assets
     */
    function setPrices(address[] calldata assets, uint256[] calldata _prices) external onlyOwner {
        require(assets.length == _prices.length, "PriceOracle: Length mismatch");
        for (uint256 i = 0; i < assets.length; i++) {
            require(_prices[i] > 0, "PriceOracle: Invalid price");
            prices[assets[i]] = _prices[i];
            emit PriceUpdated(assets[i], _prices[i]);
        }
    }
}
