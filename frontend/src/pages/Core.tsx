import React from 'react';
import { useAccount } from 'wagmi';
import { AssetCard } from '../components/AssetCard';
import { UserPositions } from '../components/UserPositions';
import { getSupplyAssets, getBorrowAssets } from '../config/assets';

export const Core: React.FC = () => {
  const { isConnected } = useAccount();

  const supplyAssets = getSupplyAssets();
  const borrowAssets = getBorrowAssets();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold font-mono">CORE INSTANCE</h1>
          <p className="text-gray-600 mt-2">Multi-Asset Lending & Borrowing Protocol</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* User Positions - Your Supplies & Your Borrows */}
        <UserPositions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold font-mono">ASSETS TO SUPPLY</h2>
              <p className="text-sm text-gray-600 mt-1">
                Supply assets to earn interest and use as collateral
              </p>
            </div>

            <div className="space-y-4">
              {supplyAssets.map(asset => (
                <AssetCard key={asset.symbol} symbol={asset.symbol} type="supply" />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold font-mono">ASSETS TO BORROW</h2>
              <p className="text-sm text-gray-600 mt-1">
                Borrow assets against your collateral
              </p>
            </div>

            <div className="space-y-4">
              {borrowAssets.map(asset => (
                <AssetCard key={asset.symbol} symbol={asset.symbol} type="borrow" />
              ))}
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="card bg-yellow-50 border-yellow-300">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-bold text-gray-900">Connect Your Wallet</div>
                <div className="text-sm text-gray-600">
                  Connect your wallet to start supplying and borrowing assets
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
