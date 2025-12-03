import React from 'react';

interface MintPanelProps {
    asset: {
        symbol: string;
    };
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
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-bold text-gray-900 mb-2">🪙 Mint Test Tokens</h3>
            <p className="text-xs text-gray-600 mb-4">Dev only - mint tokens for testing</p>

            <div className="space-y-3">
                <input
                    type="number"
                    placeholder="1000"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                />
                <button
                    onClick={onMint}
                    disabled={isProcessing || !mintAmount}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    {isProcessing ? 'Processing...' : `Mint ${mintAmount} ${asset.symbol}`}
                </button>
            </div>
        </div>
    );
};
