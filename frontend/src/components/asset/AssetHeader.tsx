import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../../config/contracts';

interface AssetHeaderProps {
    asset: {
        symbol: string;
        name: string;
        logo: string;
    };
    onRefresh: () => void;
}

export const AssetHeader: React.FC<AssetHeaderProps> = ({ asset, onRefresh }) => {
    const navigate = useNavigate();
    const { isConnected, address } = useAccount();
    const publicClient = usePublicClient();

    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <button
                    onClick={() => navigate('/core')}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
                >
                    ← Back to Core
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-5xl">{asset.logo}</div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
                        <p className="text-gray-600">{asset.symbol}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <button
                            onClick={onRefresh}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center gap-1"
                        >
                            🔄 Refresh
                        </button>
                        <span className="text-xs text-gray-400 mt-1">
                            Last updated: {new Date().toLocaleTimeString()}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1 text-right font-mono">
                            <div>Chain: {publicClient?.chain?.id}</div>
                            <div>Wallet: {isConnected ? `${String(address).slice(0, 6)}...${String(address).slice(-4)}` : 'Not Connected'}</div>
                            <div>Pool: {CONTRACTS.LENDING_POOL.address.slice(0, 6)}...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
