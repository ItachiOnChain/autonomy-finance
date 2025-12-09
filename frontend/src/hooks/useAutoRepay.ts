import { useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import type { Address } from 'viem';
import { AUTO_REPAY_ENGINE } from '../constants/royaltySimulator';
import AutoRepayEngineABI from '../abis/AutoRepayEngine.json';

export interface IPLockInfo {
    owner: Address;
    token: Address;
    debt: bigint;
}

export function useAutoRepay() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    /**
     * Check if an IP is locked for auto-repay
     */
    const isIPLocked = useCallback(async (ipId: string): Promise<boolean> => {
        if (!publicClient) return false;

        try {
            const locked = await publicClient.readContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'isIPLocked',
                args: [ipId]
            }) as boolean;

            return locked;
        } catch (error) {
            console.error('[useAutoRepay] Failed to check IP lock status:', error);
            return false;
        }
    }, [publicClient]);

    /**
     * Get IP lock info (owner, borrowed token, debt)
     */
    const getIPLockInfo = useCallback(async (ipId: string): Promise<IPLockInfo | null> => {
        if (!publicClient) return null;

        try {
            const info = await publicClient.readContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'getIPLockInfo',
                args: [ipId]
            }) as [Address, Address, bigint];

            return {
                owner: info[0],
                token: info[1],
                debt: info[2]
            };
        } catch (error) {
            console.error('[useAutoRepay] Failed to get IP lock info:', error);
            return null;
        }
    }, [publicClient]);

    /**
     * Preview MOC to borrowed token conversion
     */
    const previewConversion = useCallback(async (
        mocAmount: string,
        borrowedToken: Address
    ): Promise<string> => {
        if (!publicClient || !mocAmount) return '0';

        try {
            const mocAmountWei = parseUnits(mocAmount, 18);

            const tokenAmount = await publicClient.readContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'previewConversion',
                args: [mocAmountWei, borrowedToken]
            }) as bigint;

            return formatUnits(tokenAmount, 18);
        } catch (error) {
            console.error('[useAutoRepay] Failed to preview conversion:', error);
            return '0';
        }
    }, [publicClient]);

    /**
     * Lock IP for auto-repay
     */
    const lockIP = useCallback(async (
        ipId: string,
        borrowedToken: Address
    ): Promise<{ success: boolean; hash?: string; error?: string }> => {
        if (!walletClient || !address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const hash = await walletClient.writeContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'lockIP',
                args: [ipId, borrowedToken],
                account: address
            });

            // Wait for transaction
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            return { success: true, hash };
        } catch (error: any) {
            console.error('[useAutoRepay] Failed to lock IP:', error);
            return {
                success: false,
                error: error?.message || 'Failed to lock IP'
            };
        }
    }, [walletClient, address, publicClient]);

    /**
     * Claim royalties and repay debt
     */
    const claimRoyalties = useCallback(async (
        ipId: string
    ): Promise<{ success: boolean; hash?: string; repaidAmount?: string; error?: string }> => {
        if (!walletClient || !address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const hash = await walletClient.writeContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'claimRoyalties',
                args: [ipId],
                account: address
            });

            // Wait for transaction
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });

                // TODO: Parse event logs to get repaid amount
                // For now, return success
                return { success: true, hash };
            }

            return { success: true, hash };
        } catch (error: any) {
            console.error('[useAutoRepay] Failed to claim royalties:', error);
            return {
                success: false,
                error: error?.message || 'Failed to claim royalties'
            };
        }
    }, [walletClient, address, publicClient]);

    /**
     * Unlock IP to restore normal royalty flow
     */
    const unlockIP = useCallback(async (
        ipId: string
    ): Promise<{ success: boolean; hash?: string; error?: string }> => {
        if (!walletClient || !address) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const hash = await walletClient.writeContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'unlockIP',
                args: [ipId],
                account: address
            });

            // Wait for transaction
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            return { success: true, hash };
        } catch (error: any) {
            console.error('[useAutoRepay] Failed to unlock IP:', error);
            return {
                success: false,
                error: error?.message || 'Failed to unlock IP'
            };
        }
    }, [walletClient, address, publicClient]);

    /**
     * Get user's debt for a specific token
     */
    const getUserDebt = useCallback(async (
        userAddress: Address,
        borrowedToken: Address
    ): Promise<string> => {
        if (!publicClient) return '0';

        try {
            const debt = await publicClient.readContract({
                address: AUTO_REPAY_ENGINE,
                abi: AutoRepayEngineABI,
                functionName: 'getUserDebt',
                args: [userAddress, borrowedToken]
            }) as bigint;

            return formatUnits(debt, 18);
        } catch (error) {
            console.error('[useAutoRepay] Failed to get user debt:', error);
            return '0';
        }
    }, [publicClient]);

    return {
        isIPLocked,
        getIPLockInfo,
        previewConversion,
        lockIP,
        claimRoyalties,
        unlockIP,
        getUserDebt
    };
}
