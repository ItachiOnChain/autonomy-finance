import React from 'react';

interface InterestRatesProps {
    asset: { symbol: string };
    rates: { supplyAPR: number; borrowAPR: number };
}

export const InterestRates: React.FC<InterestRatesProps> = ({ asset, rates }) => {
    const { supplyAPR, borrowAPR } = rates;

    return (
        <div
            className="
                bg-black/40 
                border border-[#8AE06C]/25
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                shadow-[0_0_25px_rgba(138,224,108,0.18)]
                font-mono
            "
        >
            {/* Title */}
            <h2 className="text-xs text-white/60 tracking-[0.28em] uppercase mb-6">
                INTEREST RATES
            </h2>

            <div className="grid grid-cols-2 gap-8">

                {/* SUPPLY APY */}
                <div>
                    <div className="text-[10px] text-white/40 tracking-wider mb-1">
                        APY
                    </div>

                    <div
                        className="
                            text-3xl font-bold 
                            text-[#8AE06C]
                            drop-shadow-[0_0_12px_rgba(138,224,108,0.65)]
                        "
                    >
                        {supplyAPR.toFixed(2)}%
                    </div>

                    <div className="text-[11px] text-white/45 mt-1">
                        Earn yield by supplying {asset.symbol}
                    </div>
                </div>

                {/* BORROW APR */}
                <div>
                    <div className="text-[10px] text-white/40 tracking-wider mb-1">
                        APR
                    </div>

                    <div
                        className="
                            text-3xl font-bold 
                            text-red-400
                            drop-shadow-[0_0_10px_rgba(255,90,90,0.55)]
                        "
                    >
                        {borrowAPR.toFixed(2)}%
                    </div>

                    <div className="text-[11px] text-white/45 mt-1">
                        Borrowing cost for {asset.symbol}
                    </div>
                </div>
            </div>
        </div>
    );
};
