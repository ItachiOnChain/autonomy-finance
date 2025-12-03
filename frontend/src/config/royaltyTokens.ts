// Supported royalty tokens for multi-token dashboard
import { CONTRACTS } from './contracts';

export interface RoyaltyToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
}

export const ROYALTY_TOKENS: RoyaltyToken[] = [
    {
        symbol: 'MOCK',
        name: 'Mock Royalty Token',
        address: CONTRACTS.MockRoyaltyToken.address,
        decimals: 18,
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        address: CONTRACTS.USDC.address,
        decimals: 6,
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        address: CONTRACTS.USDT.address,
        decimals: 6,
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: CONTRACTS.WETH.address,
        decimals: 18,
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: CONTRACTS.WBTC.address,
        decimals: 8,
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: CONTRACTS.DAI.address,
        decimals: 18,
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        address: CONTRACTS.LINK.address,
        decimals: 18,
    },
    {
        symbol: 'UNI',
        name: 'Uniswap',
        address: CONTRACTS.UNI.address,
        decimals: 18,
    },
    {
        symbol: 'AAVE',
        name: 'Aave',
        address: CONTRACTS.AAVE.address,
        decimals: 18,
    },
];
