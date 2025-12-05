import React from 'react';
import { formatUnits } from 'viem';

interface ReserveOverviewProps {
    asset: { symbol: string; decimals: number; color: string };
    data: {
        totalSupplied: bigint;
        totalBorrowed: bigint;
        availableLiquidity: bigint;
        utilizationRate: number;
    };
}

export const ReserveOverview: React.FC<ReserveOverviewProps> = ({ asset, data }) => {
    const { totalSupplied, totalBorrowed, availableLiquidity, utilizationRate } = data;

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
            <h2 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-6">
                Reserve Overview
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Supplied", value: formatUnits(totalSupplied, asset.decimals) },
                    { label: "Total Borrowed", value: formatUnits(totalBorrowed, asset.decimals) },
                    { label: "Available", value: formatUnits(availableLiquidity, asset.decimals), color: "#8AE06C" },
                    { label: "Utilization", value: `${utilizationRate.toFixed(2)}%`, color: asset.color }
                ].map((item, i) => (
                    <div key={i}>
                        <div className="text-[10px] text-white/50 tracking-wide mb-1">{item.label}</div>
                        <div
                            className="text-lg font-bold"
                            style={{ color: item.color || "white" }}
                        >
                            {item.value}
                        </div>
                        {i < 3 && <div className="text-[10px] text-white/40">{asset.symbol}</div>}
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6">
                <div className="w-full h-2 bg-white/10 rounded-full">
                    <div
                        className="h-2 rounded-full transition-all"
                        style={{
                            width: `${Math.min(utilizationRate, 100)}%`,
                            backgroundColor: asset.color
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
