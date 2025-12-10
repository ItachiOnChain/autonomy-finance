import React from "react";
import { TokenLogo } from "./TokenLogo";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { ASSETS } from "../config/assets";
import { useAssetData, useUserPosition } from "../hooks/useLendingPool";
import { getContracts, MARKET_CHAIN_ID } from "../config/contracts";

interface AssetCardProps {
  symbol: string;
  type: "supply" | "borrow";
}

export const AssetCard: React.FC<AssetCardProps> = ({ symbol, type }) => {
  const asset = ASSETS.find((a) => a.symbol === symbol);

  // Use MARKET_CHAIN_ID (Story Aeneid) for asset addresses, not wallet chain
  const contracts = getContracts(MARKET_CHAIN_ID);

  if (!asset) return null;

  // Safe chain-aware contract access using MARKET_CHAIN_ID
  const assetAddress = (contracts as any)?.[asset.symbol]?.address as string;
  if (!assetAddress) {
    console.error(`[AssetCard] ${asset.symbol} not found for MARKET_CHAIN_ID ${MARKET_CHAIN_ID}`);
    return null;
  }

  const { availableLiquidity, supplyAPR, borrowAPR } = useAssetData(assetAddress);
  useUserPosition(assetAddress);

  const displayAPR = type === "supply" ? supplyAPR : borrowAPR;

  return (
    <Link
      to={`/asset/${symbol}`}
      className="
        block 
        rounded-2xl 
        p-5 
        bg-black/40
        backdrop-blur-xl
        border border-white/10
        shadow-[0_0_20px_rgba(138,224,108,0.08)]
        
        hover:border-[#8AE06C]/60
        hover:shadow-[0_0_35px_rgba(138,224,108,0.25)]
        hover:bg-black/60
        transition-all duration-300
      "
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Asset Icon + Name */}
        <div className="flex items-center gap-3">
          <TokenLogo symbol={asset.symbol} size={40} />

          <div>
            <div className="font-mono text-white text-base tracking-wide">
              {asset.symbol}
            </div>
            <div className="text-[11px] text-white/50">{asset.name}</div>
          </div>
        </div>

        {/* APY/APR */}
        <div className="text-right">
          <div className="text-[10px] font-mono text-white/50 tracking-wide mb-1">
            {type === "supply" ? "APY" : "APR"}
          </div>
          <div
            className="text-xl font-mono font-bold drop-shadow-[0_0_8px_rgba(138,224,108,0.5)]"
            style={{ color: asset.color }}
          >
            {displayAPR !== undefined && displayAPR !== null
              ? `${displayAPR.toFixed(2)}%`
              : '–'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-3"></div>

      {/* Grid Info - NOTE: Keep Supply and Borrow card layouts in sync */}
      <div className="grid grid-cols-2 gap-4 items-center">
        {/* AVAILABLE */}
        <div>
          <p className="text-[10px] text-white/50 font-mono tracking-wide mb-1">
            Available
          </p>
          <p className="text-sm font-mono text-white">
            {formatUnits(availableLiquidity, asset.decimals)} {asset.symbol}
          </p>
        </div>

        {/* RIGHT COLUMN - Different content for supply vs borrow, but same height */}
        {type === "supply" ? (
          // SUPPLY: MAX LTV + COLLATERAL BADGE
          asset.canBeCollateral ? (
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-white/50 font-mono tracking-wide mb-1">
                Max LTV
              </p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-mono text-white">{asset.maxLTV}%</p>

                <span
                  className="
                    inline-block 
                    px-2 py-1 
                    text-[10px] 
                    font-mono 
                    rounded-md
                    bg-[#8AE06C]/15 
                    text-[#8AE06C]
                    border border-[#8AE06C]/40
                    tracking-wide
                  "
                >
                  ✓ Can Be Collateral
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-white/50 font-mono tracking-wide mb-1">
                Max LTV
              </p>
              <p className="text-sm font-mono text-white">{asset.maxLTV}%</p>
            </div>
          )
        ) : (
          // BORROW: Simple spacer for perfect alignment (no extra info needed)
          <div className="flex flex-col items-end">
            <p className="text-[10px] text-white/50 font-mono tracking-wide mb-1 opacity-0" aria-hidden="true">
              Spacer
            </p>
            <p className="text-sm font-mono text-white opacity-0" aria-hidden="true">—</p>
          </div>
        )}
      </div>

    </Link>
  );
};
