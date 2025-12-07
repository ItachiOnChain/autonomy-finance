import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import type { Asset } from '../../config/assets';



// Generic ABI for minting on testnet tokens
const MINT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

interface MintBoxProps {
    asset: Asset;
    assetAddress: string;
}

export const MintBox: React.FC<MintBoxProps> = ({ asset, assetAddress }) => {
    const { address } = useAccount();
    const { writeContractAsync, isPending } = useWriteContract();
    const [amount, setAmount] = useState('');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const { chainId } = useAccount();
    const { switchChain } = useSwitchChain();

    // Story Aeneid Chain ID
    const TARGET_CHAIN_ID = 1315;

    const handleMint = async () => {
        if (!amount || !address || !assetAddress) return;

        // Check Network
        if (chainId !== TARGET_CHAIN_ID) {
            try {
                switchChain({ chainId: TARGET_CHAIN_ID });
                return;
            } catch (e) {
                console.error("Failed to switch chain", e);
                return;
            }
        }

        try {
            const amountWei = parseUnits(amount, asset.decimals);
            const hash = await writeContractAsync({
                address: assetAddress as `0x${string}`,
                abi: MINT_ABI,
                functionName: 'mint',
                args: [address, amountWei],
            });
            setTxHash(hash);
        } catch (error: any) {
            // Prevent noisy RPC logs / retries
            console.error('[MintBox] Mint failed', {
                asset: asset.symbol,
                error: error.message || error
            });
            alert(`Mint failed: ${error.shortMessage || error.message || 'Unknown error'}`);
        }
    };

    const isProcessing = isPending || isConfirming;

    return (
        <div className="bg-black/40 border border-[#8AE06C]/20 rounded-xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono font-bold text-[#8AE06C]">
                    Mint Test {asset.symbol}
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-[#8AE06C]/10 text-[#8AE06C] border border-[#8AE06C]/20 font-mono">
                    Story Aeneid
                </span>
            </div>

            <p className="text-xs text-white/50 mb-4 font-mono">
                Get free testnet tokens to interact with the protocol.
            </p>

            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#8AE06C] outline-none flex-1 font-mono"
                    disabled={isProcessing}
                />
                <button
                    onClick={handleMint}
                    disabled={isProcessing || !amount}
                    className={`
            px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all
            ${(isProcessing || !amount)
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-[#8AE06C] text-black hover:bg-[#9bf07d] hover:shadow-[0_0_10px_rgba(138,224,108,0.3)]'
                        }
          `}
                >
                    {isProcessing ? 'Minting...' : 'Mint'}
                </button>
            </div>

            {isSuccess && (
                <div className="mt-3 text-xs text-green-400 font-mono flex items-center gap-2">
                    <span>✓ Minted successfully</span>
                    <a
                        href={`https://aeneid.storyscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline opacity-70 hover:opacity-100"
                    >
                        View
                    </a>
                </div>
            )}
        </div>
    );
};
