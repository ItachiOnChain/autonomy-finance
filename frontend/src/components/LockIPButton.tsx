import React, { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

interface LockIPButtonProps {
    ipId: string;
    isLocked: boolean;
    onSuccess?: () => void;
}

export const LockIPButton: React.FC<LockIPButtonProps> = ({ ipId, isLocked, onSuccess }) => {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isSuccess && onSuccess) {
            onSuccess();
        }
    }, [isSuccess, onSuccess]);

    const handleLock = () => {
        writeContract({
            address: CONTRACTS[1315].AUTO_REPAY_VAULT.address,
            abi: CONTRACTS[1315].AUTO_REPAY_VAULT.abi,
            functionName: 'lockIP',
            args: [ipId as `0x${string}`],
        });
    };

    if (isLocked) {
        return (
            <button
                disabled
                className="px-4 py-2 bg-gray-500 text-white rounded-md cursor-not-allowed opacity-70 flex items-center gap-2"
            >
                IP Locked for Auto-Repay
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleLock}
                disabled={isPending || isConfirming}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
            >
                {isPending || isConfirming ? (
                    'Locking...'
                ) : (
                    <>
                        Lock IP for Auto-Repay
                    </>
                )}
            </button>
            {error && (
                <p className="text-red-500 text-xs">
                    {error.message.includes("User rejected") ? "User rejected transaction" : "Error locking IP"}
                </p>
            )}
        </div>
    );
};
