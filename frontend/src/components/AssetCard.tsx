import React from 'react';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { ASSETS } from '../config/assets';
import { useAssetData, useUserPosition } from '../hooks/useLendingPool';
import { CONTRACTS } from '../config/contracts';

interface AssetCardProps {
    symbol: string;
    type: 'supply' | 'borrow';
}

export const AssetCard: React.FC<AssetCardProps> = ({ symbol, type }) => {
    const asset = ASSETS.find(a => a.symbol === symbol);
    if (!asset) return null;

    // @ts-ignore
    const assetAddress = (CONTRACTS as any)[asset.symbol]?.address as string;
    if (!assetAddress) return null;
    const { availableLiquidity, supplyAPR, borrowAPR } = useAssetData(assetAddress);
    const { supplied, borrowed } = useUserPosition(assetAddress);

    const displayAPR = type === 'supply' ? supplyAPR : borrowAPR;
    const userBalance = type === 'supply' ? supplied : borrowed;

    return (
        <Link
            to={`/asset/${symbol}`}
            className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
        >
            <div className="flex items-center justify-between mb-3">
                {/* Asset Info */}
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{asset.logo}</div>
                    <div>
                        <div className="font-bold text-base text-gray-900">{asset.symbol}</div>
                        <div className="text-xs text-gray-500">{asset.name}</div>
                    </div>
                </div>

                {/* APY/APR */}
                <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">
                        {type === 'supply' ? 'APY' : 'APR'}
                    </div>
                    <div className="text-xl font-bold" style={{ color: asset.color }}>
                        {displayAPR.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Available</div>
                    <div className="font-mono text-sm text-gray-900">
                        {formatUnits(availableLiquidity, asset.decimals)} {asset.symbol}
                    </div>
                </div>

                {userBalance > 0n && (
                    <div>
                        <div className="text-xs text-gray-500 mb-1">
                            Your {type === 'supply' ? 'Supply' : 'Borrow'}
                        </div>
                        <div className="font-mono text-sm font-bold" style={{ color: asset.color }}>
                            {formatUnits(userBalance, asset.decimals)} {asset.symbol}
                        </div>
                    </div>
                )}

                {asset.canBeCollateral && type === 'supply' && (
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Max LTV</div>
                        <div className="font-mono text-sm text-gray-900">{asset.maxLTV}%</div>
                    </div>
                )}
            </div>

            {/* Collateral Badge */}
            {asset.canBeCollateral && type === 'supply' && (
                <div className="mt-3">
                    <span className="inline-block px-2 py-1 text-xs font-mono bg-green-50 text-green-700 rounded border border-green-200">
                        ✓ Can be collateral
                    </span>
                </div>
            )}
        </Link>
    );
};
