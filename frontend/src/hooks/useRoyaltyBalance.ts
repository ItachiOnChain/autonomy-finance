import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '../config/contracts';

/**
 * Hook to fetch royalty balance for a specific IP
 * @param ipNftContract - The IP NFT contract address
 * @param tokenId - The token ID of the IP
 * @param ipOwner - The owner address of the IP
 */
export function useRoyaltyBalance(
    ipNftContract: string | undefined,
    tokenId: string | undefined,
    ipOwner: string | undefined
) {
    const { data: balance, isLoading, refetch } = useReadContract({
        address: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.address,
        abi: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.abi as any,
        functionName: 'getRoyaltyBalance',
        args: ipOwner && ipNftContract && tokenId
            ? [ipOwner as `0x${string}`, ipNftContract as `0x${string}`, BigInt(tokenId)]
            : undefined,
        query: {
            enabled: !!(ipOwner && ipNftContract && tokenId),
        },
    });

    const balanceValue = typeof balance === 'bigint' ? balance : 0n;

    return {
        balance: balanceValue,
        balanceFormatted: formatEther(balanceValue),
        isLoading,
        refetch,
    };
}

/**
 * Hook to check if an IP is locked in the vault
 * @param userAddress - The user's wallet address
 */
export function useIPLockStatus(userAddress: string | undefined) {
    const { data: isLocked, isLoading, refetch } = useReadContract({
        address: CONTRACTS[1315].AUTO_REPAY_VAULT.address,
        abi: CONTRACTS[1315].AUTO_REPAY_VAULT.abi as any,
        functionName: 'isIPLocked',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    return {
        isLocked: isLocked || false,
        isLoading,
        refetch,
    };
}

/**
 * Hook to check if IP asset is valid (has code deployed)
 * @param userAddress - The user's wallet address
 */
export function useIPAssetValid(userAddress: string | undefined) {
    const { data: isValid, isLoading } = useReadContract({
        address: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.address,
        abi: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.abi as any,
        functionName: 'isIPAssetValid',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    return {
        isValid: isValid || false,
        isLoading,
    };
}

/**
 * Hook to get complete IP royalty information
 * @param ipNftContract - The IP NFT contract address
 * @param tokenId - The token ID of the IP
 */
export function useIPRoyaltyInfo(
    ipNftContract: string | undefined,
    tokenId: string | undefined
) {
    const { data, isLoading, refetch } = useReadContract({
        address: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.address,
        abi: CONTRACTS[1315].STORY_ROYALTY_SIMULATOR.abi as any,
        functionName: 'getIPRoyaltyInfo',
        args: ipNftContract && tokenId
            ? [ipNftContract as `0x${string}`, BigInt(tokenId)]
            : undefined,
        query: {
            enabled: !!(ipNftContract && tokenId),
        },
    });

    // data is [totalEarned, usedForDebt, available, derivatives]
    const result = Array.isArray(data) ? data : [0n, 0n, 0n, 0n];
    const [totalEarned = 0n, usedForDebt = 0n, available = 0n, derivatives = 0n] = result;

    return {
        totalEarned,
        usedForDebt,
        available,
        derivatives,
        totalEarnedFormatted: formatEther(totalEarned),
        usedForDebtFormatted: formatEther(usedForDebt),
        availableFormatted: formatEther(available),
        isLoading,
        refetch,
    };
}
