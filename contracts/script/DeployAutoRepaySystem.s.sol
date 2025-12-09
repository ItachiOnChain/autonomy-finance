// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/AutoRepayVault.sol";
import "../src/story/RoyaltyToken.sol";
import "../src/story/StoryRoyaltySimulator.sol";
import "../src/mocks/MockLendingPool.sol";

/**
 * @title DeployAutoRepaySystem
 * @notice Deploy AutoRepayVault and update StoryRoyaltySimulator
 */
contract DeployAutoRepaySystem is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("STORY_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get existing contract addresses
        address lendingPool; // Will be deployed or read from env
        address royaltyToken; // Will be deployed behavior

        console.log("===========================================");
        console.log("Deploying Auto-Repay System");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Aeneid Testnet");
        console.log("RoyaltyToken:", royaltyToken);
        console.log("LendingPool:", lendingPool);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 0. Deploy MockLendingPool (since we don't have a real one)
        console.log("0. Deploying MockLendingPool...");
        MockLendingPool mockPool = new MockLendingPool();
        lendingPool = address(mockPool);
        console.log("   MockLendingPool deployed at:", lendingPool);
        console.log("");

        // 0.5 Deploy RoyaltyToken (Fresh deployment)
        console.log("0.5. Deploying RoyaltyToken...");
        RoyaltyToken token = new RoyaltyToken();
        royaltyToken = address(token);
        console.log("   RoyaltyToken deployed at:", royaltyToken);
        console.log("");

        // 1. Deploy AutoRepayVault
        console.log("1. Deploying AutoRepayVault...");
        AutoRepayVault autoRepayVault = new AutoRepayVault(
            royaltyToken,
            lendingPool
        );
        console.log("   AutoRepayVault deployed at:", address(autoRepayVault));
        console.log("");

        // 2. Deploy new StoryRoyaltySimulator with AutoRepayVault
        console.log("2. Deploying StoryRoyaltySimulator...");
        StoryRoyaltySimulator simulator = new StoryRoyaltySimulator(
            royaltyToken,
            address(autoRepayVault)
        );
        console.log(
            "   StoryRoyaltySimulator deployed at:",
            address(simulator)
        );
        console.log("");

        // 3. Configure permissions
        console.log("3. Configuring permissions...");

        // Set simulator in RoyaltyToken
        RoyaltyToken(royaltyToken).setRoyaltySimulator(address(simulator));
        console.log("   RoyaltySimulator authorized in RoyaltyToken");

        // Set AutoRepayVault in RoyaltyToken (CRITICAL for transferFrom override)
        RoyaltyToken(royaltyToken).setAutoRepayVault(address(autoRepayVault));
        console.log("   AutoRepayVault authorized in RoyaltyToken");

        // Set simulator in AutoRepayVault
        autoRepayVault.setRoyaltySimulator(address(simulator));
        console.log("   RoyaltySimulator authorized in AutoRepayVault");

        console.log("");

        vm.stopBroadcast();

        // 4. Print deployment summary
        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("RoyaltyToken:", royaltyToken);
        console.log("AutoRepayVault:", address(autoRepayVault));
        console.log("StoryRoyaltySimulator:", address(simulator));
        console.log("");
        console.log("Update frontend config with these addresses!");
        console.log("===========================================");
    }
}
