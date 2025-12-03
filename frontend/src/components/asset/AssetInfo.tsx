import React from 'react';

interface AssetInfoProps {
    asset: {
        maxLTV: number;
        canBeCollateral: boolean;
        decimals: number;
    };
}

export const AssetInfo: React.FC<AssetInfoProps> = ({ asset }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Asset Information</h2>

            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Max LTV</span>
                    <span className="font-mono font-bold">{asset.maxLTV}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Can be collateral</span>
                    <span className="font-bold">{asset.canBeCollateral ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Decimals</span>
                    <span className="font-mono">{asset.decimals}</span>
                </div>
            </div>
        </div>
    );
};
