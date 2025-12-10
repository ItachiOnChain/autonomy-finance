import React from "react";
import { useAccount } from "wagmi";
import { AssetCard } from "../components/AssetCard";
import { UserPositions } from "../components/UserPositions";
import { getSupplyAssets, getBorrowAssets } from "../config/assets";

export const Core: React.FC = () => {
  const { isConnected } = useAccount();

  const supplyAssets = getSupplyAssets();
  
  const borrowAssets = getBorrowAssets();

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col"
      style={{
        backgroundColor: "#02060b",
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    >
      {/* ================= HEADER ================= */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl">
  <div className="max-w-7xl mx-auto px-6 py-10 flex justify-center">
    <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-[0.28em] uppercase text-center text-[#8AE06C]">
      CORE INSTANCE
    </h1>
  </div>
</div>


      {/* ================= BODY ================= */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 flex-1">

        {/* USER POSITIONS (ONLY IF WALLET CONNECTED) */}
        {isConnected && (
          <div
            className="
              bg-black/40 border border-[#8AE06C]/25 
              rounded-2xl p-8 backdrop-blur-xl
              shadow-[0_0_35px_rgba(138,224,108,0.18)]
            "
          >
            <UserPositions />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ================= SUPPLY SECTION ================= */}
          <div>
            <h2 className="text-sm md:text-base font-mono tracking-[0.25em] uppercase text-[#8AE06C] mb-8">
              ASSETS TO SUPPLY
            </h2>

            <div className="space-y-6">
              {supplyAssets.map((asset) => (
                <AssetCard
                  key={asset.symbol}
                  symbol={asset.symbol}
                  type="supply"
                />
              ))}
            </div>
          </div>

          {/* ================= BORROW SECTION ================= */}
          <div>
            <h2 className="text-sm md:text-base font-mono tracking-[0.25em] uppercase text-[#8AE06C] mb-8">
              ASSETS TO BORROW
            </h2>

            <div className="space-y-6">
              {borrowAssets.map((asset) => (
                <AssetCard
                  key={asset.symbol}
                  symbol={asset.symbol}
                  type="borrow"
                />
              ))}
            </div>
          </div>
        </div>

        {/* ================= WALLET WARNING ================= */}
        {!isConnected && (
          <div
            className="
              bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-xl
              p-6 font-mono tracking-wide 
              shadow-[0_0_20px_rgba(138,224,108,0.25)]
            "
          >
            <div className="flex items-center gap-3">
              <div className="text-xl text-[#8AE06C]">⚠</div>
              <div>
                <div className="font-bold uppercase text-[#8AE06C]">
                  Wallet Not Connected
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Connect your wallet to supply or borrow assets.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= COMPACT DASHBOARD FOOTER ================= */}
    </div>
  );
};
