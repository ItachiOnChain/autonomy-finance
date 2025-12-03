import React from 'react';
import { formatUnits } from 'viem';

interface ReserveOverviewProps {
    asset: {
        symbol: string;
        decimals: number;
        color: string;
    };
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reserve Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Total Supplied</div>
                    <div className="font-mono text-lg font-bold text-gray-900">
                        {formatUnits(totalSupplied, asset.decimals)}
                    </div>
                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                </div>

                <div>
                    <div className="text-xs text-gray-500 mb-1">Total Borrowed</div>
                    <div className="font-mono text-lg font-bold text-gray-900">
                        {formatUnits(totalBorrowed, asset.decimals)}
                    </div>
                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                </div>

                <div>
                    <div className="text-xs text-gray-500 mb-1">Available</div>
                    <div className="font-mono text-lg font-bold text-green-600">
                        {formatUnits(availableLiquidity, asset.decimals)}
                    </div>
                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                </div>

                <div>
                    <div className="text-xs text-gray-500 mb-1">Utilization</div>
                    <div className="font-mono text-lg font-bold" style={{ color: asset.color }}>
                        {utilizationRate.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Utilization Bar */}
            <div className="mt-4">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${Math.min(utilizationRate, 100)}%`,
                            backgroundColor: asset.color
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
