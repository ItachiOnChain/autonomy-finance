import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient
} from 'wagmi';
import { parseUnits } from 'viem';
import { getAssetBySymbol } from '../config/assets';
import {
  useAssetData,
  useUserPosition,
  useLendingPool,
  useHealthFactor,
  useTokenBalance,
  useAllowance,
  useApprove
} from '../hooks/useLendingPool';
import { getContracts, MARKET_CHAIN_ID } from '../config/contracts';

// Components
import { AssetHeader } from '../components/asset/AssetHeader';
import { ReserveOverview } from '../components/asset/ReserveOverview';
import { InterestRates } from '../components/asset/InterestRates';
import { AssetInfo } from '../components/asset/AssetInfo';
import { UserPosition } from '../components/asset/UserPosition';
import { MintBox } from '../components/asset/MintBox';



import { AssetActions } from '../components/asset/AssetActions';
import { AutoRepayCard } from '../components/AutoRepay/AutoRepayCard';
// Removed: import { AutoRepayPanel } from '../components/asset/AutoRepayPanel';

// ================================
// CLEAN GLASS PANEL WRAPPER
// ================================
const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="
    rounded-2xl
    bg-black/30
    backdrop-blur-xl
    shadow-[0_0_24px_rgba(138,224,108,0.05)]
    p-0
  ">
    {children}
  </div>
);

export const Asset: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const asset = getAssetBySymbol(symbol || '');

  // State management
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Asset not found
  if (!asset) {
    return (
      <div className="min-h-screen w-full text-white bg-black">
        <div className="max-w-2xl mx-auto p-8 mt-24 text-center">
          <div className="bg-black/40 rounded-2xl p-8 border border-[#8AE06C]/20 backdrop-blur-xl">
            <h1 className="text-2xl font-mono font-bold mb-4">Asset Not Found</h1>
            <p className="text-white/60 mb-6">We couldn't find that asset.</p>
            <button
              onClick={() => navigate('/core')}
              className="px-4 py-2 rounded-md bg-[#8AE06C] text-black font-medium"
            >
              ← Back to Core
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contract address from MARKET chain
  const contracts = getContracts(MARKET_CHAIN_ID);
  const assetAddress = (contracts as any)?.[asset.symbol]?.address as string;

  // Custom hooks
  const {
    totalSupplied,
    totalBorrowed,
    availableLiquidity,
    utilizationRate,
    supplyAPR,
    borrowAPR,
    refetch: refetchAssetData
  } = useAssetData(assetAddress);

  const { supplied, borrowed, refetch: refetchPosition } = useUserPosition(assetAddress);
  const { balance, refetch: refetchBalance } = useTokenBalance(assetAddress);
  const { allowance, refetch: refetchAllowance } = useAllowance(assetAddress);
  const { supply, withdraw, borrow, repay, isPending } = useLendingPool();
  const { approve } = useApprove(assetAddress);
  const { healthFactor, refetch: refetchHealthFactor } = useHealthFactor();

  const publicClient = usePublicClient();

  // Effects
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      Promise.all([
        refetchBalance(),
        refetchPosition(),
        refetchAllowance(),
        refetchAssetData(),
        refetchHealthFactor(),
      ]);
      setSupplyAmount('');
      setWithdrawAmount('');
      setBorrowAmount('');
      setRepayAmount('');
      setSuccess('Transaction confirmed');
      setPendingTxHash(undefined);
    }
  }, [isConfirmed]);

  // Transaction handlers
  const handleTransaction = async (
    action: string,
    fn: () => Promise<`0x${string}` | undefined>,
    amount: string
  ) => {
    try {
      const hash = await fn();
      if (hash) {
        setPendingTxHash(hash);
        setSuccess(`⏳ ${action} ${amount} ${asset.symbol}... waiting`);
      }
    } catch (err: any) {
      setError(`Error: ${err.shortMessage || err.message}`);
    }
  };



  const handleApprove = async (amt: string) => {
    const amountWei = parseUnits(amt, asset.decimals);
    return handleTransaction('Approve', () => approve(amountWei), amt);
  };

  const handleSupply = async (amount: string) => {
    const amountWei = parseUnits(amount, asset.decimals);

    if (balance < amountWei) {
      setError(`Insufficient balance`);
      return;
    }

    // Approval if needed
    if (allowance < amountWei) {
      const approveHash = await approve(amountWei);
      if (approveHash) {
        await publicClient?.waitForTransactionReceipt({ hash: approveHash });
        await refetchAllowance();
      }
    }

    handleTransaction('Supply', () => supply(assetAddress, amountWei), amount);
  };

  const handleWithdraw = (amount: string) => {
    const amountWei = parseUnits(amount, asset.decimals);
    return handleTransaction('Withdraw', () => withdraw(assetAddress, amountWei), amount);
  };

  const handleBorrow = (amount: string) => {
    const amountWei = parseUnits(amount, asset.decimals);
    return handleTransaction('Borrow', () => borrow(assetAddress, amountWei), amount);
  };

  const handleRepay = (amount: string) => {
    const amountWei = parseUnits(amount, asset.decimals);
    return handleTransaction('Repay', () => repay(assetAddress, amountWei), amount);
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchBalance(),
      refetchPosition(),
      refetchAllowance(),
      refetchAssetData(),
      refetchHealthFactor()
    ]);
  };

  const isProcessing = isPending || isConfirming;

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{
        backgroundColor: "#02060b",
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <Panel>
          <div className="p-4">
            <AssetHeader asset={asset} onRefresh={handleRefresh} />
          </div>
        </Panel>

        {/* Notifications */}
        <div className="space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 font-mono text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300 font-mono text-sm">
              {success} {isConfirming && '⏳'}
            </div>
          )}
        </div>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS - Info & Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reserve Overview - Full Width */}
            <Panel>
              <div className="p-6">
                <ReserveOverview
                  asset={asset}
                  data={{ totalSupplied, totalBorrowed, availableLiquidity, utilizationRate }}
                />
              </div>
            </Panel>

            {/* Interest Rates + Asset Info - Side by Side (TOP ROW) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel>
                <div className="p-6">
                  <InterestRates asset={asset} rates={{ supplyAPR, borrowAPR }} />
                </div>
              </Panel>

              <Panel>
                <div className="p-6">
                  <AssetInfo asset={asset} />
                </div>
              </Panel>
            </div>

            {/* Supply + AutoRepay - Side by Side (BOTTOM ROW) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel>
                <div className="p-6">
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
                </div>
              </Panel>

              <Panel>
                <div className="p-6">
                  <AutoRepayCard
                    borrowedToken={assetAddress as `0x${string}`}
                    borrowedTokenSymbol={asset.symbol}
                    decimals={asset.decimals}
                  />
                </div>
              </Panel>
            </div>
          </div>

          {/* RIGHT 1 COL - Position & Mint */}
          <div className="space-y-8">
            <Panel>
              <div className="p-6">
                <UserPosition
                  asset={asset}
                  position={{ balance, supplied, borrowed, healthFactor }}
                  isConnected={isConnected}
                />
              </div>
            </Panel>

            <Panel>
              <div className="p-6">
                <MintBox asset={asset} assetAddress={assetAddress} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};
