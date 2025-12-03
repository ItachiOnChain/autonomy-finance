import React from 'react';
import { formatUnits } from 'viem';
import { formatHealthFactor } from '../../utils/formatters';

interface UserPositionProps {
    asset: {
        symbol: string;
        decimals: number;
    };
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
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Position</h2>

            <div className="space-y-4">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Wallet Balance</div>
                    <div className="font-mono text-lg font-bold text-gray-900">
                        {formatUnits(balance, asset.decimals)} {asset.symbol}
                    </div>
                </div>

                <div>
                    <div className="text-xs text-gray-500 mb-1">Supplied</div>
                    <div className="font-mono text-xl font-bold text-gray-900">
                        {formatUnits(supplied, asset.decimals)} {asset.symbol}
                    </div>
                </div>

                <div>
                    <div className="text-xs text-gray-500 mb-1">Borrowed</div>
                    <div className="font-mono text-xl font-bold text-gray-900">
                        {formatUnits(borrowed, asset.decimals)} {asset.symbol}
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-300">
                    <div className="text-xs text-gray-500 mb-1">Health Factor</div>
                    <div className={`font-mono text-lg font-bold ${healthFactor > 1.5 ? 'text-green-600' : healthFactor > 1.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {formatHealthFactor(healthFactor)}
                    </div>
                </div>
            </div>
        </div>
    );
};
