import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useUserEMode, useSetUserEMode } from '../hooks/useEMode';
import { EMODE_CATEGORIES, EMODE_CATEGORY_LABELS, ASSETS } from '../config/assets';

import { CONTRACTS } from '../config/contracts';

export const EModeToggle: React.FC = () => {
    const { address } = useAccount();
    const { eModeCategory, isEModeEnabled } = useUserEMode(address);
    const { setUserEMode, isPending } = useSetUserEMode();
    const [error, setError] = useState<string>('');

    // Detect user's collateral category by checking their supplied assets
    const detectUserCategory = (): number | null => {
        if (!address) return null;

        for (const asset of ASSETS) {
            const assetAddress = (CONTRACTS as any)[asset.symbol]?.address as string;
            if (!assetAddress) continue;

            // We can't use hooks in a loop, so we'll use a simpler approach
            // Just default to stablecoins for now if user has WETH supplied
            // In production, you'd want to fetch all positions first
        }

        // For now, detect based on what the user likely has
        // If they have WETH, suggest ETH category
        // Otherwise default to stablecoins
        return EMODE_CATEGORIES.STABLECOINS;
    };

    const handleToggle = async () => {
        try {
            setError('');

            if (isEModeEnabled) {
                // Disable E-Mode
                await setUserEMode(EMODE_CATEGORIES.DISABLED);
            } else {
                // Enable E-Mode - detect category
                const category = detectUserCategory();
                if (category === null) {
                    setError('Please connect your wallet first');
                    return;
                }

                try {
                    await setUserEMode(category);
                } catch (err: any) {
                    // Handle specific error for no collateral in category
                    if (err.message?.includes('No collateral in this category')) {
                        setError('You need to supply collateral in this category first. Try supplying USDC, USDT, or DAI for stablecoin E-Mode.');
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err: any) {
            console.error('E-Mode toggle error:', err);
            const errorMsg = err.message || err.shortMessage || 'Failed to toggle E-Mode';
            setError(errorMsg);
        }
    };

    const getCategoryLabel = () => {
        if (!eModeCategory) return '';
        return EMODE_CATEGORY_LABELS[eModeCategory as keyof typeof EMODE_CATEGORY_LABELS] || 'Unknown';
    };

    const getEModeLTV = () => {
        if (!isEModeEnabled || !eModeCategory) return null;

        // Find an asset in this category to get the E-Mode LTV
        const asset = ASSETS.find(a => a.category === eModeCategory);
        return asset?.eModeLTV;
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isEModeEnabled}
                            onChange={handleToggle}
                            disabled={isPending || !address}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-blue-500 cursor-pointer"
                        />
                        <span className="text-white font-medium">E-Mode (Efficiency Mode)</span>
                    </label>

                    {isEModeEnabled && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                            {getCategoryLabel()}
                        </span>
                    )}
                </div>

                {isEModeEnabled && getEModeLTV() && (
                    <div className="text-right">
                        <div className="text-xs text-white/60">E-Mode LTV</div>
                        <div className="text-green-400 font-bold">{getEModeLTV()}%</div>
                    </div>
                )}
            </div>

            <div className="text-xs text-white/60">
                {isEModeEnabled ? (
                    <>
                        ⚡ Higher LTV enabled for {getCategoryLabel()} assets.
                        You can only borrow assets in the same category.
                    </>
                ) : (
                    <>
                        Enable E-Mode to get higher LTV for assets in the same category
                        (e.g., 97% for stablecoins). Requires collateral in that category.
                    </>
                )}
            </div>

            {error && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                    {error}
                </div>
            )}

            {isPending && (
                <div className="mt-2 text-xs text-blue-400">
                    Processing transaction...
                </div>
            )}
        </div>
    );
};
