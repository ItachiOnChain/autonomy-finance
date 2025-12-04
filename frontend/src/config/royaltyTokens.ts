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
];
