// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/story/AutoRepayEngine.sol";
import "../src/story/RoyaltyDistributor.sol";
import "../src/PriceOracle.sol";
import "../src/LendingPool.sol";

/**
 * @title DeployAutoRepay
 * @notice Deploy AutoRepayEngine and integrate with existing contracts
 */
contract DeployAutoRepay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Auto-Repay Engine...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Contract addresses from frontend config (Aeneid Testnet)
        address royaltyDistributor = 0x23De02D83eb0D192CDc5fd578C284A2b2722cafF; // Updated RoyaltyDistributor
        address priceOracle = 0x69eB226983E10D7318816134cd44BE3023dC74cd; // PriceOracle (checksummed)
        address lendingPool = 0x3358F984e9B3CBBe976eEFE9B6fb92a214162932; // LendingPool (checksummed)
        address mocToken = 0x7eb918Ff18Aa8F20e319d3479CB46833a58a32Cb; // MockERC20 (MOC token)

        console.log("\n1. Deploying AutoRepayEngine...");
        AutoRepayEngine autoRepayEngine = new AutoRepayEngine(
            royaltyDistributor,
            priceOracle,
            lendingPool,
            mocToken
        );
        console.log("AutoRepayEngine deployed at:", address(autoRepayEngine));

        console.log("\n2. Setting AutoRepayEngine in RoyaltyDistributor...");
        RoyaltyDistributor(royaltyDistributor).setAutoRepayEngine(
            address(autoRepayEngine)
        );
        console.log("AutoRepayEngine address set in RoyaltyDistributor");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Aeneid Testnet (chainId 1513)");
        console.log("Deployer:", deployer);
        console.log("AutoRepayEngine:", address(autoRepayEngine));
        console.log("RoyaltyDistributor:", royaltyDistributor);
        console.log("PriceOracle:", priceOracle);
        console.log("LendingPool:", lendingPool);
        console.log("MOC Token:", mocToken);

        console.log("\nNext steps:");
        console.log("1. Set token prices in PriceOracle");
        console.log(
            "2. Extract ABI: forge inspect AutoRepayEngine abi > frontend/src/abis/AutoRepayEngine.json"
        );
        console.log(
            "3. Update frontend constants with AutoRepayEngine address"
        );
        console.log("4. Build frontend Auto-Repay Card component");
    }
}
