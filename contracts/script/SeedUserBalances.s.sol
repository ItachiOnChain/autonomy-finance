// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/tokens/USDC.sol";
import "../src/tokens/USDT.sol";
import "../src/tokens/WETH.sol";
import "../src/tokens/WBTC.sol";
import "../src/tokens/DAI.sol";
import "../src/tokens/LINK.sol";
import "../src/tokens/UNI.sol";
import "../src/tokens/AAVE.sol";

// Addresses from contracts.ts / deployment artifacts
// WARNING: Ensure these match your actual deployment on Chain 1315
contract Addresses {
    address constant USDC_ADDR = 0x70E5370b8981Abc6e14C91F4AcE823954EFC8eA3;
    address constant USDT_ADDR = 0x4000F8820522AC96C4221b299876e3e53bCc8525;
    address constant WETH_ADDR = 0x9338CA7d556248055f5751d85cDA7aD6eF254433;
    address constant WBTC_ADDR = 0x9c65f85425c619A6cB6D29fF8d57ef696323d188;
    address constant DAI_ADDR = 0x7Cf4be31f546c04787886358b9486ca3d62B9acf;
    address constant LINK_ADDR = 0x33E45b187da34826aBCEDA1039231Be46f1b05Af;
    address constant UNI_ADDR = 0x0c626FC4A447b01554518550e30600136864640B;
    address constant AAVE_ADDR = 0xA21DDc1f17dF41589BC6A5209292AED2dF61Cc94;
}

contract SeedUserBalances is Script, Addresses {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("STORY_PRIVATE_KEY");
        address targetAddress = vm.envOr(
            "TARGET_ADDRESS",
            vm.addr(deployerPrivateKey)
        );

        vm.startBroadcast(deployerPrivateKey);

        console.log("Seeding balances for:", targetAddress);

        // Mint amounts
        MockERC20(USDC_ADDR).mint(targetAddress, 10_000 * 1e6); // 10k USDC
        MockERC20(USDT_ADDR).mint(targetAddress, 10_000 * 1e6); // 10k USDT
        MockERC20(WETH_ADDR).mint(targetAddress, 10 ether); // 10 WETH
        MockERC20(WBTC_ADDR).mint(targetAddress, 1 * 1e8); // 1 WBTC
        MockERC20(DAI_ADDR).mint(targetAddress, 10_000 ether); // 10k DAI
        MockERC20(LINK_ADDR).mint(targetAddress, 100 ether); // 100 LINK
        MockERC20(UNI_ADDR).mint(targetAddress, 100 ether); // 100 UNI
        MockERC20(AAVE_ADDR).mint(targetAddress, 10 ether); // 10 AAVE

        console.log("Seeding complete!");

        vm.stopBroadcast();
    }
}
