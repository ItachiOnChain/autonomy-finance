// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/story/MockERC20.sol";
import "../src/story/RoyaltyDistributor.sol";

contract RoyaltyDistributorTest is Test {
    MockERC20 public token;
    RoyaltyDistributor public distributor;

    address public deployer;
    address public owner;
    address public payer;
    address public lendingPool;

    string constant TEST_IP_ID = "0x1234567890abcdef";
    uint256 constant ROYALTY_PERCENT = 10; // 10%

    event IpRegistered(
        string indexed ipId,
        address indexed owner,
        uint256 royaltyPercent,
        address lendingPoolAddress,
        bool loggedToPool
    );

    event RevenueDistributed(
        string indexed ipId,
        address indexed payer,
        uint256 totalAmount,
        uint256 royaltyAmount,
        bool forwardedToPool,
        address recipient,
        uint256 timestamp
    );

    function setUp() public {
        deployer = address(this);
        owner = makeAddr("owner");
        payer = makeAddr("payer");
        lendingPool = makeAddr("lendingPool");

        // Deploy contracts
        token = new MockERC20(deployer);
        distributor = new RoyaltyDistributor(address(token));

        // Grant minter role to distributor
        token.grantMinterRole(address(distributor));
    }

    function testRegisterIp() public {
        vm.expectEmit(true, true, false, true);
        emit IpRegistered(
            TEST_IP_ID,
            owner,
            ROYALTY_PERCENT,
            address(0),
            false
        );

        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        RoyaltyDistributor.RoyaltyInfo memory info = distributor.getIpInfo(
            TEST_IP_ID
        );
        assertEq(info.owner, owner);
        assertEq(info.royaltyPercent, ROYALTY_PERCENT);
        assertFalse(info.loggedToLendingPool);
        assertEq(info.lendingPoolAddress, address(0));
    }

    function testRegisterIpWithLendingPool() public {
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, lendingPool);

        RoyaltyDistributor.RoyaltyInfo memory info = distributor.getIpInfo(
            TEST_IP_ID
        );
        assertTrue(info.loggedToLendingPool);
        assertEq(info.lendingPoolAddress, lendingPool);
    }

    function testRegisterIpInvalidPercent() public {
        vm.expectRevert("Royalty percent must be 0-100");
        distributor.registerIp(TEST_IP_ID, owner, 101, address(0));
    }

    function testRegisterIpEmptyId() public {
        vm.expectRevert("IP ID cannot be empty");
        distributor.registerIp("", owner, ROYALTY_PERCENT, address(0));
    }

    function testRegisterIpZeroOwner() public {
        vm.expectRevert("Invalid owner address");
        distributor.registerIp(
            TEST_IP_ID,
            address(0),
            ROYALTY_PERCENT,
            address(0)
        );
    }

    function testDistributeRevenueToOwner() public {
        // Register IP
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        // Mint tokens to payer
        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);

        // Approve distributor
        vm.prank(payer);
        token.approve(address(distributor), totalAmount);

        // Calculate expected royalty
        uint256 expectedRoyalty = (totalAmount * ROYALTY_PERCENT) / 100;

        // Distribute revenue
        vm.expectEmit(true, true, false, true);
        emit RevenueDistributed(
            TEST_IP_ID,
            payer,
            totalAmount,
            expectedRoyalty,
            false,
            owner,
            block.timestamp
        );

        vm.prank(payer);
        uint256 royaltyAmount = distributor.distributeRevenue(
            TEST_IP_ID,
            payer,
            totalAmount
        );

        assertEq(royaltyAmount, expectedRoyalty);
        assertEq(token.balanceOf(owner), expectedRoyalty);
        assertEq(distributor.getTotalEarned(TEST_IP_ID), expectedRoyalty);
    }

    function testDistributeRevenueToLendingPool() public {
        // Register IP with lending pool
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, lendingPool);

        // Mint tokens to payer
        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);

        // Approve distributor
        vm.prank(payer);
        token.approve(address(distributor), totalAmount);

        // Calculate expected royalty
        uint256 expectedRoyalty = (totalAmount * ROYALTY_PERCENT) / 100;

        // Distribute revenue
        vm.prank(payer);
        uint256 royaltyAmount = distributor.distributeRevenue(
            TEST_IP_ID,
            payer,
            totalAmount
        );

        assertEq(royaltyAmount, expectedRoyalty);
        assertEq(token.balanceOf(lendingPool), expectedRoyalty);
        assertEq(token.balanceOf(owner), 0); // Owner doesn't receive tokens when logged to pool
    }

    function testDistributeRevenueUnregisteredIp() public {
        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);

        vm.prank(payer);
        token.approve(address(distributor), totalAmount);

        vm.prank(payer);
        vm.expectRevert("IP not registered");
        distributor.distributeRevenue(TEST_IP_ID, payer, totalAmount);
    }

    function testDistributeRevenueZeroAmount() public {
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        vm.prank(payer);
        vm.expectRevert("Amount must be greater than zero");
        distributor.distributeRevenue(TEST_IP_ID, payer, 0);
    }

    function testDistributeRevenueInsufficientApproval() public {
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);

        // Don't approve or approve less than needed
        vm.prank(payer);
        token.approve(address(distributor), totalAmount / 2);

        vm.prank(payer);
        vm.expectRevert();
        distributor.distributeRevenue(TEST_IP_ID, payer, totalAmount);
    }

    function testRoyaltyCalculationEdgeCases() public {
        // Test 0% royalty
        distributor.registerIp(TEST_IP_ID, owner, 0, address(0));
        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);

        vm.prank(payer);
        token.approve(address(distributor), totalAmount);

        vm.prank(payer);
        uint256 royalty = distributor.distributeRevenue(
            TEST_IP_ID,
            payer,
            totalAmount
        );
        assertEq(royalty, 0);

        // Test 100% royalty
        string memory ipId2 = "0xabcdef";
        distributor.registerIp(ipId2, owner, 100, address(0));
        token.mint(payer, totalAmount);

        vm.prank(payer);
        token.approve(address(distributor), totalAmount);

        vm.prank(payer);
        royalty = distributor.distributeRevenue(ipId2, payer, totalAmount);
        assertEq(royalty, totalAmount);
    }

    function testMultipleDistributions() public {
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        uint256 amount1 = 1000 * 10 ** 18;
        uint256 amount2 = 500 * 10 ** 18;

        // First distribution
        token.mint(payer, amount1);
        vm.prank(payer);
        token.approve(address(distributor), amount1);
        vm.prank(payer);
        distributor.distributeRevenue(TEST_IP_ID, payer, amount1);

        // Second distribution
        token.mint(payer, amount2);
        vm.prank(payer);
        token.approve(address(distributor), amount2);
        vm.prank(payer);
        distributor.distributeRevenue(TEST_IP_ID, payer, amount2);

        uint256 expectedTotal = ((amount1 + amount2) * ROYALTY_PERCENT) / 100;
        assertEq(distributor.getTotalEarned(TEST_IP_ID), expectedTotal);
        assertEq(token.balanceOf(owner), expectedTotal);
    }

    function testGetRoyaltyBalance() public {
        uint256 amount = 500 * 10 ** 18;
        token.mint(owner, amount);

        assertEq(distributor.getRoyaltyBalance(owner), amount);
    }

    function testIsIpRegistered() public {
        assertFalse(distributor.isIpRegistered(TEST_IP_ID));

        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        assertTrue(distributor.isIpRegistered(TEST_IP_ID));
    }

    function testUpdateIpRegistration() public {
        // Initial registration
        distributor.registerIp(TEST_IP_ID, owner, ROYALTY_PERCENT, address(0));

        // Distribute some revenue
        uint256 totalAmount = 1000 * 10 ** 18;
        token.mint(payer, totalAmount);
        vm.prank(payer);
        token.approve(address(distributor), totalAmount);
        vm.prank(payer);
        distributor.distributeRevenue(TEST_IP_ID, payer, totalAmount);

        uint256 earnedBefore = distributor.getTotalEarned(TEST_IP_ID);

        // Update registration (change royalty percent and add lending pool)
        distributor.registerIp(TEST_IP_ID, owner, 20, lendingPool);

        // Verify earnings preserved
        assertEq(distributor.getTotalEarned(TEST_IP_ID), earnedBefore);

        // Verify new settings
        RoyaltyDistributor.RoyaltyInfo memory info = distributor.getIpInfo(
            TEST_IP_ID
        );
        assertEq(info.royaltyPercent, 20);
        assertTrue(info.loggedToLendingPool);
        assertEq(info.lendingPoolAddress, lendingPool);
    }
}
