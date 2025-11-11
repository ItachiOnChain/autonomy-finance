// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Script.sol";
import "../src/core/AutonomyV1.sol";
import "../src/adapters/Adapter.sol";
import "../src/tokens/CollateralToken.sol";
import "../src/tokens/AtAsset.sol";
import "../src/interfaces/IERC20Minimal.sol";
import "../src/interfaces/IPriceOracle.sol";
import "../src/mocks/MockOracle.sol";

/// @notice Deployment script for Mantle testnet
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deploying from:", deployer);

        // Deploy price oracle
        console.log("Deploying MockOracle...");
        MockOracle oracle = new MockOracle(deployer);
        console.log("MockOracle deployed at:", address(oracle));

        // Deploy collateral token
        console.log("Deploying CollateralToken...");
        CollateralToken collateral = new CollateralToken();
        console.log("CollateralToken deployed at:", address(collateral));

        // Deploy atAsset (debt token)
        console.log("Deploying AtAsset...");
        AtAsset atAsset = new AtAsset("Autonomy USD", "atUSD", 18);
        console.log("AtAsset deployed at:", address(atAsset));

        // Deploy Adapter
        console.log("Deploying Adapter...");
        Adapter adapter = new Adapter(
            deployer,
            IERC20Minimal(address(collateral)),
            "Yield Token",
            "YT",
            1e18, // Initial exchange rate 1:1
            0.1e18 // 10% APY
        );
        console.log("Adapter deployed at:", address(adapter));

        // Deploy AutonomyV1
        console.log("Deploying AutonomyV1...");
        AutonomyV1 autonomy = new AutonomyV1(deployer, IPriceOracle(address(oracle)));
        console.log("AutonomyV1 deployed at:", address(autonomy));

        // Set prices in oracle (default 1e18 = parity)
        oracle.setPrice(address(collateral), 1e18);
        oracle.setPrice(address(atAsset), 1e18);

        // Register yield token
        console.log("Registering yield token...");
        address yieldToken = address(adapter.yieldToken());
        autonomy.registerYieldToken(yieldToken, adapter);
        console.log("Yield token registered:", yieldToken);

        // Register debt token
        console.log("Registering debt token...");
        autonomy.registerDebtToken(address(atAsset));
        console.log("Debt token registered:", address(atAsset));

        // Set Autonomy as minter for atAsset
        atAsset.setMinter(address(autonomy));

        console.log("\n=== Deployment Summary ===");
        console.log("MockOracle:", address(oracle));
        console.log("CollateralToken:", address(collateral));
        console.log("AtAsset:", address(atAsset));
        console.log("Adapter:", address(adapter));
        console.log("YieldToken:", yieldToken);
        console.log("AutonomyV1:", address(autonomy));
        console.log("Owner:", deployer);

        vm.stopBroadcast();
    }
}
