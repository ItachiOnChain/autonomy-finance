// Supported royalty tokens for multi-token dashboard
import { getContracts, CHAIN_ID } from './contracts';

export interface RoyaltyToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
}

// Get royalty tokens for a specific chain
export const getRoyaltyTokens = (chainId?: number): RoyaltyToken[] => {
    const effectiveChainId = chainId || CHAIN_ID;
    const contracts = getContracts(effectiveChainId);

    // Safe access with fallback
    if (!contracts?.MockRoyaltyToken?.address) {
        console.warn(
            `[Autonomy Finance] MockRoyaltyToken not found for chainId ${effectiveChainId}.`,
            'Royalty token features will be disabled.'
        );
        return [];
    }

    return [
        {
            symbol: 'MOCK',
            name: 'Mock Royalty Token',
            address: contracts.MockRoyaltyToken.address,
            decimals: 18,
        },
    ];
};

// Default export for backward compatibility (uses default chain)
export const ROYALTY_TOKENS: RoyaltyToken[] = getRoyaltyTokens();
