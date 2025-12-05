import React, { useState } from 'react';

type ActionType = 'supply' | 'withdraw' | 'borrow' | 'repay';

interface AssetActionsProps {
    asset: { symbol: string; decimals: number };
    isConnected: boolean;
    isProcessing: boolean;
    userPosition: { supplied: bigint; borrowed: bigint };
    allowance: bigint;
    actions: {
        onSupply: (amount: string) => void;
        onWithdraw: (amount: string) => void;
        onBorrow: (amount: string) => void;
        onRepay: (amount: string) => void;
        onApprove: (amount: string) => void;
    };
    amounts: { supply: string; withdraw: string; borrow: string; repay: string };
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

    const tabs: { id: ActionType; label: string }[] = [
        { id: 'supply', label: 'SUPPLY' },
        { id: 'withdraw', label: 'WITHDRAW' },
        { id: 'borrow', label: 'BORROW' },
        { id: 'repay', label: 'REPAY' }
    ];

    /* ------------------- INPUT FIELD ------------------- */
    const renderInput = (value: string, onChange: (v: string) => void) => (
        <input
            type="number"
            value={value}
            placeholder="0.00"
            onChange={(e) => onChange(e.target.value)}
            disabled={!isConnected || isProcessing}
            className="
                w-full px-4 py-3 
                rounded-xl 
                bg-black/40 
                border border-white/10 
                text-white font-mono 
                focus:border-[#8AE06C] 
                focus:ring-0
                placeholder-white/30
                transition
            "
        />
    );

    /* ------------------- TAB CONTENT ------------------- */
    const renderTabContent = () => {
        const toWei = (val: string) =>
            val ? BigInt(Math.floor(parseFloat(val) * 10 ** asset.decimals)) : 0n;

        switch (activeTab) {
            case 'supply': {
                const needsApproval = toWei(amounts.supply) > allowance;
                return (
                    <div className="space-y-4">
                        {renderInput(amounts.supply, setAmounts.setSupply)}

                        <button
                            onClick={() =>
                                needsApproval
                                    ? actions.onApprove(amounts.supply)
                                    : actions.onSupply(amounts.supply)
                            }
                            disabled={!amounts.supply || isProcessing}
                            className={`
                                w-full py-3 rounded-xl font-mono 
                                transition 
                                ${needsApproval
                                    ? 'bg-yellow-600/30 border border-yellow-400/40 text-yellow-300'
                                    : 'bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]'
                                }
                                hover:bg-[#8AE06C]/30
                                disabled:opacity-40 disabled:cursor-not-allowed
                            `}
                        >
                            {isProcessing
                                ? 'Processing...'
                                : needsApproval
                                ? `Approve & Supply ${asset.symbol}`
                                : 'Supply'}
                        </button>
                    </div>
                );
            }

            case 'withdraw':
                if (userPosition.supplied === 0n)
                    return <p className="text-center text-white/40 font-mono py-6">No supply available.</p>;

                return (
                    <div className="space-y-4">
                        {renderInput(amounts.withdraw, setAmounts.setWithdraw)}

                        <button
                            onClick={() => actions.onWithdraw(amounts.withdraw)}
                            disabled={!amounts.withdraw || isProcessing}
                            className="
                                w-full py-3 rounded-xl font-mono
                                bg-blue-600/20 text-blue-300
                                border border-blue-400/30
                                hover:bg-blue-600/30
                                transition
                                disabled:opacity-40 disabled:cursor-not-allowed
                            "
                        >
                            {isProcessing ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                );

            case 'borrow':
                return (
                    <div className="space-y-4">
                        {renderInput(amounts.borrow, setAmounts.setBorrow)}

                        <button
                            onClick={() => actions.onBorrow(amounts.borrow)}
                            disabled={!amounts.borrow || isProcessing}
                            className="
                                w-full py-3 rounded-xl font-mono
                                bg-purple-600/20 text-purple-300
                                border border-purple-400/40
                                hover:bg-purple-600/30
                                transition
                                disabled:opacity-40 disabled:cursor-not-allowed
                            "
                        >
                            {isProcessing ? 'Processing...' : 'Borrow'}
                        </button>
                    </div>
                );

            case 'repay': {
                if (userPosition.borrowed === 0n)
                    return <p className="text-center text-white/40 font-mono py-6">No debt to repay.</p>;

                const needsApproval = toWei(amounts.repay) > allowance;

                return (
                    <div className="space-y-4">
                        {renderInput(amounts.repay, setAmounts.setRepay)}

                        <button
                            onClick={() =>
                                needsApproval
                                    ? actions.onApprove(amounts.repay)
                                    : actions.onRepay(amounts.repay)
                            }
                            disabled={!amounts.repay || isProcessing}
                            className={`
                                w-full py-3 rounded-xl font-mono 
                                transition
                                ${
                                    needsApproval
                                        ? 'bg-yellow-600/30 border border-yellow-400/40 text-yellow-300'
                                        : 'bg-orange-600/20 border border-orange-400/40 text-orange-300'
                                }
                                hover:bg-orange-600/30
                                disabled:opacity-40 disabled:cursor-not-allowed
                            `}
                        >
                            {isProcessing
                                ? 'Processing...'
                                : needsApproval
                                ? `Approve ${asset.symbol}`
                                : 'Repay'}
                        </button>
                    </div>
                );
            }
        }
    };

    /* ------------------- DISCONNECTED STATE ------------------- */
    if (!isConnected) {
        return (
            <div className="
                bg-black/40 border border-white/10 
                rounded-2xl p-6 text-center font-mono text-white/70
            ">
                Connect wallet to interact
            </div>
        );
    }

    /* ------------------- MAIN PANEL ------------------- */
    return (
        <div
            className="
                bg-black/40 
                backdrop-blur-xl 
                border border-white/10 
                rounded-2xl 
                overflow-hidden 
                shadow-[0_0_20px_rgba(138,224,108,0.08)]
            "
        >
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 py-4 text-xs font-mono tracking-wide 
                            transition relative
                            ${
                                activeTab === tab.id
                                    ? 'text-[#8AE06C]'
                                    : 'text-white/40 hover:text-white/70'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8AE06C]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6">{renderTabContent()}</div>
        </div>
    );
};
