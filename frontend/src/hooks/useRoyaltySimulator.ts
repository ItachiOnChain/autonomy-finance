// Custom hook for Royalty Simulator contract interactions

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { ROYALTY_SIMULATOR_CONTRACTS, MOCK_TOKEN_DECIMALS } from '../constants/royaltySimulator';
import type { RoyaltyInfo, SimulationResult } from '../types/royaltySimulator';

// Import ABIs
import MockERC20ABI from '../abis/MockERC20.json';
import RoyaltyDistributorABI from '../abis/RoyaltyDistributor.json';

export function useRoyaltySimulator() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Register an IP for royalty distribution
     */
    const registerIp = useCallback(async (
        ipId: string,
        owner: Address,
        royaltyPercent: number,
        lendingPoolAddress?: Address
    ) => {
        if (!walletClient || !address) {
            throw new Error('Wallet not connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const hash = await walletClient.writeContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'registerIp',
                args: [ipId, owner, BigInt(royaltyPercent), lendingPoolAddress || '0x0000000000000000000000000000000000000000']
            });

            await publicClient?.waitForTransactionReceipt({ hash });
            return hash;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to register IP';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, address, publicClient]);

    /**
     * Mint mock tokens for testing
     */
    const mintMockTokens = useCallback(async (to: Address, amount: string) => {
        if (!walletClient || !address) {
            throw new Error('Wallet not connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const amountWei = parseUnits(amount, MOCK_TOKEN_DECIMALS);

            const hash = await walletClient.writeContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.MockERC20,
                abi: MockERC20ABI,
                functionName: 'mint',
                args: [to, amountWei]
            });

            await publicClient?.waitForTransactionReceipt({ hash });
            return hash;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to mint tokens';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, address, publicClient]);

    /**
     * Simulate revenue distribution using new contract function
     */
    const simulateRevenue = useCallback(async (
        ipId: string,
        revenuePerDerivative: string,
        numberOfDerivatives: number
    ): Promise<SimulationResult> => {
        if (!walletClient || !address) {
            throw new Error('Wallet not connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            // Convert to wei (18 decimals)
            const perDerivativeWei = parseUnits(revenuePerDerivative, MOCK_TOKEN_DECIMALS);

            // Call simulateRevenue function (mints directly to IP owner)
            const hash = await walletClient.writeContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'simulateRevenue',
                args: [ipId, BigInt(numberOfDerivatives), perDerivativeWei]
            });

            await publicClient?.waitForTransactionReceipt({ hash });

            return {
                txHash: hash,
                royaltyAmount: 0n, // Calculated on-chain
                totalAmount: perDerivativeWei * BigInt(numberOfDerivatives),
                forwardedToPool: false,
                recipient: address
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to simulate revenue';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, address, publicClient]);

    /**
     * Get IP information
     */
    const getIpInfo = useCallback(async (ipId: string): Promise<RoyaltyInfo | null> => {
        if (!publicClient) return null;

        try {
            const result = await publicClient.readContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'getIpInfo',
                args: [ipId]
            }) as any;

            return {
                owner: result.owner,
                royaltyPercent: Number(result.royaltyPercent),
                loggedToLendingPool: result.loggedToLendingPool,
                lendingPoolAddress: result.lendingPoolAddress,
                totalEarned: result.totalEarned,
                lastDistributionTime: result.lastDistributionTime
            };
        } catch (err) {
            console.error('Failed to get IP info:', err);
            return null;
        }
    }, [publicClient]);

    /**
     * @notice Get royalty balance for a specific IP (CRITICAL FIX: Per-IP balance)
     * @param ipId Story Protocol IP identifier
     * @returns Formatted balance string
     */
    const getRoyaltyBalance = useCallback(async (ipId: string): Promise<string> => {
        if (!publicClient) return '0';

        try {
            // CRITICAL FIX: Query balance by IP ID, not wallet address
            // This ensures each IP has isolated balance
            const balance = await publicClient.readContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'getIpRoyaltyBalance',
                args: [ipId]
            }) as bigint;

            return formatUnits(balance, MOCK_TOKEN_DECIMALS);
        } catch (error) {
            console.error('[useRoyaltySimulator] Failed to get IP royalty balance:', error);
            return '0';
        }
    }, [publicClient]);

    /**
     * Check if IP is registered
     */
    const isIpRegistered = useCallback(async (ipId: string): Promise<boolean> => {
        if (!publicClient) return false;

        try {
            const result = await publicClient.readContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'isIpRegistered',
                args: [ipId]
            }) as boolean;

            return result;
        } catch (err) {
            console.error('Failed to check IP registration:', err);
            return false;
        }
    }, [publicClient]);

    /**
     * Get last simulation time for an IP
     */
    const getLastSimulationTime = useCallback(async (ipId: string): Promise<number> => {
        if (!publicClient) return 0;

        try {
            const timestamp = await publicClient.readContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'getLastSimulationTime',
                args: [ipId]
            }) as bigint;

            return Number(timestamp);
        } catch (err) {
            console.error('Failed to get last simulation time:', err);
            return 0;
        }
    }, [publicClient]);

    return {
        // State
        isLoading,
        error,

        // Functions
        registerIp,
        mintMockTokens,
        simulateRevenue,
        getIpInfo,
        getRoyaltyBalance,
        isIpRegistered,
        getLastSimulationTime
    };
}
