import React, { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { useStoryProtocol } from '../../hooks/useStoryProtocol';
import { getContracts, MARKET_CHAIN_ID } from '../../config/contracts';
import { useAccount } from 'wagmi';
import { ROYALTY_TOKENS, type RoyaltyToken } from '../../config/royaltyTokens';

interface TokenBalance {
    token: RoyaltyToken;
    balance: string;
    balanceRaw: bigint;
}

interface AutoRepayPanelProps {
    asset: { symbol: string; decimals: number; name: string };
    assetAddress: string;
    userBorrowed: bigint;
    onRepayComplete: () => void;
}

export const AutoRepayPanel: React.FC<AutoRepayPanelProps> = ({
    asset,
    assetAddress,
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

    const { lockIPA, getRoyaltyBalance, claimRoyalty, getLockedIP, autoRepayFromRoyalty } =
        useStoryProtocol();
    const { address } = useAccount();

    /* -------------------- CHECK LOCK -------------------- */
    useEffect(() => {
        if (!address) return;
        const load = async () => {
            const locked = await getLockedIP(address);
            if (locked) {
                setIpaId(locked);
                setIsLocked(true);
            }
        };
        load();
    }, [address, getLockedIP]);

    /* -------------------- FETCH ROYALTIES -------------------- */
    useEffect(() => {
        if (!isLocked || !ipaId) return;

        const fetch = async () => {
            const balances = await Promise.all(
                ROYALTY_TOKENS.map(async (t) => {
                    const bal = await getRoyaltyBalance(ipaId, t.address);
                    return {
                        token: t,
                        balance: formatUnits(bal, t.decimals),
                        balanceRaw: bal
                    };
                })
            );
            setTokenBalances(balances);
        };

        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, [isLocked, ipaId, getRoyaltyBalance]);

    /* -------------------- LOCK IP -------------------- */
    const handleLockIP = async () => {
        if (!ipaId) {
            setError('Enter an IPA ID');
            return;
        }

        setError('');
        setSuccess('');
        setIsProcessing(true);

        try {
            await lockIPA(ipaId);
            setIsLocked(true);
            setSuccess('✓ IP locked — Auto-repay enabled');
        } catch (err: any) {
            setError(err.message || 'Failed to lock IP');
        } finally {
            setIsProcessing(false);
        }
    };

    /* -------------------- CLAIM + REPAY -------------------- */
    const handleClaimAndRepay = async () => {
        setError('');
        setSuccess('');
        setIsProcessing(true);

        try {
            const mock = tokenBalances.find((b) => b.token.symbol === 'MOCK');
            if (!mock || mock.balanceRaw === 0n) {
                setError('No royalties available');
                setIsProcessing(false);
                return;
            }

            // Get contracts for MARKET chain
            const contracts = getContracts(MARKET_CHAIN_ID);
            const MockRoyaltyToken = contracts?.MockRoyaltyToken;

            if (!MockRoyaltyToken) {
                setError('MockRoyaltyToken not available');
                setIsProcessing(false);
                return;
            }

            setSuccess('⏳ Claiming royalties...');
            await claimRoyalty(ipaId, MockRoyaltyToken.address);

            setSuccess('⏳ Executing auto-repay...');
            await autoRepayFromRoyalty(
                ipaId,
                MockRoyaltyToken.address,
                mock.balance,
                '0',
                50,
                assetAddress
            );

            setSuccess('✓ Auto-repay complete');
            onRepayComplete();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message || 'Auto-repay failed');
        } finally {
            setIsProcessing(false);
        }
    };

    /* ------------------------ UI ------------------------ */
    return (
        <div
            className="
                bg-black/40 
                border border-[#8AE06C]/30 
                rounded-2xl 
                backdrop-blur-xl
                shadow-[0_0_20px_rgba(138,224,108,0.20)]
                overflow-hidden
                font-mono
            "
        >
            {/* HEADER */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="
                    w-full px-6 py-4 
                    flex items-center justify-between
                    hover:bg-[#8AE06C]/10 transition
                "
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <h3 className="text-white text-sm tracking-[0.15em]">AUTO REPAY SIMULATOR</h3>
                        <p className="text-xs text-white/50">Use royalties to reduce your debt</p>
                    </div>
                </div>

                <svg
                    className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* CONTENT */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-4 border-t border-[#8AE06C]/20 space-y-4">

                    {/* ERROR */}
                    {error && (
                        <div className="
                            bg-red-500/10 border border-red-500/40 
                            text-red-300 rounded-xl p-3 text-xs
                        ">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div className="
                            bg-green-500/10 border border-green-500/40 
                            text-green-300 rounded-xl p-3 text-xs
                        ">
                            {success}
                        </div>
                    )}

                    {/* ---------------- LOCK IP ---------------- */}
                    {!isLocked ? (
                        <div className="space-y-4">
                            <div className="
                                bg-[#8AE06C]/10 border border-[#8AE06C]/30 
                                rounded-xl p-3 text-xs text-[#8AE06C]/80
                            ">
                                Lock your IP to allow royalties from Story Protocol to automatically repay your debt.
                            </div>

                            <input
                                type="text"
                                value={ipaId}
                                onChange={(e) => setIpaId(e.target.value)}
                                placeholder="IPA ID (0x...)"
                                className="
                                    w-full px-4 py-3 
                                    bg-black/40 border border-[#8AE06C]/20 
                                    rounded-xl text-white text-sm
                                    placeholder-white/30
                                    focus:border-[#8AE06C] focus:ring-0
                                "
                                disabled={isProcessing}
                            />

                            <button
                                onClick={handleLockIP}
                                disabled={!ipaId || isProcessing}
                                className="
                                    w-full py-3 rounded-xl 
                                    bg-[#8AE06C]/20 border border-[#8AE06C]/40 
                                    text-[#8AE06C] font-bold text-xs
                                    hover:bg-[#8AE06C]/30 transition
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                "
                            >
                                {isProcessing ? 'Locking...' : 'LOCK IP'}
                            </button>
                        </div>
                    ) : (
                        /* ---------------- CLAIM + REPAY ---------------- */
                        <div className="space-y-4">

                            {/* IPA + Balances */}
                            <div className="bg-black/30 border border-[#8AE06C]/20 rounded-xl p-4">
                                <p className="text-[10px] text-white/50 uppercase">Locked IPA</p>
                                <p className="text-xs text-white break-all">{ipaId}</p>

                                <p className="text-[10px] text-white/50 uppercase mt-4">Royalty Balances</p>

                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {tokenBalances.map(({ token, balanceRaw, balance }) => (
                                        <div
                                            key={token.symbol}
                                            className={`
                                                p-2 rounded-xl text-center border 
                                                ${balanceRaw > 0n
                                                    ? 'border-[#8AE06C]/40 bg-[#8AE06C]/10 text-[#8AE06C]'
                                                    : 'border-white/10 bg-black/30 text-white/40'
                                                }
                                            `}
                                        >
                                            <p className="text-[10px]">{token.symbol}</p>
                                            <p className="text-xs font-bold">
                                                {Number(balance).toFixed(3)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-3 rounded-xl bg-black/40 border border-[#8AE06C]/20">
                                    <p className="text-[10px] text-white/50 uppercase">Debt ({asset.symbol})</p>
                                    <p className="text-lg font-bold text-orange-400">
                                        {formatUnits(userBorrowed, asset.decimals)} {asset.symbol}
                                    </p>
                                </div>
                            </div>

                            {/* ACTION */}
                            <button
                                onClick={handleClaimAndRepay}
                                disabled={
                                    isProcessing ||
                                    tokenBalances.every((t) => t.balanceRaw === 0n) ||
                                    userBorrowed === 0n
                                }
                                className="
                                    w-full py-3 rounded-xl 
                                    bg-purple-600/20 border border-purple-400/30 
                                    text-purple-300 text-xs font-bold
                                    hover:bg-purple-600/30 transition
                                    disabled:opacity-40
                                "
                            >
                                {isProcessing ? 'Processing...' : 'CLAIM & AUTO-REPAY'}
                            </button>

                            <button
                                onClick={() => {
                                    setIsLocked(false);
                                    setIpaId('');
                                    setTokenBalances([]);
                                }}
                                className="w-full py-2 text-white/40 text-xs hover:text-white/70 transition"
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
