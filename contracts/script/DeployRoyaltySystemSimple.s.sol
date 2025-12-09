// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/RoyaltyToken.sol";
import "../src/story/StoryRoyaltySimulator.sol";

/**
 * @title DeployRoyaltySystemSimple
 * @notice Simplified deployment - just RoyaltyToken and Simulator
 */
contract DeployRoyaltySystemSimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("STORY_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploying On-Chain Royalty Token System");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Aeneid Testnet");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RoyaltyToken (ERC-20)
        console.log("1. Deploying RoyaltyToken...");
        RoyaltyToken royaltyToken = new RoyaltyToken();
        console.log("   RoyaltyToken deployed at:", address(royaltyToken));
        console.log("");

        // 2. Deploy StoryRoyaltySimulator (use zero address for vault temporarily)
        console.log("2. Deploying StoryRoyaltySimulator...");
        StoryRoyaltySimulator simulator = new StoryRoyaltySimulator(
            address(royaltyToken),
            address(0) // No vault dependency for now
        );
        console.log(
            "   StoryRoyaltySimulator deployed at:",
            address(simulator)
        );
        console.log("");

        // 3. Configure permissions
        console.log("3. Configuring permissions...");
        royaltyToken.setRoyaltySimulator(address(simulator));
        console.log("   RoyaltySimulator authorized to mint tokens");
        console.log("");

        vm.stopBroadcast();

        // 4. Print deployment summary
        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("RoyaltyToken:", address(royaltyToken));
        console.log("StoryRoyaltySimulator:", address(simulator));
        console.log("");
        console.log("Update frontend config with these addresses!");
        console.log("===========================================");
    }
}
