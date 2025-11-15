// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {AutonomyV1} from "../src/core/AutonomyV1.sol";
import {CometAdapter} from "../src/adapters/CometAdapter.sol";
import {CollateralToken} from "../src/tokens/CollateralToken.sol";
import {AtAsset} from "../src/tokens/AtAsset.sol";
import {MockComet} from "../src/mocks/MockComet.sol";
import {IERC20Minimal} from "../src/interfaces/IERC20Minimal.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        
        address deployer = msg.sender;
        console.log("Deploying from:", deployer);
        
        console.log("\n=== Deploying Oracle ===");
        MockOracle oracle = new MockOracle(deployer);
        console.log("MockOracle:", address(oracle));
        
        console.log("\n=== Deploying Collateral (mETH) ===");
        CollateralToken collateral = new CollateralToken();
        console.log("mETH:", address(collateral));
        
        console.log("\n=== Deploying MockComet (cmETH) ===");
        MockComet mockComet = new MockComet(
            address(collateral),
            "Compound mETH",
            "cmETH",
            0.04e18
        );
        console.log("cmETH:", address(mockComet));
        
        console.log("\n=== Deploying AtAsset (atUSD) ===");
        AtAsset atAsset = new AtAsset("Autonomy USD", "atUSD", 18);
        console.log("atUSD:", address(atAsset));
        
        console.log("\n=== Deploying CometAdapter ===");
        CometAdapter adapter = new CometAdapter(
            deployer,
            IERC20Minimal(address(collateral)),
            address(mockComet)
        );
        console.log("CometAdapter:", address(adapter));
        
        console.log("\n=== Deploying AutonomyV1 ===");
        AutonomyV1 autonomy = new AutonomyV1(deployer, IPriceOracle(address(oracle)));
        console.log("AutonomyV1:", address(autonomy));
        
        oracle.setPrice(address(collateral), 1e18);
        oracle.setPrice(address(atAsset), 1e18);
        oracle.setPrice(address(mockComet), 1e18);
        
        autonomy.registerYieldToken(address(mockComet), adapter);
        autonomy.registerDebtToken(address(atAsset));
        atAsset.setMinter(address(autonomy));
        
        collateral.mint(deployer, 1000e18);
        
        console.log("\n=== DEPLOYED ===");
        console.log("AutonomyV1:", address(autonomy));
        console.log("CometAdapter:", address(adapter));
        console.log("cmETH:", address(mockComet));
        console.log("mETH:", address(collateral));
        
        vm.stopBroadcast();
    }
}
