import React from 'react';

interface MintPanelProps {
    asset: { symbol: string };
    mintAmount: string;
    setMintAmount: (amount: string) => void;
    onMint: () => void;
    isProcessing: boolean;
    isConnected: boolean;
}

export const MintPanel: React.FC<MintPanelProps> = ({
    asset,
    mintAmount,
    setMintAmount,
    onMint,
    isProcessing,
    isConnected
}) => {
    if (!isConnected) return null;

    return (
        <div
            className="
                bg-black/40 
                border border-white/10 
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                font-mono
                shadow-[0_0_20px_rgba(138,224,108,0.12)]
            "
        >
            <h3 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-2">
                Mint Test Tokens
            </h3>
            <p className="text-xs text-white/40 mb-4">Dev-only minting for testing</p>

            <div className="space-y-3">
                <input
                    type="number"
                    placeholder="1000"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    disabled={isProcessing}
                    className="
                        w-full px-4 py-3 
                        bg-black/60 
                        border border-white/15 
                        rounded-lg 
                        text-white
                        placeholder-white/30
                        focus:border-[#8AE06C] 
                        focus:ring-0
                        font-mono
                    "
                />

                <button
                    onClick={onMint}
                    disabled={isProcessing || !mintAmount}
                    className="
                        w-full px-4 py-3 
                        bg-[#8AE06C]/20 
                        text-[#8AE06C]
                        font-mono
                        rounded-lg 
                        border border-[#8AE06C]/40
                        hover:bg-[#8AE06C]/30 
                        transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                    "
                >
                    {isProcessing ? 'Processing...' : `Mint ${mintAmount} ${asset.symbol}`}
                </button>
            </div>
        </div>
    );
};
