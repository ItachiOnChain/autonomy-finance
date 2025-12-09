// Royalty Simulator Page - Simplified with Manual IP Input

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRoyaltySimulator } from '../hooks/useRoyaltySimulator';
import { DEFAULT_REVENUE_PER_DERIVATIVE, DEFAULT_NUMBER_OF_DERIVATIVES, MAX_DERIVATIVES } from '../constants/royaltySimulator';

export default function RoyaltySimulator() {
    const { address, isConnected } = useAccount();
    const {
        isLoading,
        error,
        simulateRevenue,
        getRoyaltyBalance,
        getIpInfo
    } = useRoyaltySimulator();

    const [ipId, setIpId] = useState('');
    const [revenuePerDerivative, setRevenuePerDerivative] = useState(DEFAULT_REVENUE_PER_DERIVATIVE);
    const [numberOfDerivatives, setNumberOfDerivatives] = useState(DEFAULT_NUMBER_OF_DERIVATIVES);
    const [royaltyBalance, setRoyaltyBalance] = useState('0');
    const [lastSimulation, setLastSimulation] = useState<any>(null);

    // Fetch IP info when IP ID changes
    useEffect(() => {
        if (ipId && ipId.length > 10) {
            loadIpInfo();
        }
    }, [ipId]);

    const loadIpInfo = async () => {
        try {
            const info = await getIpInfo(ipId);
            if (info && info.owner !== '0x0000000000000000000000000000000000000000') {
                // CRITICAL FIX: Load balance by IP ID, not owner address
                const balance = await getRoyaltyBalance(ipId);
                setRoyaltyBalance(balance);
            }
        } catch (err) {
            console.error('Failed to load IP info:', err);
        }
    };

    const handleSimulate = async () => {
        if (!ipId || !address) return;

        // Validate inputs
        const revenue = parseFloat(revenuePerDerivative);
        if (revenue < 0) {
            alert('Royalty earned per derivative must be >= 0');
            return;
        }

        if (numberOfDerivatives < 1 || numberOfDerivatives > MAX_DERIVATIVES) {
            alert(`Number of derivatives must be between 1 and ${MAX_DERIVATIVES}`);
            return;
        }

        // Calculate royalty to mint using SIMPLE MULTIPLICATION
        const royaltyToMint = revenue * numberOfDerivatives;

        if (royaltyToMint === 0) {
            alert('Royalty to mint cannot be zero. Please enter valid amounts.');
            return;
        }

        try {
            const result = await simulateRevenue(
                ipId,
                revenuePerDerivative,
                numberOfDerivatives
            );

            setLastSimulation(result);
            await loadIpInfo(); // Refresh balance
        } catch (err) {
            console.error('Simulation failed:', err);
            alert('Simulation failed. Please check console for details.');
        }
    };

    // CRITICAL FIX: Simple multiplication - NO royaltyPercent division
    const royaltyToMint = parseFloat(revenuePerDerivative) * numberOfDerivatives;

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-[#02060b] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                    <p className="text-white/60">Please connect your wallet to use the Royalty Simulator</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#02060b] p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ROYALTY SIMULATOR</h1>
                    <p className="text-white/60">Simulate derivative revenue distribution for Story Protocol IP assets</p>
                </div>

                {/* IP Input */}
                <div className="bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 rounded-2xl p-6 mb-6">
                    <label className="block text-xs tracking-wider text-white/70 mb-2">IP ADDRESS (STORY PROTOCOL IP ID)</label>
                    <input
                        type="text"
                        value={ipId}
                        onChange={(e) => setIpId(e.target.value)}
                        placeholder="Paste your IP ID here (e.g., 0x1234...)"
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:border-[#8AE06C] focus:outline-none"
                    />
                    <p className="text-xs text-white/40 mt-2">Enter the Story Protocol IP ID you want to simulate royalties for</p>
                </div>

                {/* Simulation Parameters */}
                <div className="bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">SIMULATION PARAMETERS</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs tracking-wider text-white/70 mb-2">
                                ROYALTY EARNED PER DERIVATIVE (USD)
                            </label>
                            <input
                                type="number"
                                value={revenuePerDerivative}
                                onChange={(e) => setRevenuePerDerivative(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#8AE06C] focus:outline-none"
                                min="0"
                                step="1"
                                placeholder="Enter royalty amount in USD"
                            />
                        </div>

                        <div>
                            <label className="block text-xs tracking-wider text-white/70 mb-2">
                                NUMBER OF DERIVATIVES (Max: {MAX_DERIVATIVES})
                            </label>
                            <input
                                type="number"
                                value={numberOfDerivatives}
                                onChange={(e) => setNumberOfDerivatives(parseInt(e.target.value) || 1)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-[#8AE06C] focus:outline-none"
                                min="1"
                                max={MAX_DERIVATIVES}
                                step="1"
                            />
                        </div>

                        <div className="p-4 bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg">
                            <div className="text-sm">
                                <span className="text-white/60">Royalty to mint (tokens):</span>
                                <span className="text-[#8AE06C] ml-2 font-bold text-lg">{royaltyToMint.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-white/40 mt-2">
                                Calculation: {numberOfDerivatives} × {parseFloat(revenuePerDerivative).toFixed(2)} = {royaltyToMint.toFixed(2)} tokens
                            </p>
                        </div>
                    </div>
                </div>

                {/* Simulate Button */}
                <div className="mb-6">
                    <button
                        onClick={handleSimulate}
                        disabled={isLoading || !ipId || !address}
                        className="w-full py-4 bg-[#8AE06C]/20 border border-[#8AE06C]/40 rounded-lg text-[#8AE06C] hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]/60 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Simulating...' : 'SIMULATE REVENUE'}
                    </button>
                </div>

                {/* Results */}
                {lastSimulation && (
                    <div className="bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">LAST SIMULATION RESULTS</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">Transaction Hash:</span>
                                <a
                                    href={`https://aeneid.storyscan.io/tx/${lastSimulation.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#8AE06C] hover:underline font-mono"
                                >
                                    {lastSimulation.txHash.substring(0, 10)}...
                                </a>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Total Royalty (Current Transaction):</span>
                                <span className="text-[#8AE06C] font-bold">{royaltyToMint.toFixed(2)} tokens</span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                                <span className="text-white/60 font-bold">Total Balance:</span>
                                <span className="text-[#8AE06C] font-bold text-lg">{royaltyBalance} tokens</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
