// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/story/RoyaltyDistributor.sol";

contract RegisterUserIP is Script {
    function run() external {
        // Contract addresses
        address royaltyDistributor = 0x909B91a21d0F86709C4eec651E82A4eFB028C330;

        // User's IP to register
        string memory ipId = "0x9B17FDA21743F865A16D51ec4a032409D6a893eB";
        address owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        uint256 royaltyPercent = 49;
        address lendingPool = address(0);

        console.log("Registering IP in RoyaltyDistributor...");
        console.log("IP ID:", ipId);
        console.log("Owner:", owner);
        console.log("Royalty:", royaltyPercent, "%");

        vm.startBroadcast();

        RoyaltyDistributor distributor = RoyaltyDistributor(royaltyDistributor);

        // Check if already registered
        bool isRegistered = distributor.isIpRegistered(ipId);

        if (isRegistered) {
            console.log("\nIP is already registered!");
        } else {
            // Register IP
            distributor.registerIp(ipId, owner, royaltyPercent, lendingPool);
            console.log("\nIP registered successfully!");
        }

        vm.stopBroadcast();

        console.log("\nYou can now use this IP in the Royalty Simulator!");
        console.log("Go to: http://localhost:5173/royalty-simulator");
    }
}
