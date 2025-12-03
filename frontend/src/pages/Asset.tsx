import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getAssetBySymbol } from '../config/assets';
import {
    useAssetData,
    useUserPosition,
    useLendingPool,
    useUserHealthFactor,
    useTokenBalance,
    useTokenAllowance
} from '../hooks/useLendingPool';
import { CONTRACTS } from '../config/contracts';

// Components
import { AssetHeader } from '../components/asset/AssetHeader';
import { ReserveOverview } from '../components/asset/ReserveOverview';
import { InterestRates } from '../components/asset/InterestRates';
import { AssetInfo } from '../components/asset/AssetInfo';
import { UserPosition } from '../components/asset/UserPosition';
import { MintPanel } from '../components/asset/MintPanel';
import { AssetActions } from '../components/asset/AssetActions';
import { AutoRepayPanel } from '../components/asset/AutoRepayPanel';

export const Asset: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const { isConnected } = useAccount();
    const asset = getAssetBySymbol(symbol || '');

    const [supplyAmount, setSupplyAmount] = useState('');
    const [borrowAmount, setBorrowAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [repayAmount, setRepayAmount] = useState('');
    const [mintAmount, setMintAmount] = useState('1000');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

    // Wait for transaction confirmation
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: pendingTxHash,
    });

    if (!asset) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h1>
                    <button onClick={() => navigate('/core')} className="text-blue-600 hover:underline">
                        ← Back to Core
                    </button>
                </div>
            </div>
        );
    }

    // Safe access to contract address
    // @ts-ignore
    const assetAddress = (CONTRACTS as any)[asset.symbol]?.address as string;

    const { totalSupplied, totalBorrowed, availableLiquidity, utilizationRate, supplyAPR, borrowAPR, refetch: refetchAssetData } = useAssetData(assetAddress);
    const { supplied, borrowed, refetch: refetchPosition } = useUserPosition(assetAddress);
    const { balance, refetch: refetchBalance } = useTokenBalance(assetAddress);
    const { allowance, refetch: refetchAllowance } = useTokenAllowance(assetAddress);
    const { supply, withdraw, borrow, repay, approve, mint, isPending } = useLendingPool();
    const { healthFactor, refetch: refetchHealthFactor } = useUserHealthFactor();

    // Auto-clear messages
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Refetch data when transaction is confirmed
    useEffect(() => {
        if (isConfirmed && pendingTxHash) {
            // Refetch all data to ensure UI updates
            Promise.all([
                refetchBalance(),
                refetchPosition(),
                refetchAllowance(),
                refetchAssetData(),
                refetchHealthFactor(),
            ]).catch(err => console.error('Error refetching data:', err));

            // Clear input fields after successful transaction
            setSupplyAmount('');
            setWithdrawAmount('');
            setBorrowAmount('');
            setRepayAmount('');
            setSuccess('✅ Transaction confirmed!');
            setPendingTxHash(undefined);
        }
    }, [isConfirmed, pendingTxHash, refetchBalance, refetchPosition, refetchAllowance, refetchAssetData, refetchHealthFactor]);

    const handleTransaction = async (
        actionName: string,
        actionFn: () => Promise<`0x${string}` | undefined>,
        amount: string
    ) => {
        if (!amount || parseFloat(amount) <= 0) return;
        setError('');
        setSuccess('');
        try {
            const hash = await actionFn();
            if (hash) {
                setPendingTxHash(hash);
                setSuccess(`⏳ ${actionName} ${amount} ${asset.symbol}... waiting for confirmation`);
                // Don't clear input here - wait for confirmation
            }
        } catch (err: any) {
            console.error(`${actionName} error:`, err);
            setError(`❌ ${actionName} failed: ${err.shortMessage || err.message || 'Unknown error'}`);
        }
    };

    const handleMint = () => handleTransaction('Minting', () => mint(assetAddress, mintAmount, asset.decimals), mintAmount);

    const handleApprove = (amount: string) => handleTransaction('Approving', () => approve(assetAddress, amount, asset.decimals), amount);

    const publicClient = usePublicClient();

    const handleSupply = async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) return;
        const amountWei = parseUnits(amount, asset.decimals);

        if (balance < amountWei) {
            setError(`❌ Insufficient balance. You have ${formatUnits(balance, asset.decimals)} ${asset.symbol}`);
            return;
        }

        setError('');
        setSuccess('');

        try {
            // Step 1: Approve if needed
            if (allowance < amountWei) {
                const approveHash = await approve(assetAddress, amount, asset.decimals);
                if (approveHash) {
                    setPendingTxHash(approveHash);
                    setSuccess(`⏳ Approving ${amount} ${asset.symbol}...`);

                    if (!publicClient) throw new Error('Public client not available');
                    await publicClient.waitForTransactionReceipt({ hash: approveHash });

                    setSuccess(`✅ Approved! Now supplying...`);
                    // Small delay to ensure node indexing
                    await new Promise(r => setTimeout(r, 1000));
                    await refetchAllowance();
                }
            }

            // Step 2: Supply
            const supplyHash = await supply(assetAddress, amount, asset.decimals);
            if (supplyHash) {
                setPendingTxHash(supplyHash);
                setSuccess(`⏳ Supplying ${amount} ${asset.symbol}... waiting for confirmation`);
            }
        } catch (err: any) {
            console.error('Supply error:', err);
            setError(`❌ Supply failed: ${err.shortMessage || err.message || 'Unknown error'}`);
            setPendingTxHash(undefined);
        }
    };

    const handleWithdraw = (amount: string) => handleTransaction('Withdrawing', () => withdraw(assetAddress, amount, asset.decimals), amount);

    const handleBorrow = (amount: string) => handleTransaction('Borrowing', () => borrow(assetAddress, amount, asset.decimals), amount);

    const handleRepay = (amount: string) => handleTransaction('Repaying', () => repay(assetAddress, amount, asset.decimals), amount);

    const isProcessing = isPending || isConfirming;

    const handleRefresh = async () => {
        await Promise.all([
            refetchBalance(),
            refetchPosition(),
            refetchAllowance(),
            refetchAssetData(),
            refetchHealthFactor(),
        ]);
    };

    return (
        <div className="min-h-screen bg-white">
            <AssetHeader asset={asset} onRefresh={handleRefresh} />

            {/* Error/Success Messages */}
            {(error || success) && (
                <div className="max-w-7xl mx-auto px-4 pt-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center gap-2">
                            {isConfirming && <span className="animate-spin">⏳</span>}
                            {success}
                            {isConfirmed && ' ✅ Confirmed!'}
                        </div>
                    )}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Reserve Status */}
                    <div className="lg:col-span-2 space-y-6">
                        <ReserveOverview
                            asset={asset}
                            data={{ totalSupplied, totalBorrowed, availableLiquidity, utilizationRate }}
                        />
                        <InterestRates
                            asset={asset}
                            rates={{ supplyAPR, borrowAPR }}
                        />
                        <AssetInfo asset={asset} />
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        <UserPosition
                            asset={asset}
                            position={{ balance, supplied, borrowed, healthFactor }}
                            isConnected={isConnected}
                        />

                        <MintPanel
                            asset={asset}
                            mintAmount={mintAmount}
                            setMintAmount={setMintAmount}
                            onMint={handleMint}
                            isProcessing={isProcessing}
                            isConnected={isConnected}
                        />

                        <AssetActions
                            asset={asset}
                            isConnected={isConnected}
                            isProcessing={isProcessing}
                            userPosition={{ supplied, borrowed }}
                            allowance={allowance}
                            actions={{
                                onSupply: handleSupply,
                                onWithdraw: handleWithdraw,
                                onBorrow: handleBorrow,
                                onRepay: handleRepay,
                                onApprove: handleApprove
                            }}
                            amounts={{
                                supply: supplyAmount,
                                withdraw: withdrawAmount,
                                borrow: borrowAmount,
                                repay: repayAmount
                            }}
                            setAmounts={{
                                setSupply: setSupplyAmount,
                                setWithdraw: setWithdrawAmount,
                                setBorrow: setBorrowAmount,
                                setRepay: setRepayAmount
                            }}
                        />

                        <AutoRepayPanel
                            asset={asset}
                            assetAddress={assetAddress}
                            userBorrowed={borrowed}
                            onRepayComplete={handleRefresh}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

