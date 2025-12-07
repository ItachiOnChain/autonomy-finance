/**
 * Story Aeneid Market Rates
 * 
 * These are the current APY/APR rates for Story Aeneid testnet.
 * Since the protocol is newly deployed with minimal activity, we use these
 * baseline rates until organic utilization generates dynamic rates.
 * 
 * These values are used when on-chain rates return 0 (no borrowing activity yet).
 */
export const STORY_MARKET_RATES: Record<string, { supplyAPY: number; borrowAPR: number }> = {
    USDC: { supplyAPY: 4.5, borrowAPR: 6.2 },
    USDT: { supplyAPY: 5.1, borrowAPR: 7.0 },
    WETH: { supplyAPY: 2.8, borrowAPR: 3.5 },
    WBTC: { supplyAPY: 1.5, borrowAPR: 2.2 },
    DAI: { supplyAPY: 4.8, borrowAPR: 6.5 },
    LINK: { supplyAPY: 0.5, borrowAPR: 1.2 },
    UNI: { supplyAPY: 0.8, borrowAPR: 1.5 },
    AAVE: { supplyAPY: 1.2, borrowAPR: 2.0 },
};

// Backward compatibility alias
export const MOCK_RATES = STORY_MARKET_RATES;
