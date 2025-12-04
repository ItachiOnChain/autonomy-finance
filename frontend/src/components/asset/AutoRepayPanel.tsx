import React, { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { useStoryProtocol } from '../../hooks/useStoryProtocol';
import { CONTRACTS } from '../../config/contracts';
import { useAccount } from 'wagmi';
import { ROYALTY_TOKENS, type RoyaltyToken } from '../../config/royaltyTokens';

interface TokenBalance {
    token: RoyaltyToken;
    balance: string;
    balanceRaw: bigint;
}

interface AutoRepayPanelProps {
    asset: {
        symbol: string;
        decimals: number;
        name: string;
    };
    assetAddress: string;
    userBorrowed: bigint;
    onRepayComplete: () => void;
}

export const AutoRepayPanel: React.FC<AutoRepayPanelProps> = ({
    asset,
    assetAddress: _assetAddress, // Destructure but rename to indicate unused
    userBorrowed,
    onRepayComplete
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [ipaId, setIpaId] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { lockIPA, getRoyaltyBalance, claimRoyalty, getLockedIP, autoRepayFromRoyalty, isLoading: storyLoading } = useStoryProtocol();
    // const { repay, approve } = useLendingPool(); // Removed unused hook
    const { address } = useAccount();

    // Check for existing lock on mount
    useEffect(() => {
        if (!address) return;
        const checkLock = async () => {
            const lockedId = await getLockedIP(address);
            if (lockedId) {
                setIpaId(lockedId);
                setIsLocked(true);
            }
        };
        checkLock();
    }, [address, getLockedIP]);

    // Fetch royalty balances for all tokens when IPA is locked
    useEffect(() => {
        if (!isLocked || !ipaId) return;

        const fetchBalances = async () => {
            try {
                const balancePromises = ROYALTY_TOKENS.map(async (token) => {
                    const balanceRaw = await getRoyaltyBalance(ipaId, token.address);
                    const balance = formatUnits(balanceRaw, token.decimals);
                    return { token, balance, balanceRaw };
                });
                const balances = await Promise.all(balancePromises);
                setTokenBalances(balances);
            } catch (err) {
                console.error('Error fetching royalty balances:', err);
            }
        };

        fetchBalances();
        const interval = setInterval(fetchBalances, 5000);
        return () => clearInterval(interval);
    }, [isLocked, ipaId, getRoyaltyBalance]);

    const handleLockIP = async () => {
        if (!ipaId) {
            setError('Please enter an IPA ID');
            return;
        }

        setError('');
        setSuccess('');
        setIsProcessing(true);

        try {
            await lockIPA(ipaId);
            setIsLocked(true);
            setSuccess('✅ IP locked successfully! You can now use royalties for auto-repayment.');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            console.error('Lock IP error:', err);
            setError(`Failed to lock IP: ${err.message || 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClaimAndRepay = async () => {
        if (!ipaId) return;

        setError('');
        setSuccess('');
        setIsProcessing(true);

        try {
            // Get MockRoyaltyToken balance from tokenBalances
            const mockTokenBalance = tokenBalances.find(tb => tb.token.symbol === 'MOCK');
            if (!mockTokenBalance || mockTokenBalance.balanceRaw === 0n) {
                setError('No MOCK token royalties available to claim');
                setIsProcessing(false);
                return;
            }

            // Step 1: Claim royalties from Story Protocol
            setSuccess('⏳ Claiming royalties...');
            await claimRoyalty(ipaId, CONTRACTS.MockRoyaltyToken.address as string);

            // Step 2: Auto-Repay using AutoRepayEngine
            // This handles approval, swap (if needed), and repay in one flow
            setSuccess('⏳ Executing auto-repay...');

            // Note: In Phase 1, we claim MockRoyaltyToken and repay using it (via engine)
            // The engine handles the swap to USDC if needed
            await autoRepayFromRoyalty(
                ipaId,
                CONTRACTS.MockRoyaltyToken.address as string,
                mockTokenBalance.balance, // Use MOCK balance
                '0', // Min out (0 for dev/testnet)
                50, // Slippage
                _assetAddress // Preferred debt asset (use the one from props)
            );

            // Step 3: Success!
            setSuccess('✅ Auto-repay complete! Debt has been reduced.');

            // Refresh balances locally
            setTokenBalances(prev => prev.map(tb =>
                tb.token.symbol === 'MOCK' ? { ...tb, balance: '0', balanceRaw: 0n } : tb
            ));

            // Notify parent to refresh data with delay to ensure node indexing
            // Immediate refresh
            onRepayComplete();

            // Delayed refresh (1s)
            setTimeout(() => {
                console.log('Triggering delayed refresh (1s)...');
                onRepayComplete();
            }, 1000);

            // Backup refresh (3s)
            setTimeout(() => {
                console.log('Triggering backup refresh (3s)...');
                onRepayComplete();
            }, 3000);

            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            console.error('Auto-repay error:', err);
            setError(`Auto-repay failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header - Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900">Auto Repay Simulator</h3>
                        <p className="text-sm text-gray-500">Use IP royalties to automatically repay debt</p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-4 text-sm">
                            {success}
                        </div>
                    )}

                    {!isLocked ? (
                        /* Step 1: Lock IP */
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>How it works:</strong> Lock your IP asset to enable automatic debt repayment using royalties.
                                    Your IP is NOT used as collateral for borrowing - it only enables auto-repayment of existing debt.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter your IPA ID
                                </label>
                                <input
                                    type="text"
                                    value={ipaId}
                                    onChange={(e) => setIpaId(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isProcessing}
                                />
                            </div>

                            <button
                                onClick={handleLockIP}
                                disabled={isProcessing || !ipaId || storyLoading}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {isProcessing ? 'Locking...' : 'Lock IP for Auto-Repay'}
                            </button>
                        </div>
                    ) : (
                        /* Step 2: View Balance & Claim/Repay */
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Locked IPA ID</p>
                                    <p className="text-sm font-mono text-gray-900 break-all">{ipaId}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-2">Royalty Balances</p>
                                    <div className="grid grid-cols-1 gap-2 mb-3">
                                        {tokenBalances.map(({ token, balance, balanceRaw }) => {
                                            const hasBalance = balanceRaw > 0n;
                                            return (
                                                <div
                                                    key={token.symbol}
                                                    className={`p-2 rounded text-center ${hasBalance
                                                        ? 'bg-green-50 border border-green-200'
                                                        : 'bg-gray-50 border border-gray-200'
                                                        }`}
                                                >
                                                    <p className="text-xs text-gray-500 font-medium">{token.symbol}</p>
                                                    <p className={`text-sm font-mono ${hasBalance ? 'text-green-700 font-bold' : 'text-gray-400'
                                                        }`}>
                                                        {parseFloat(balance) > 0 ? parseFloat(balance).toFixed(token.decimals === 18 ? 4 : 2) : '0'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Debt ({asset.symbol})</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {formatUnits(userBorrowed, asset.decimals)} {asset.symbol}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClaimAndRepay}
                                disabled={isProcessing || tokenBalances.every(tb => tb.balanceRaw === 0n) || userBorrowed === 0n}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Claim & Auto-Repay Debt'}
                            </button>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs text-yellow-800">
                                    ⚠️ <strong>Note:</strong> In production, royalties will be automatically converted to {asset.symbol} before repayment.
                                    For local testing, this conversion is simulated.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setIsLocked(false);
                                    setIpaId('');
                                    setTokenBalances([]);
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Unlock & Change IP
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
