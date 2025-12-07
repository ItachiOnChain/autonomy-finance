// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingPool.sol";

/**
 * @title DiagnoseStoryAeneid
 * @notice Diagnostic script to check on-chain state on Story Aeneid
 * @dev This script reads the actual deployed contract state to determine
 *      why "Available" liquidity shows 0 in the frontend.
 *
 * Usage:
 * forge script script/DiagnoseStoryAeneid.s.sol:DiagnoseStoryAeneid \
 *   --rpc-url https://aeneid.storyrpc.io \
 *   --private-key $STORY_PRIVATE_KEY
 */
contract DiagnoseStoryAeneid is Script {
    // Deployed contract addresses on Story Aeneid (from deployment)
    address constant LENDING_POOL = 0xF342E904702b1D021F03f519D6D9614916b03f37;

    // Token addresses
    address constant USDC = 0x70E5370b8981Abc6e14C91F4AcE823954EFC8eA3;
    address constant USDT = 0x4000F8820522AC96C4221b299876e3e53bCc8525;
    address constant WETH = 0x9338CA7d556248055f5751d85cDA7aD6eF254433;
    address constant WBTC = 0x9c65f85425c619A6cB6D29fF8d57ef696323d188;
    address constant DAI = 0x7Cf4be31f546c04787886358b9486ca3d62B9acf;
    address constant LINK = 0x33E45b187da34826aBCEDA1039231Be46f1b05Af;
    address constant UNI = 0x0c626FC4A447b01554518550e30600136864640B;
    address constant AAVE = 0xA21DDc1f17dF41589BC6A5209292AED2dF61Cc94;

    function run() external view {
        console.log("================================================");
        console.log("   STORY AENEID LIQUIDITY DIAGNOSTIC");
        console.log("================================================");
        console.log("");
        console.log("Network: Story Aeneid Testnet (Chain ID: 1315)");
        console.log("LendingPool:", LENDING_POOL);
        console.log("");

        LendingPool pool = LendingPool(LENDING_POOL);

        // Check each asset
        _checkAsset(pool, "USDC", USDC, 6);
        _checkAsset(pool, "USDT", USDT, 6);
        _checkAsset(pool, "WETH", WETH, 18);
        _checkAsset(pool, "WBTC", WBTC, 8);
        _checkAsset(pool, "DAI", DAI, 18);
        _checkAsset(pool, "LINK", LINK, 18);
        _checkAsset(pool, "UNI", UNI, 18);
        _checkAsset(pool, "AAVE", AAVE, 18);

        console.log("");
        console.log("================================================");
        console.log("DIAGNOSIS:");
        console.log("");
        console.log("If all values above are 0:");
        console.log("  -> Initial liquidity seeding did NOT execute");
        console.log("  -> Likely cause: seedLiquidity() calls failed silently");
        console.log("  -> Solution: Re-run deployment or manually seed");
        console.log("");
        console.log("If values are non-zero:");
        console.log("  -> Liquidity exists on-chain");
        console.log("  -> Frontend config issue (wrong addresses/chainId)");
        console.log("  -> Check frontend contracts.ts for chainId 1315");
        console.log("================================================");
        console.log("");
    }

    function _checkAsset(
        LendingPool pool,
        string memory symbol,
        address asset,
        uint8 decimals
    ) private view {
        console.log("----------------------------------------");
        console.log("Asset:", symbol);
        console.log("Address:", asset);

        try pool.getAvailableLiquidity(asset) returns (uint256 available) {
            console.log("Available Liquidity:", available);

            // Convert to human-readable
            if (decimals == 6) {
                console.log("  (Human readable:", available / 1e6, symbol, ")");
            } else if (decimals == 8) {
                console.log("  (Human readable:", available / 1e8, symbol, ")");
            } else {
                console.log(
                    "  (Human readable:",
                    available / 1e18,
                    symbol,
                    ")"
                );
            }
        } catch {
            console.log("ERROR: Failed to read available liquidity");
        }

        try pool.getTotalSupply(asset) returns (uint256 totalSupply) {
            console.log("Total Supply:", totalSupply);
        } catch {
            console.log("ERROR: Failed to read total supply");
        }

        try pool.getTotalBorrowed(asset) returns (uint256 totalBorrowed) {
            console.log("Total Borrowed:", totalBorrowed);
        } catch {
            console.log("ERROR: Failed to read total borrowed");
        }

        console.log("");
    }
}
