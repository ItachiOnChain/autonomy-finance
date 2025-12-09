import React, { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, MARKET_CHAIN_ID } from '../config/contracts';

interface ClaimAndRepayButtonProps {
    ipId: string;
    onSuccess?: () => void;
}

export const ClaimAndRepayButton: React.FC<ClaimAndRepayButtonProps> = ({ ipId, onSuccess }) => {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isSuccess && onSuccess) {
            onSuccess();
        }
    }, [isSuccess, onSuccess]);

    const handleClaim = () => {
        try {
            writeContract({
                address: CONTRACTS[MARKET_CHAIN_ID].AUTO_REPAY_VAULT.address,
                abi: CONTRACTS[MARKET_CHAIN_ID].AUTO_REPAY_VAULT.abi,
                functionName: 'claimAndRepay',
                args: [ipId as `0x${string}`],
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={handleClaim}
                disabled={isPending || isConfirming}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
            >
                {isPending || isConfirming ? (
                    'Processing...'
                ) : (
                    <>
                        <span>💰</span> Claim & Repay
                    </>
                )}
            </button>
            {error && (
                <p className="text-xs text-red-500">
                    {error.message.includes('User rejected') ? 'Transaction rejected' : 'Error: ' + error.message.slice(0, 20) + '...'}
                </p>
            )}
        </div>
    );
};
