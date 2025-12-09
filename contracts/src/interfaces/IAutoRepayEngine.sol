// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAutoRepayEngine {
    struct RepaymentSimulation {
        uint256 royaltiesAvailable;
        uint256 currentDebt;
        uint256 repaymentAmount;
        uint256 remainingDebt;
        bool willReleaseIP;
    }

    event AutoRepayExecuted(
        address indexed user,
        uint256 amount,
        uint256 remainingDebt
    );
    event IPReleased(address indexed user, address indexed ipAsset);

    function simulateAutoRepay(
        address user
    ) external view returns (RepaymentSimulation memory);

    function executeAutoRepay(
        address user
    ) external returns (uint256 repaidAmount);

    function autoRepayFromRoyalty(
        bytes32 ipaId,
        address claimedToken,
        uint256 claimedAmount,
        uint256 minRepayOut,
        uint16 slippageBps,
        address preferredDebtAsset
    ) external returns (uint256);

    /**
     * @notice Called when IP receives new royalties (hook from RoyaltyDistributor)
     * @param ipId Story Protocol IP identifier
     * @param amount MOC tokens received
     */
    function onRoyaltyReceived(string memory ipId, uint256 amount) external;
}
