import React, { useState } from 'react';

type ActionType = 'supply' | 'withdraw' | 'borrow' | 'repay';

interface AssetActionsProps {
    asset: {
        symbol: string;
        decimals: number;
    };
    isConnected: boolean;
    isProcessing: boolean;
    userPosition: {
        supplied: bigint;
        borrowed: bigint;
    };
    allowance: bigint;
    actions: {
        onSupply: (amount: string) => void;
        onWithdraw: (amount: string) => void;
        onBorrow: (amount: string) => void;
        onRepay: (amount: string) => void;
        onApprove: (amount: string) => void;
    };
    amounts: {
        supply: string;
        withdraw: string;
        borrow: string;
        repay: string;
    };
    setAmounts: {
        setSupply: (val: string) => void;
        setWithdraw: (val: string) => void;
        setBorrow: (val: string) => void;
        setRepay: (val: string) => void;
    };
}

export const AssetActions: React.FC<AssetActionsProps> = ({
    asset,
    isConnected,
    isProcessing,
    userPosition,
    allowance,
    actions,
    amounts,
    setAmounts
}) => {
    const [activeTab, setActiveTab] = useState<ActionType>('supply');

    const tabs: { id: ActionType; label: string; color: string }[] = [
        { id: 'supply', label: 'Supply', color: 'bg-green-600' },
        { id: 'withdraw', label: 'Withdraw', color: 'bg-blue-600' },
        { id: 'borrow', label: 'Borrow', color: 'bg-purple-600' },
        { id: 'repay', label: 'Repay', color: 'bg-orange-600' }
    ];

    // Filter tabs based on position (e.g. can't withdraw if nothing supplied)
    // Actually, keeping all tabs visible is better UX, just disable inputs/buttons if needed
    // But let's follow the original logic where panels were conditional?
    // Original logic: Supply always visible. Withdraw if supplied > 0. Borrow always visible. Repay if borrowed > 0.
    // Let's keep all tabs but maybe disable them visually or just show empty state?
    // For a "professional" look, tabs are usually always there, or at least Supply/Borrow.
    // Let's keep all tabs accessible.

    const renderInput = (
        value: string,
        onChange: (val: string) => void,
        placeholder: string = "0.0"
    ) => (
        <input
            type="number"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected || isProcessing}
        />
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'supply': {
                const needsApproval = amounts.supply && BigInt(Math.floor(parseFloat(amounts.supply) * 10 ** asset.decimals)) > allowance;
                return (
                    <div className="space-y-3">
                        {renderInput(amounts.supply, setAmounts.setSupply)}
                        <button
                            onClick={() => actions.onSupply(amounts.supply)}
                            disabled={!isConnected || isProcessing || !amounts.supply}
                            className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${needsApproval ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : (needsApproval ? `Approve & Supply ${asset.symbol}` : 'Supply')}
                        </button>
                    </div>
                );
            }
            case 'withdraw': {
                if (userPosition.supplied === 0n) {
                    return <div className="text-center text-gray-500 py-4">You have no assets to withdraw.</div>;
                }
                return (
                    <div className="space-y-3">
                        {renderInput(amounts.withdraw, setAmounts.setWithdraw)}
                        <button
                            onClick={() => actions.onWithdraw(amounts.withdraw)}
                            disabled={!isConnected || isProcessing || !amounts.withdraw}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {isProcessing ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                );
            }
            case 'borrow': {
                return (
                    <div className="space-y-3">
                        {renderInput(amounts.borrow, setAmounts.setBorrow)}
                        <button
                            onClick={() => actions.onBorrow(amounts.borrow)}
                            disabled={!isConnected || isProcessing || !amounts.borrow}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {isProcessing ? 'Processing...' : 'Borrow'}
                        </button>
                    </div>
                );
            }
            case 'repay': {
                if (userPosition.borrowed === 0n) {
                    return <div className="text-center text-gray-500 py-4">You have no debt to repay.</div>;
                }
                // Check if approval is needed (same logic as supply)
                const needsApproval = amounts.repay && BigInt(Math.floor(parseFloat(amounts.repay) * 10 ** asset.decimals)) > allowance;
                return (
                    <div className="space-y-3">
                        {renderInput(amounts.repay, setAmounts.setRepay)}
                        {needsApproval ? (
                            <button
                                onClick={() => actions.onApprove(amounts.repay)}
                                disabled={!isConnected || isProcessing || !amounts.repay}
                                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : `Approve ${asset.symbol}`}
                            </button>
                        ) : (
                            <button
                                onClick={() => actions.onRepay(amounts.repay)}
                                disabled={!isConnected || isProcessing || !amounts.repay}
                                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Repay'}
                            </button>
                        )}
                    </div>
                );
            }
        }
    };

    if (!isConnected) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-sm text-yellow-800">
                        Connect your wallet to interact with this asset
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color}`}></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6">
                {renderTabContent()}
            </div>
        </div>
    );
};
