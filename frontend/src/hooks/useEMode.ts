import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { useState } from 'react';

/**
 * Hook to get user's E-Mode category
 */
export function useUserEMode(userAddress?: string) {
    const { data: eModeCategory } = useReadContract({
        address: CONTRACTS.LENDING_POOL.address as `0x${string}`,
        abi: CONTRACTS.LENDING_POOL.abi,
        functionName: 'getUserEMode',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!userAddress,
        }
    });

    return {
        eModeCategory: eModeCategory as number | undefined,
        isEModeEnabled: eModeCategory !== undefined && eModeCategory !== 0,
    };
}

/**
 * Hook to set user's E-Mode category
 */
export function useSetUserEMode() {
    const [isPending, setIsPending] = useState(false);
    const { writeContractAsync } = useWriteContract();

    const setUserEMode = async (categoryId: number) => {
        try {
            setIsPending(true);
            const hash = await writeContractAsync({
                address: CONTRACTS.LENDING_POOL.address as `0x${string}`,
                abi: CONTRACTS.LENDING_POOL.abi,
                functionName: 'setUserEMode',
                args: [categoryId],
            });
            return hash;
        } finally {
            setIsPending(false);
        }
    };

    return {
        setUserEMode,
        isPending,
    };
}

/**
 * Hook to get asset category
 */
export function useAssetCategory(assetAddress?: string) {
    const { data: category } = useReadContract({
        address: CONTRACTS.LENDING_POOL.address as `0x${string}`,
        abi: CONTRACTS.LENDING_POOL.abi,
        functionName: 'getAssetCategory',
        args: assetAddress ? [assetAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!assetAddress,
        }
    });

    return category as number | undefined;
}

/**
 * Hook to get E-Mode category configuration
 */
export function useEModeCategory(categoryId?: number) {
    const { data: categoryConfig } = useReadContract({
        address: CONTRACTS.LENDING_POOL.address as `0x${string}`,
        abi: CONTRACTS.LENDING_POOL.abi,
        functionName: 'getEModeCategory',
        args: categoryId !== undefined ? [categoryId] : undefined,
        query: {
            enabled: categoryId !== undefined && categoryId > 0,
        }
    });

    return categoryConfig as { ltv: bigint; liquidationThreshold: bigint; liquidationBonus: bigint; label: string } | undefined;
}
