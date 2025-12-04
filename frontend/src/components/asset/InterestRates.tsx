import React from 'react';

interface InterestRatesProps {
    asset: {
        symbol: string;
    };
    rates: {
        supplyAPR: number;
        borrowAPR: number;
    };
}

export const InterestRates: React.FC<InterestRatesProps> = ({ asset, rates }) => {
    const { supplyAPR, borrowAPR } = rates;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Interest Rates</h2>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <div className="text-sm text-gray-500 mb-2">APY</div>
                    <div className="text-3xl font-bold text-green-600">
                        {supplyAPR.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Earn by supplying {asset.symbol}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-gray-500 mb-2">APR</div>
                    <div className="text-3xl font-bold text-red-600">
                        {borrowAPR.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Cost of borrowing {asset.symbol}
                    </div>
                </div>
            </div>
        </div>
    );
};
