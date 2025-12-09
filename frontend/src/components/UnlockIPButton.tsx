import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { useIPLockStatus } from '../hooks/useRoyaltyBalance';

interface UnlockIPButtonProps {
    ownerAddress: string;
}

export function UnlockIPButton({ ownerAddress }: UnlockIPButtonProps) {
    const { isLocked, refetch } = useIPLockStatus(ownerAddress);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    // Refetch lock status after successful unlock
    if (isSuccess) {
        refetch();
    }

    const handleUnlock = async () => {
        try {
            writeContract({
                address: CONTRACTS[1315].AUTO_REPAY_VAULT.address,
                abi: CONTRACTS[1315].AUTO_REPAY_VAULT.abi as any,
                functionName: 'unlockIP',
                args: [ownerAddress as `0x${string}`], // unlockIP takes ipId
            });
        } catch (error) {
            console.error('Error unlocking IP:', error);
        }
    };

    // Only show button if IP is locked
    if (!isLocked) {
        return null;
    }

    return (
        <button
            onClick={handleUnlock}
            disabled={isPending}
            className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Unlocking...' : '🔓 Unlock IP'}
        </button>
    );
}
