// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AutonomyVault.sol";
import "../src/interfaces/IAutonomyVault.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title DiagnoseVaultState
 * @notice Diagnostic script to investigate vault state and IP lock history
 */
contract DiagnoseVaultState is Script {
    // Aeneid testnet addresses
    address constant AUTONOMY_VAULT =
        0x95D7fF1684a8F2e202097F28Dc2e56F773A55D02;
    address constant USER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external view {
        console.log("=== VAULT STATE DIAGNOSTIC ===");
        console.log("");

        // 1. Get current vault position
        console.log("1. CURRENT VAULT POSITION");
        console.log("   User:", USER);
        console.log("");

        IAutonomyVault vault = IAutonomyVault(AUTONOMY_VAULT);
        IAutonomyVault.Position memory pos = vault.getPosition(USER);

        console.log("   Collateral Amount:", pos.collateralAmount);
        console.log("   Debt Amount:", pos.debtAmount);
        console.log("   IP Asset:", pos.ipAsset);
        console.log("   Has IP:", pos.hasIP);
        console.log("");

        // 2. Check if IP asset is valid
        if (pos.hasIP && pos.ipAsset != address(0)) {
            console.log("2. IP ASSET VALIDATION");
            console.log("   IP Asset Address:", pos.ipAsset);

            // Try to check if it's an ERC721
            try IERC721(pos.ipAsset).supportsInterface(0x80ac58cd) returns (
                bool isERC721
            ) {
                console.log("   Is ERC721:", isERC721);

                if (isERC721) {
                    // Try to get owner
                    try IERC721(pos.ipAsset).ownerOf(0) returns (
                        address owner
                    ) {
                        console.log("   Token 0 Owner:", owner);
                    } catch {
                        console.log("   Token 0 does not exist");
                    }
                }
            } catch {
                console.log("   Not a valid ERC721 contract");
            }
            console.log("");
        } else {
            console.log("2. IP ASSET VALIDATION");
            console.log("   No IP asset locked");
            console.log("");
        }

        // 3. Provide recommendations
        console.log("3. ANALYSIS & RECOMMENDATIONS");
        console.log("");

        if (pos.hasIP && pos.debtAmount == 0) {
            console.log("   STATUS: IP is locked but NO debt exists");
            console.log("");
            console.log("   RECOMMENDATION:");
            console.log("   - You can unlock your IP since you have no debt");
            console.log("   - This will allow royalties to go directly to you");
            console.log("   - Run: cast send", AUTONOMY_VAULT, '"unlockIP()"');
            console.log("");
        } else if (pos.hasIP && pos.debtAmount > 0) {
            console.log("   STATUS: IP is locked with active debt");
            console.log("");
            console.log("   RECOMMENDATION:");
            console.log("   - Royalties will auto-repay your debt");
            console.log("   - Repay debt first if you want to unlock IP");
            console.log("   - Current debt:", pos.debtAmount);
            console.log("");
        } else if (!pos.hasIP) {
            console.log("   STATUS: No IP locked");
            console.log("");
            console.log("   RECOMMENDATION:");
            console.log("   - All royalties will go directly to you");
            console.log("   - No action needed");
            console.log("");
        }

        // 4. Check for duplicate borrowed assets
        console.log("4. CHECKING FOR DUPLICATE BORROWED ASSETS");
        console.log("   (This requires calling LendingPool)");
        console.log("");
        console.log("   Run this command to check:");
        console.log(
            "   cast call 0x3358F984e9B3CBBe976eEFE9B6fb92a214162932 \\"
        );
        console.log('     "getUserBorrowedAssets(address)(address[])" \\');
        console.log("    ", USER, "\\");
        console.log("     --rpc-url https://aeneid.storyrpc.io");
        console.log("");

        console.log("=== END OF DIAGNOSTIC ===");
    }
}
