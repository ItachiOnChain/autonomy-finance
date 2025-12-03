// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    // AutonomyVault errors
    error InsufficientCollateral();
    error InsufficientBalance();
    error ExceedsMaxLTV();
    error NoDebt();
    error InvalidAmount();
    error ZeroAddress();
    error TransferFailed();
    
    // IPManager errors
    error IPNotOwned();
    error IPAlreadyLocked();
    error IPNotLocked();
    error DebtNotZero();
    error UnauthorizedCaller();
    
    // AutoRepayEngine errors
    error InsufficientRoyalties();
    error NoActiveDebt();
    error SimulationFailed();
}
