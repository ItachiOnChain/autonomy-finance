import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { IPSimulator } from './IPSimulator';
import { useStoryProtocol } from '../hooks/useStoryProtocol';
import { ROYALTY_TOKENS, type RoyaltyToken } from '../config/royaltyTokens';

interface TokenBalance {
    token: RoyaltyToken;
    balance: string;
    balanceRaw: bigint;
}

export function IPDashboard() {
    const { getRoyaltyBalance } = useStoryProtocol();

    const [ipaId, setIpaId] = useState('');
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalance = async () => {
        if (!ipaId) return;
        setIsLoading(true);
        try {
            // Query all token balances in parallel
            const balancePromises = ROYALTY_TOKENS.map(async (token) => {
                const balanceRaw = await getRoyaltyBalance(ipaId, token.address);
                const balance = formatUnits(balanceRaw, token.decimals);
                return { token, balance, balanceRaw };
            });

            const balances = await Promise.all(balancePromises);
            setTokenBalances(balances);
        } catch (err) {
            console.error(err);
            setTokenBalances([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-refresh balance every 5 seconds when IPA ID is set
    useEffect(() => {
        if (!ipaId) return;

        fetchBalance();
        const interval = setInterval(fetchBalance, 5000);

        return () => clearInterval(interval);
    }, [ipaId]);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">IP Dashboard</h1>
                <Link
                    to="/ip-mint"
                    className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg font-bold transition-colors"
                >
                    + Create New IP
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: IP Details */}
                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">View IP Asset</h2>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Enter IPA ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ipaId}
                                    onChange={(e) => setIpaId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="0x..."
                                />
                                <button
                                    onClick={fetchBalance}
                                    disabled={isLoading || !ipaId}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Loading...' : 'Load'}
                                </button>
                            </div>
                        </div>

                        {ipaId && (
                            <div className="space-y-4">
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-gray-400 text-xs uppercase">IPA ID</p>
                                    <p className="text-sm font-mono text-white break-all">{ipaId}</p>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4">
                                    <p className="text-gray-400 text-xs uppercase mb-3">Royalty Balances</p>
                                    {isLoading ? (
                                        <p className="text-sm text-gray-500">Loading balances...</p>
                                    ) : tokenBalances.length === 0 ? (
                                        <p className="text-sm text-gray-500">No balances loaded</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {tokenBalances.map(({ token, balance, balanceRaw }) => {
                                                const hasBalance = balanceRaw > 0n;
                                                return (
                                                    <div
                                                        key={token.symbol}
                                                        className={`p-3 rounded-lg ${hasBalance
                                                            ? 'bg-green-900/20 border border-green-700'
                                                            : 'bg-gray-900/50 border border-gray-700'
                                                            }`}
                                                    >
                                                        <p className="text-xs text-gray-400 uppercase">{token.symbol}</p>
                                                        <p className={`text-lg font-mono ${hasBalance ? 'text-green-400 font-bold' : 'text-gray-500'
                                                            }`}>
                                                            {parseFloat(balance) > 0 ? balance : '0'}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                                    <p className="text-xs text-blue-300">
                                        💡 This dashboard shows IP asset details and royalty balances for all supported tokens.
                                        To use royalties for auto-repayment, go to an asset page and lock your IP there.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Simulator */}
                <div>
                    <IPSimulator onRoyaltyPaid={fetchBalance} />
                </div>
            </div>
        </div>
    );
}
