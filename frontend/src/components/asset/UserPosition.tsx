import React from 'react';
import { formatUnits } from 'viem';
import { formatHealthFactor } from '../../utils/formatters';

interface UserPositionProps {
    asset: { symbol: string; decimals: number };
    position: {
        balance: bigint;
        supplied: bigint;
        borrowed: bigint;
        healthFactor: number;
    };
    isConnected: boolean;
}

export const UserPosition: React.FC<UserPositionProps> = ({ asset, position, isConnected }) => {
    if (!isConnected) return null;

    const { balance, supplied, borrowed, healthFactor } = position;

    return (
        <div
            className="
                bg-black/40 
                border border-[#8AE06C]/20 
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                font-mono
                shadow-[0_0_20px_rgba(138,224,108,0.12)]
            "
        >
            <h2 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-6">
                Your Position
            </h2>

            <div className="space-y-6">
                {[
                    { label: "Wallet Balance", value: formatUnits(balance, asset.decimals) },
                    { label: "Supplied", value: formatUnits(supplied, asset.decimals) },
                    { label: "Borrowed", value: formatUnits(borrowed, asset.decimals) }
                ].map((item, i) => (
                    <div key={i}>
                        <div className="text-[10px] text-white/50 tracking-wide mb-1">{item.label}</div>
                        <div className="text-xl font-bold text-white">{item.value} {asset.symbol}</div>
                    </div>
                ))}

                {/* Health Factor */}
                <div className="pt-4 border-t border-white/10">
                    <div className="text-[10px] text-white/50 tracking-wide mb-1">Health Factor</div>

                    <div
                        className={`
                            text-xl font-bold 
                            ${healthFactor > 1.5 ? "text-[#8AE06C]" :
                                healthFactor > 1.0 ? "text-yellow-400" :
                                    "text-red-500"}
                        `}
                    >
                        {formatHealthFactor(healthFactor)}
                    </div>
                </div>
            </div>
        </div>
    );
};
