import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { useAutoRepay } from '../../hooks/useAutoRepay';
import { useRoyaltySimulator } from '../../hooks/useRoyaltySimulator';

interface AutoRepayCardProps {
    borrowedToken: Address;
    borrowedTokenSymbol: string;
    decimals: number;
}

export function AutoRepayCard({
    borrowedToken,
    borrowedTokenSymbol,
    decimals
}: AutoRepayCardProps) {
    const { address, isConnected } = useAccount();
    const {
        isIPLocked,
        getIPLockInfo,
        lockIP,
        claimRoyalties,
        unlockIP,
        previewConversion
    } = useAutoRepay();
    const { getRoyaltyBalance } = useRoyaltySimulator();

    const [ipId, setIpId] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [royaltyBalance, setRoyaltyBalance] = useState('0');
    const [debt, setDebt] = useState('0');
    const [repaymentPreview, setRepaymentPreview] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Load IP status when IP ID changes
    useEffect(() => {
        async function loadIPStatus() {
            if (!ipId || ipId.length < 10) {
                setIsLocked(false);
                return;
            }

            try {
                const locked = await isIPLocked(ipId);
                setIsLocked(locked);

                if (locked && address) {
                    // Get lock info
                    const info = await getIPLockInfo(ipId);
                    if (info) {
                        setDebt(info.debt.toString());
                    }

                    // Get royalty balance
                    const balance = await getRoyaltyBalance(ipId);
                    setRoyaltyBalance(balance);

                    // Preview conversion
                    if (parseFloat(balance) > 0) {
                        const preview = await previewConversion(balance, borrowedToken);
                        setRepaymentPreview(preview);
                    }
                }
            } catch (err) {
                console.error('Failed to load IP status:', err);
            }
        }

        loadIPStatus();
    }, [ipId, isIPLocked, getIPLockInfo, getRoyaltyBalance, previewConversion, borrowedToken, address]);

    // Handle lock IP
    const handleLockIP = async () => {
        if (!ipId) {
            setError('Please enter an IP ID');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('[AutoRepay] Step 1: Locking IP:', ipId);

            const result = await lockIP(ipId, borrowedToken);

            if (result.success) {
                console.log('[AutoRepay] Step 2: Transaction successful, hash:', result.hash);

                // CRITICAL: Wait a moment for state to propagate
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log('[AutoRepay] Step 3: Refetching contract state...');

                // Refetch ALL data from contract
                const locked = await isIPLocked(ipId);
                console.log('[AutoRepay] Step 4: Is locked on-chain:', locked);

                if (locked) {
                    // Update local state
                    setIsLocked(true);

                    // Get lock info
                    const info = await getIPLockInfo(ipId);
                    if (info) {
                        setDebt(info.debt.toString());
                        console.log('[AutoRepay] Step 5: Debt loaded:', info.debt.toString());
                    }

                    // Get royalty balance
                    const balance = await getRoyaltyBalance(ipId);
                    setRoyaltyBalance(balance);
                    console.log('[AutoRepay] Step 6: Royalty balance:', balance);

                    // Preview conversion if balance > 0
                    if (parseFloat(balance) > 0) {
                        const preview = await previewConversion(balance, borrowedToken);
                        setRepaymentPreview(preview);
                        console.log('[AutoRepay] Step 7: Repayment preview:', preview);
                    }

                    console.log('[AutoRepay] Step 8: UI state updated successfully!');
                } else {
                    setError('Transaction succeeded but IP not locked on-chain. Please refresh.');
                }
            } else {
                setError(result.error || 'Failed to lock IP');
            }
        } catch (err: any) {
            console.error('[AutoRepay] Lock failed:', err);
            setError(err?.message || 'Failed to lock IP');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle claim royalties
    const handleClaimRoyalties = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await claimRoyalties(ipId);

            if (result.success) {
                // Reload balances
                const balance = await getRoyaltyBalance(ipId);
                setRoyaltyBalance(balance);

                const info = await getIPLockInfo(ipId);
                if (info) {
                    setDebt(info.debt.toString());
                }
            } else {
                setError(result.error || 'Failed to claim royalties');
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to claim royalties');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle unlock IP
    const handleUnlockIP = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await unlockIP(ipId);

            if (result.success) {
                setIsLocked(false);
                setIpId('');
                setRoyaltyBalance('0');
                setDebt('0');
            } else {
                setError(result.error || 'Failed to unlock IP');
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to unlock IP');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) return null;

    // State 1: Initial (IP not locked)
    if (!isLocked) {
        return (
            <div className="
                bg-black/40 
                border border-white/10 
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                font-mono
                shadow-[0_0_20px_rgba(138,224,108,0.12)]
            ">
                <h3 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-2">
                    Auto-Repay Engine
                </h3>
                <p className="text-xs text-white/40 mb-4">
                    Lock your IP to automatically repay {borrowedTokenSymbol} debt with royalties
                </p>

                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Enter IP ID (0x...)"
                        value={ipId}
                        onChange={(e) => setIpId(e.target.value)}
                        disabled={isLoading}
                        className="
                            w-full px-4 py-3 
                            bg-black/60 
                            border border-white/15 
                            rounded-lg 
                            text-white
                            placeholder-white/30
                            focus:border-[#8AE06C] 
                            focus:ring-0
                            font-mono
                            text-sm
                        "
                    />

                    {error && (
                        <p className="text-xs text-red-400">{error}</p>
                    )}

                    <button
                        onClick={handleLockIP}
                        disabled={isLoading || !ipId}
                        className="
                            w-full px-4 py-3 
                            bg-[#8AE06C]/20 
                            text-[#8AE06C]
                            font-mono
                            rounded-lg 
                            border border-[#8AE06C]/40
                            hover:bg-[#8AE06C]/30 
                            transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed
                        "
                    >
                        {isLoading ? 'Processing...' : 'Lock IP for Auto-Repay'}
                    </button>
                </div>
            </div>
        );
    }

    const hasRoyalties = parseFloat(royaltyBalance) > 0;
    const hasDebt = parseFloat(debt) > 0;
    const debtFullyRepaid = !hasDebt;

    // State 4: Debt Fully Repaid
    if (debtFullyRepaid) {
        return (
            <div className="
                bg-black/40 
                border border-[#8AE06C]/30
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                font-mono
                shadow-[0_0_20px_rgba(138,224,108,0.25)]
            ">
                <h3 className="text-sm text-[#8AE06C] tracking-[0.25em] uppercase mb-2">
                    🎉 Debt Fully Repaid!
                </h3>
                <p className="text-xs text-white/60 mb-4">
                    IP ID: {ipId.slice(0, 10)}...{ipId.slice(-8)}
                </p>

                <div className="space-y-3 mb-4">
                    <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-white/50 mb-1">Remaining Debt</p>
                        <p className="text-lg text-white font-bold">0 {borrowedTokenSymbol}</p>
                    </div>

                    <div className="bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg p-3">
                        <p className="text-xs text-[#8AE06C]">
                            ✅ Auto-repay stopped<br />
                            💰 Royalties now accumulate on your IP
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleUnlockIP}
                    disabled={isLoading}
                    className="
                        w-full px-4 py-3 
                        bg-white/10 
                        text-white
                        font-mono
                        rounded-lg 
                        border border-white/20
                        hover:bg-white/20 
                        transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                    "
                >
                    {isLoading ? 'Processing...' : 'Unlock IP'}
                </button>
            </div>
        );
    }

    // State 2: Royalties Available (Claim button)
    if (hasRoyalties) {
        return (
            <div className="
                bg-black/40 
                border border-white/10 
                rounded-2xl 
                p-6 
                backdrop-blur-xl
                font-mono
                shadow-[0_0_20px_rgba(138,224,108,0.12)]
            ">
                <h3 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-2">
                    ✅ IP Locked for Auto-Repay
                </h3>
                <p className="text-xs text-white/40 mb-4">
                    IP ID: {ipId.slice(0, 10)}...{ipId.slice(-8)}
                </p>

                <div className="space-y-3 mb-4">
                    <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-white/50 mb-1">Available Royalties</p>
                        <p className="text-lg text-white font-bold">{parseFloat(royaltyBalance).toFixed(2)} MOC</p>
                        <p className="text-xs text-white/40">≈ ${parseFloat(royaltyBalance).toFixed(2)} USD</p>
                    </div>

                    <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-white/50 mb-1">Your Debt</p>
                        <p className="text-lg text-white font-bold">
                            {formatUnits(BigInt(debt || '0'), decimals)} {borrowedTokenSymbol}
                        </p>
                    </div>

                    <div className="bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg p-3">
                        <p className="text-xs text-white/50 mb-1">Repayment Amount</p>
                        <p className="text-sm text-[#8AE06C] font-bold">
                            ~{parseFloat(repaymentPreview).toFixed(4)} {borrowedTokenSymbol}
                        </p>
                    </div>
                </div>

                {error && (
                    <p className="text-xs text-red-400 mb-3">{error}</p>
                )}

                <button
                    onClick={handleClaimRoyalties}
                    disabled={isLoading}
                    className="
                        w-full px-4 py-3 
                        bg-[#8AE06C]/20 
                        text-[#8AE06C]
                        font-mono
                        rounded-lg 
                        border border-[#8AE06C]/40
                        hover:bg-[#8AE06C]/30 
                        transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                    "
                >
                    {isLoading ? 'Processing...' : 'Claim & Repay Now'}
                </button>
            </div>
        );
    }

    // State 3: Active Auto-Repay (no royalties, but has debt)
    return (
        <div className="
            bg-black/40 
            border border-white/10 
            rounded-2xl 
            p-6 
            backdrop-blur-xl
            font-mono
            shadow-[0_0_20px_rgba(138,224,108,0.12)]
        ">
            <h3 className="text-sm text-white/60 tracking-[0.25em] uppercase mb-2">
                ⚡ Auto-Repay Active
            </h3>
            <p className="text-xs text-white/40 mb-4">
                IP ID: {ipId.slice(0, 10)}...{ipId.slice(-8)}
            </p>

            <div className="space-y-3 mb-4">
                <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                    <p className="text-xs text-white/50 mb-1">Current Balance</p>
                    <p className="text-lg text-white font-bold">0 MOC</p>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                    <p className="text-xs text-white/50 mb-1">Your Debt</p>
                    <p className="text-lg text-white font-bold">
                        {formatUnits(BigInt(debt || '0'), decimals)} {borrowedTokenSymbol}
                    </p>
                </div>

                <div className="bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg p-3">
                    <p className="text-xs text-[#8AE06C]">
                        ℹ️ Future royalties will automatically repay debt
                    </p>
                </div>
            </div>
        </div>
    );
};
