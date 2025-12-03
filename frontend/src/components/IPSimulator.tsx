import React, { useState } from 'react';
import { useStoryProtocol } from '../hooks/useStoryProtocol';
import { CONTRACTS } from '../config/contracts';

interface IPSimulatorProps {
    onRoyaltyPaid?: () => void;
}

export function IPSimulator({ onRoyaltyPaid }: IPSimulatorProps) {
    const { payRoyalty, isLoading, error } = useStoryProtocol();
    const [ipaId, setIpaId] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState<string>(CONTRACTS.MockRoyaltyToken.address);
    const [success, setSuccess] = useState('');

    const handlePayRoyalty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ipaId || !amount) return;

        setSuccess('');
        try {
            await payRoyalty(ipaId, selectedToken, amount);
            setSuccess('✅ Royalty paid successfully!');
            setAmount('');

            // Notify parent to refresh balance
            if (onRoyaltyPaid) {
                onRoyaltyPaid();
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Royalty Simulator</h2>
            <p className="text-gray-400 text-sm mb-6">
                Simulate real-world usage of your IP by paying royalties to it.
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg mb-4 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handlePayRoyalty} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Target IPA ID
                    </label>
                    <input
                        type="text"
                        value={ipaId}
                        onChange={(e) => setIpaId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="0x..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Royalty Token
                    </label>
                    <select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value={CONTRACTS.MockRoyaltyToken.address}>MOCK Token</option>
                        <option value={CONTRACTS.USDC.address}>USDC</option>
                        <option value={CONTRACTS.USDT.address}>USDT</option>
                        <option value={CONTRACTS.WETH.address}>WETH</option>
                        <option value={CONTRACTS.WBTC.address}>WBTC</option>
                        <option value={CONTRACTS.DAI.address}>DAI</option>
                        <option value={CONTRACTS.LINK.address}>LINK</option>
                        <option value={CONTRACTS.UNI.address}>UNI</option>
                        <option value={CONTRACTS.AAVE.address}>AAVE</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Amount
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="0.00"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                    {isLoading ? 'Paying...' : 'Pay Royalty'}
                </button>
            </form>
        </div>
    );
}
