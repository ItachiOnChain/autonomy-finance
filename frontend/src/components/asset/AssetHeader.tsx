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
        <div
            className="
                w-full 
                bg-black/40 
                backdrop-blur-xl 
                border-b border-white/10 
                shadow-[0_0_25px_rgba(138,224,108,0.18)]
                rounded-t-2xl
            "
        >
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 font-mono text-white">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/core')}
                    className="
                        text-xs 
                        text-white/60 
                        hover:text-[#8AE06C] 
                        transition-colors 
                        flex items-center gap-1
                    "
                >
                    ← BACK TO CORE
                </button>

                {/* Header Row */}
                <div className="flex items-center gap-4">

                    {/* Icon */}
                    <div className="text-5xl drop-shadow-[0_0_10px_rgba(138,224,108,0.35)]">
                        {asset.logo}
                    </div>

                    {/* Name */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide text-white">
                            {asset.name}
                        </h1>
                        <p className="text-[#8AE06C]/80 text-xs tracking-widest">
                            {asset.symbol}
                        </p>
                    </div>

                    {/* Right Panel */}
                    <div className="ml-auto flex flex-col items-end">

                        {/* Refresh Button */}
                        <button
                            onClick={onRefresh}
                            className="
                                px-4 py-1.5 
                                text-xs 
                                rounded-md 
                                bg-[#8AE06C]/10 
                                border border-[#8AE06C]/40 
                                text-[#8AE06C] 
                                hover:bg-[#8AE06C]/20 
                                transition-all
                                flex items-center gap-1
                            "
                        >
                            REFRESH
                        </button>

                        {/* Timestamp */}
                        <span className="text-[10px] text-white/40 mt-1">
                            Updated: {new Date().toLocaleTimeString()}
                        </span>

                        {/* Metadata */}
                        <div className="text-[10px] text-white/40 mt-2 text-right leading-tight">
                            <div>Chain: {publicClient?.chain?.id}</div>
                            <div>
                                Wallet:{" "}
                                {isConnected
                                    ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                                    : "Not Connected"}
                            </div>
                            <div>
                                Pool: {CONTRACTS.LENDING_POOL.address.slice(0, 6)}...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
