// TypeScript types for Royalty Simulator

export interface RoyaltyInfo {
    owner: string;
    royaltyPercent: number; // 0-100
    loggedToLendingPool: boolean;
    lendingPoolAddress: string;
    totalEarned: bigint;
    lastDistributionTime: bigint;
}

export interface SimulationResult {
    txHash: string;
    royaltyAmount: bigint;
    totalAmount: bigint;
    forwardedToPool: boolean;
    recipient: string;
}

export interface SimulationFormData {
    ipId: string;
    revenuePerDerivative: string;
    numberOfDerivatives: number;
}
