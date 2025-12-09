// Royalty Simulator Contract Addresses and Configuration
// PLACEHOLDER ADDRESSES - Update after deployment to Aeneid Testnet

import type { Address } from 'viem';

export const ROYALTY_SIMULATOR_CONTRACTS = {
    // Deployed to Aeneid Testnet (chainId 1513) on 2024-12-09 (Auto-Repay Engine Integration)
    // Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // Formula: royaltyToMint = numberOfDerivatives × royaltyEarnedPerDerivative
    // CRITICAL: Each IP has isolated balance tracked in ipRoyaltyBalances mapping
    // AUTO-REPAY: Automatic debt repayment via onRoyaltyReceived hook
    MockERC20: '0xC8C2FD7cB1EF6c9aB35B2Bf5cD594523A10C2C1C' as Address,
    RoyaltyDistributor: '0xa00F03Ea2d0a6e4961CaAFcA61A78334049c1848' as Address
};

// Auto-Repay Engine address (v8 - fixed auto-routing over-zeroing bug)
export const AUTO_REPAY_ENGINE = '0x60e09dB8212008106601646929360D20eFC4BE33' as Address;

export const MOCK_TOKEN_DECIMALS = 18;
export const MOCK_TOKEN_SYMBOL = 'MRT';
export const MOCK_TOKEN_NAME = 'Mock Royalty Token';

// Default values for simulator
export const DEFAULT_REVENUE_PER_DERIVATIVE = '100'; // 100 USD
export const DEFAULT_NUMBER_OF_DERIVATIVES = 10;
export const MAX_DERIVATIVES = 10000; // Maximum to prevent accidental huge transactions
