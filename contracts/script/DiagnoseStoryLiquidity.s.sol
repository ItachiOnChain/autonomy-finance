// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title DiagnoseStoryLiquidity
 * @notice Diagnostic script to verify on-chain liquidity on Story Aeneid
 */
contract DiagnoseStoryLiquidity is Script {
    // Story Aeneid deployed addresses
    address constant LENDING_POOL = 0xF342E904702b1D021F03f519D6D9614916b03f37;

    address constant USDC = 0x70E5370b8981Abc6e14C91F4AcE823954EFC8eA3;
    address constant USDT = 0x4000F8820522AC96C4221b299876e3e53bCc8525;
    address constant WETH = 0x9338CA7d556248055f5751d85cDA7aD6eF254433;
    address constant WBTC = 0x9c65f85425c619A6cB6D29fF8d57ef696323d188;
    address constant DAI = 0x7Cf4be31f546c04787886358b9486ca3d62B9acf;
    address constant LINK = 0x33E45b187da34826aBCEDA1039231Be46f1b05Af;
    address constant UNI = 0x0c626FC4A447b01554518550e30600136864640B;
    address constant AAVE = 0xA21DDc1f17dF41589BC6A5209292AED2dF61Cc94;

    struct AssetInfo {
        string symbol;
        address tokenAddress;
        uint8 decimals;
    }

    function run() external view {
        console.log(
            "================================================================================"
        );
        console.log("Story Aeneid Liquidity Diagnosis");
        console.log("Chain ID: 1315");
        console.log("LendingPool:", LENDING_POOL);
        console.log(
            "================================================================================"
        );

        AssetInfo[] memory assets = new AssetInfo[](8);
        assets[0] = AssetInfo("USDC", USDC, 6);
        assets[1] = AssetInfo("USDT", USDT, 6);
        assets[2] = AssetInfo("WETH", WETH, 18);
        assets[3] = AssetInfo("WBTC", WBTC, 8);
        assets[4] = AssetInfo("DAI", DAI, 18);
        assets[5] = AssetInfo("LINK", LINK, 18);
        assets[6] = AssetInfo("UNI", UNI, 18);
        assets[7] = AssetInfo("AAVE", AAVE, 18);

        LendingPool pool = LendingPool(LENDING_POOL);

        for (uint i = 0; i < assets.length; i++) {
            AssetInfo memory asset = assets[i];

            console.log("\n--- %s ---", asset.symbol);
            console.log("Token Address:", asset.tokenAddress);

            // Get pool's balance of this token
            uint256 poolBalance = IERC20(asset.tokenAddress).balanceOf(
                LENDING_POOL
            );
            console.log("Pool Balance (raw):", poolBalance);
            console.log(
                "Pool Balance (formatted):",
                _formatAmount(poolBalance, asset.decimals)
            );

            // Get reserve data from LendingPool
            uint256 totalSupplied = pool.getTotalSupply(asset.tokenAddress);
            uint256 totalBorrowed = pool.getTotalBorrowed(asset.tokenAddress);
            uint256 availableLiquidity = pool.getAvailableLiquidity(
                asset.tokenAddress
            );
            uint256 utilizationRate = pool.getUtilizationRate(
                asset.tokenAddress
            );

            console.log(
                "Total Supplied:",
                _formatAmount(totalSupplied, asset.decimals)
            );
            console.log(
                "Total Borrowed:",
                _formatAmount(totalBorrowed, asset.decimals)
            );
            console.log(
                "Available Liquidity:",
                _formatAmount(availableLiquidity, asset.decimals)
            );
            console.log("Utilization Rate:", utilizationRate, "bps");

            // Get APRs
            uint256 supplyAPR = pool.getSupplyAPR(asset.tokenAddress);
            uint256 borrowAPR = pool.getBorrowAPR(asset.tokenAddress);

            console.log(
                "Supply APR: %s bps = %s %",
                supplyAPR,
                _bpsToPercent(supplyAPR)
            );
            console.log(
                "Borrow APR: %s bps = %s %",
                borrowAPR,
                _bpsToPercent(borrowAPR)
            );
        }

        console.log(
            "\n================================================================================"
        );
        console.log("Diagnosis Complete");
        console.log(
            "================================================================================"
        );
    }

    function _formatAmount(
        uint256 amount,
        uint8 decimals
    ) internal pure returns (string memory) {
        if (amount == 0) return "0";

        uint256 whole = amount / (10 ** decimals);
        uint256 fraction = amount % (10 ** decimals);

        if (fraction == 0) {
            return string(abi.encodePacked(_uint2str(whole)));
        }

        return
            string(
                abi.encodePacked(_uint2str(whole), ".", _uint2str(fraction))
            );
    }

    function _bpsToPercent(uint256 bps) internal pure returns (string memory) {
        uint256 percent = bps / 100;
        uint256 decimal = bps % 100;

        if (decimal == 0) {
            return string(abi.encodePacked(_uint2str(percent)));
        }

        return
            string(
                abi.encodePacked(_uint2str(percent), ".", _uint2str(decimal))
            );
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
