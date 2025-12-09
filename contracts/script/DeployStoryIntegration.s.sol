// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/StoryRoyaltySimulator.sol";
import "../src/tokens/MockRoyaltyToken.sol";

/**
 * @title DeployStoryIntegration
 * @notice Deployment script for Story Protocol integration contracts
 * @dev Deploys only NEW contracts for Story integration, does not modify existing system
 */
contract DeployStoryIntegration is Script {
    // Existing contract addresses (from previous deployment)
    address constant AUTO_REPAY_ENGINE =
        0x633a7eB9b8912b22f3616013F3153de687F96074;
    address constant EXISTING_MOCK_ROYALTY_TOKEN =
        0x5aA185fbEFc205072FaecC6B9D564383e761f8C2;

    // New contracts
    StoryRoyaltySimulator public storyRoyaltySimulator;
    MockRoyaltyToken public storyRoyaltyToken;

    function run() external {
        console.log("================================================");
        console.log("   STORY PROTOCOL INTEGRATION DEPLOYMENT");
        console.log("================================================");
        console.log("");
        console.log("Network: Story Aeneid Testnet");
        console.log("Chain ID: 1315");
        console.log("Deployer:", msg.sender);
        console.log("");

        vm.startBroadcast();

        // 1. Deploy new MockRoyaltyToken specifically for Story integration
        console.log("Deploying Story Royalty Token...");
        storyRoyaltyToken = new MockRoyaltyToken();
        console.log(
            "  StoryRoyaltyToken deployed at:",
            address(storyRoyaltyToken)
        );
        console.log("");

        // 2. Deploy StoryRoyaltySimulator
        console.log("Deploying StoryRoyaltySimulator...");
        // NOTE: Using placeholders for lendingPool and autonomyVault
        address mockRoyaltyToken = address(storyRoyaltyToken);
        address autoRepayEngine = AUTO_REPAY_ENGINE;
        address lendingPool = address(0x123); // Placeholder
        storyRoyaltySimulator = new StoryRoyaltySimulator(
            address(mockRoyaltyToken),
            address(0) // AutonomyVault address - set to 0 for now
        );
        console.log("  StoryRoyaltySimulator:", address(storyRoyaltySimulator));
        console.log("");

        // 3. Grant minter role to StoryRoyaltySimulator
        console.log("Configuring permissions...");
        // MockRoyaltyToken allows anyone to mint (for testing), so no additional setup needed
        console.log("  StoryRoyaltySimulator can mint tokens");
        console.log("");

        // 4. Set initial configuration
        console.log("Setting initial configuration...");
        // RoyaltyPerDerivative is now a constant (100 tokens)
        console.log("  Royalty per derivative: 100 tokens (constant)");
        console.log("");

        vm.stopBroadcast();

        // 5. Print deployment summary
        _printDeploymentSummary();
    }

    function _printDeploymentSummary() private view {
        console.log("");
        console.log("================================================");
        console.log("   STORY INTEGRATION DEPLOYMENT COMPLETE");
        console.log("================================================");
        console.log("");
        console.log("NEW CONTRACTS:");
        console.log("  StoryRoyaltyToken:      ", address(storyRoyaltyToken));
        console.log(
            "  StoryRoyaltySimulator:  ",
            address(storyRoyaltySimulator)
        );
        console.log("");
        console.log("EXISTING CONTRACTS (REUSED):");
        console.log("  AutoRepayEngine:        ", AUTO_REPAY_ENGINE);
        console.log("");
        console.log("CONFIGURATION:");
        console.log("  Royalty per derivative:  100 tokens");
        console.log("  Max derivatives per tx:  10");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("  1. Update frontend config with new addresses");
        console.log("  2. Implement /story-ip/royalty frontend");
        console.log("  3. Test royalty simulation flow");
        console.log("");
        console.log("================================================");
    }
}
