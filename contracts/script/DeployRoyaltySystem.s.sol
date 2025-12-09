// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/RoyaltyToken.sol";
import "../src/story/StoryRoyaltySimulator.sol";
import "../src/AutonomyVault.sol";

/**
 * @title DeployRoyaltySystem
 * @notice Deploys the complete on-chain royalty token system
 * @dev Deploy to Story Aeneid testnet
 */
contract DeployRoyaltySystem is Script {
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

        // 2. Get existing AutonomyVault address (should already be deployed)
        address autonomyVaultAddress = vm.envAddress("AUTONOMY_VAULT_ADDRESS");
        console.log(
            "2. Using existing AutonomyVault at:",
            autonomyVaultAddress
        );
        AutonomyVault autonomyVault = AutonomyVault(autonomyVaultAddress);
        console.log("");

        // 3. Deploy StoryRoyaltySimulator
        console.log("3. Deploying StoryRoyaltySimulator...");
        StoryRoyaltySimulator simulator = new StoryRoyaltySimulator(
            address(royaltyToken),
            autonomyVaultAddress
        );
        console.log(
            "   StoryRoyaltySimulator deployed at:",
            address(simulator)
        );
        console.log("");

        // 4. Configure permissions
        console.log("4. Configuring permissions...");
        royaltyToken.setRoyaltySimulator(address(simulator));
        console.log("   RoyaltySimulator authorized to mint tokens");

        autonomyVault.setRoyaltyToken(address(royaltyToken));
        console.log("   RoyaltyToken linked to AutonomyVault");
        console.log("");

        vm.stopBroadcast();

        // 5. Print deployment summary
        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("RoyaltyToken:", address(royaltyToken));
        console.log("StoryRoyaltySimulator:", address(simulator));
        console.log("AutonomyVault:", autonomyVaultAddress);
        console.log("");
        console.log("Next steps:");
        console.log("1. Export ABIs to frontend");
        console.log("2. Update frontend config with new addresses");
        console.log("3. Test royalty simulation");
        console.log("===========================================");
    }
}
