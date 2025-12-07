import { useReadContract, useWriteContract, useChainId } from 'wagmi';
import { getContracts } from '../config/contracts';
import { useState } from 'react';

// Hook to get contracts for current chain
const useContractsForChain = () => {
    const chainId = useChainId();
    return getContracts(chainId);
};

/**
 * Hook to get user's E-Mode category
 */
export function useUserEMode(userAddress?: string) {
    const contracts = useContractsForChain();

    // Safe fallback if contracts not available
    if (!contracts?.LENDING_POOL) {
        return { eModeCategory: undefined, isEModeEnabled: false };
    }

    const { data: eModeCategory } = useReadContract({
        address: contracts.LENDING_POOL.address as `0x${string}`,
        abi: contracts.LENDING_POOL.abi,
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
    const contracts = useContractsForChain();

    const setUserEMode = async (categoryId: number) => {
        if (!contracts?.LENDING_POOL) {
            throw new Error('LendingPool not configured for this network');
        }

        try {
            setIsPending(true);
            const hash = await writeContractAsync({
                address: contracts.LENDING_POOL.address as `0x${string}`,
                abi: contracts.LENDING_POOL.abi,
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
    const contracts = useContractsForChain();

    // Safe fallback if contracts not available
    if (!contracts?.LENDING_POOL) {
        return undefined;
    }

    const { data: category } = useReadContract({
        address: contracts.LENDING_POOL.address as `0x${string}`,
        abi: contracts.LENDING_POOL.abi,
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
    const contracts = useContractsForChain();

    // Safe fallback if contracts not available
    if (!contracts?.LENDING_POOL) {
        return undefined;
    }

    const { data: categoryConfig } = useReadContract({
        address: contracts.LENDING_POOL.address as `0x${string}`,
        abi: contracts.LENDING_POOL.abi,
        functionName: 'getEModeCategory',
        args: categoryId !== undefined ? [categoryId] : undefined,
        query: {
            enabled: categoryId !== undefined && categoryId > 0,
        }
    });

    return categoryConfig as { ltv: bigint; liquidationThreshold: bigint; liquidationBonus: bigint; label: string } | undefined;
}
