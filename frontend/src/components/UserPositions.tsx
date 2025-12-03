import React from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { ASSETS } from '../config/assets';
import { useUserPosition, useAssetData } from '../hooks/useLendingPool';
import { CONTRACTS } from '../config/contracts';
import { EModeToggle } from './EModeToggle';

interface UserPositionRowProps {
    symbol: string;
    type: 'supply' | 'borrow';
}

const UserPositionRow: React.FC<UserPositionRowProps> = ({ symbol, type }) => {
    const asset = ASSETS.find(a => a.symbol === symbol);

    const assetAddress = asset ? (CONTRACTS as any)[asset.symbol]?.address as string : undefined;

    // ALWAYS call hooks first, before any early returns
    const { supplied, borrowed } = useUserPosition(assetAddress || '');
    const { supplyAPR, borrowAPR } = useAssetData(assetAddress || '');

    // Now we can safely return early after all hooks are called
    if (!asset) return null;
    if (!assetAddress) return null;

    const amount = type === 'supply' ? supplied : borrowed;
    const apr = type === 'supply' ? supplyAPR : borrowAPR;

    // Don't render if no position
    if (amount === 0n) return null;

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            {/* Asset Info */}
            <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{asset.logo}</div>
                <div>
                    <div className="font-bold text-sm text-gray-900">{asset.symbol}</div>
                    <div className="text-xs text-gray-500">{asset.name}</div>
                </div>
            </div>

            {/* Amount */}
            <div className="flex-1 text-right px-4">
                <div className="font-mono text-sm text-gray-900 font-medium">
                    {formatUnits(amount, asset.decimals)}
                </div>
                <div className="text-xs text-gray-500">{asset.symbol}</div>
            </div>

            {/* APY/APR */}
            <div className="flex-1 text-right px-4">
                <div className="font-bold text-sm" style={{ color: asset.color }}>
                    {apr.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500">
                    {type === 'supply' ? 'APY' : 'APR'}
                </div>
            </div>

            {/* Actions */}
            <div className="flex-none">
                <button
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/ asset / ${symbol} `;
                    }}
                >
                    Details
                </button>
            </div>
        </div>
    );
};

export const UserPositions: React.FC = () => {
    const { isConnected } = useAccount();

    // Get all assets
    const allAssets = ASSETS;

    // ALWAYS call hooks first - get positions for ALL assets unconditionally
    // This ensures consistent hook order on every render
    const positions = allAssets.map(asset => {
        const assetAddress = (CONTRACTS as any)[asset.symbol]?.address;
        // Call hook even if address is undefined - it will return default values
        const position = useUserPosition(assetAddress || '');
        return {
            symbol: asset.symbol,
            assetAddress,
            ...position
        };
    });

    // Now we can safely check if not connected and return early
    if (!isConnected) return null;

    // Check if user has any positions (after all hooks are called)
    const hasSupplies = positions.some(p => p.assetAddress && p.supplied > 0n);
    const hasBorrows = positions.some(p => p.assetAddress && p.borrowed > 0n);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Your Supplies */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Supplies</h2>

                <div className="min-h-[120px]">
                    {hasSupplies ? (
                        <div className="space-y-1">
                            {allAssets.map(asset => (
                                <UserPositionRow key={`supply - ${asset.symbol} `} symbol={asset.symbol} type="supply" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[120px] text-center">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Nothing supplied yet</div>
                                <div className="text-xs text-gray-400">Supply assets below to start earning</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Your Borrows */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Borrows</h2>

                {/* E-Mode Toggle - always show when connected */}
                <div className="mb-4">
                    <EModeToggle />
                </div>

                <div className="min-h-[120px]">
                    {hasBorrows ? (
                        <div className="space-y-1">
                            {allAssets.map(asset => (
                                <UserPositionRow key={`borrow-${asset.symbol}`} symbol={asset.symbol} type="borrow" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[120px] text-center">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Nothing borrowed yet</div>
                                <div className="text-xs text-gray-400">Supply collateral to start borrowing</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
