// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/story/MockERC20.sol";

contract MockERC20Test is Test {
    MockERC20 public token;
    address public deployer;
    address public minter;
    address public user;

    event MinterGranted(address indexed account);
    event MinterRevoked(address indexed account);

    function setUp() public {
        deployer = address(this);
        minter = makeAddr("minter");
        user = makeAddr("user");

        token = new MockERC20(minter);
    }

    function testConstructor() public {
        assertEq(token.name(), "Mock Royalty Token");
        assertEq(token.symbol(), "MRT");
        assertEq(token.decimals(), 18);
        assertTrue(token.isMinter(minter));
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer));
    }

    function testMint() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.prank(minter);
        token.mint(user, amount);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.totalSupply(), amount);
    }

    function testMintOnlyMinter() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.prank(user);
        vm.expectRevert();
        token.mint(user, amount);
    }

    function testMintToZeroAddress() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.prank(minter);
        vm.expectRevert("Cannot mint to zero address");
        token.mint(address(0), amount);
    }

    function testMintZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert("Amount must be greater than zero");
        token.mint(user, 0);
    }

    function testGrantMinterRole() public {
        address newMinter = makeAddr("newMinter");

        vm.expectEmit(true, false, false, false);
        emit MinterGranted(newMinter);

        token.grantMinterRole(newMinter);

        assertTrue(token.isMinter(newMinter));
    }

    function testGrantMinterRoleOnlyAdmin() public {
        address newMinter = makeAddr("newMinter");

        vm.prank(user);
        vm.expectRevert();
        token.grantMinterRole(newMinter);
    }

    function testRevokeMinterRole() public {
        vm.expectEmit(true, false, false, false);
        emit MinterRevoked(minter);

        token.revokeMinterRole(minter);

        assertFalse(token.isMinter(minter));
    }

    function testRevokeMinterRoleOnlyAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        token.revokeMinterRole(minter);
    }

    function testMultipleMinters() public {
        address minter2 = makeAddr("minter2");
        token.grantMinterRole(minter2);

        uint256 amount1 = 500 * 10 ** 18;
        uint256 amount2 = 300 * 10 ** 18;

        vm.prank(minter);
        token.mint(user, amount1);

        vm.prank(minter2);
        token.mint(user, amount2);

        assertEq(token.balanceOf(user), amount1 + amount2);
    }

    function testStandardERC20Functions() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.prank(minter);
        token.mint(user, amount);

        // Test transfer
        vm.prank(user);
        token.transfer(deployer, 100 * 10 ** 18);
        assertEq(token.balanceOf(deployer), 100 * 10 ** 18);

        // Test approve and transferFrom
        vm.prank(user);
        token.approve(deployer, 200 * 10 ** 18);

        vm.prank(deployer);
        token.transferFrom(user, deployer, 200 * 10 ** 18);
        assertEq(token.balanceOf(deployer), 300 * 10 ** 18);
    }
}
