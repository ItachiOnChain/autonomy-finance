// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/MockERC20.sol";
import "../src/story/RoyaltyDistributor.sol";

/**
 * @title DeployRoyaltySimulator
 * @notice Deployment script for Royalty Simulator contracts on Aeneid Testnet
 * @dev Run with: forge script script/DeployRoyaltySimulator.s.sol:DeployRoyaltySimulator --rpc-url $AENEID_RPC_URL --broadcast --verify
 */
contract DeployRoyaltySimulator is Script {
    function run() external {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Royalty Simulator contracts...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockERC20
        console.log("\n1. Deploying MockERC20...");
        MockERC20 mockERC20 = new MockERC20(deployer);
        console.log("MockERC20 deployed at:", address(mockERC20));

        // Deploy RoyaltyDistributor
        console.log("\n2. Deploying RoyaltyDistributor...");
        RoyaltyDistributor distributor = new RoyaltyDistributor(
            address(mockERC20)
        );
        console.log("RoyaltyDistributor deployed at:", address(distributor));

        // Grant minter role to RoyaltyDistributor
        console.log("\n3. Granting minter role to RoyaltyDistributor...");
        mockERC20.grantMinterRole(address(distributor));
        console.log("Minter role granted");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Aeneid Testnet (chainId 1513)");
        console.log("Deployer:", deployer);
        console.log("MockERC20:", address(mockERC20));
        console.log("RoyaltyDistributor:", address(distributor));
        console.log(
            "\nSave these addresses to frontend/src/constants/contractAddresses.ts"
        );
        console.log("\nNext steps:");
        console.log(
            "1. Extract ABIs: forge inspect MockERC20 abi > frontend/src/abis/MockERC20.json"
        );
        console.log(
            "2. Extract ABIs: forge inspect RoyaltyDistributor abi > frontend/src/abis/RoyaltyDistributor.json"
        );
        console.log("3. Update frontend constants with deployed addresses");
        console.log("4. Run smoke check: forge script script/SmokeCheck.s.sol");
    }
}
