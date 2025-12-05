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
        <div
            className="
                bg-black/40 
                backdrop-blur-xl
                border border-white/10 
                rounded-2xl 
                p-6 
                shadow-[0_0_18px_rgba(138,224,108,0.12)]
                font-mono
                text-white
            "
        >
            {/* Title */}
            <h2
                className="
                    text-lg 
                    font-bold 
                    tracking-wide 
                    text-white 
                    mb-4
                "
            >
                ASSET INFORMATION
            </h2>

            <div className="space-y-4">

                {/* Max LTV */}
                <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm tracking-wide">
                        MAX LTV
                    </span>
                    <span className="font-bold text-[#8AE06C] text-base drop-shadow-[0_0_8px_rgba(138,224,108,0.4)]">
                        {asset.maxLTV}%
                    </span>
                </div>

                {/* Collateral status */}
                <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm tracking-wide">
                        COLLATERAL STATUS
                    </span>

                    {asset.canBeCollateral ? (
                        <span
                            className="
                                text-[#8AE06C] 
                                bg-[#8AE06C]/15 
                                border border-[#8AE06C]/40
                                px-2 py-1 
                                rounded-md 
                                text-xs 
                                tracking-wide
                            "
                        >
                            ✓ CAN BE COLLATERAL
                        </span>
                    ) : (
                        <span
                            className="
                                text-red-400 
                                bg-red-500/10 
                                border border-red-500/30
                                px-2 py-1 
                                rounded-md 
                                text-xs 
                                tracking-wide
                            "
                        >
                            ✗ NOT COLLATERAL
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};
