import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { ASSETS } from "../config/assets";
import { useUserPosition, useHealthFactor } from "../hooks/useLendingPool";
import { getContracts, MARKET_CHAIN_ID } from "../config/contracts";
import { EModeToggle } from "./EModeToggle";

/* ROW COMPONENT */
const UserPositionRow = ({ symbol, type }: any) => {
  const navigate = useNavigate();
  const contracts = getContracts(MARKET_CHAIN_ID);
  const asset = ASSETS.find((a) => a.symbol === symbol);
  const assetAddress = asset ? (contracts as any)?.[asset.symbol]?.address : undefined;

  const { supplied, borrowed } = useUserPosition(assetAddress || "");

  const amount = type === "supply" ? supplied : borrowed;
  // If amount is 0, don't show the row (unless we want to show 0 balances, but prompted said "Nothing supplied yet")
  if (!asset || !assetAddress || amount === 0n) return null;

  return (
    <div
      onClick={() => navigate(`/asset/${symbol}`)}
      className="
        flex items-center justify-between 
        px-4 py-2.5 
        rounded-lg border border-[#8AE06C]/15
        bg-black/30 hover:bg-black/40
        transition-all cursor-pointer
        shadow-[0_0_12px_rgba(138,224,108,0.15)]
      "
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3">
        <div className="text-2xl">{asset.logo}</div>
        <div>
          <div className="text-white text-sm font-mono">{asset.symbol}</div>
          <div className="text-[10px] text-white/40 font-mono">{asset.name}</div>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right font-mono">
        <div className="text-white text-sm">{formatUnits(amount, asset.decimals)}</div>
        <div className="text-[10px] text-white/40">{asset.symbol}</div>
      </div>
    </div>
  );
};

/* MAIN COMPONENT */
export const UserPositions = () => {
  const { isConnected } = useAccount();
  if (!isConnected) return null;

  const contracts = getContracts(MARKET_CHAIN_ID);

  const positions = ASSETS.map((asset) => {
    const assetAddress = (contracts as any)?.[asset.symbol]?.address;
    const pos = useUserPosition(assetAddress || "");
    return { symbol: asset.symbol, assetAddress, ...pos };
  });

  const hasSupplies = positions.some((p) => p.supplied > 0n);
  const hasBorrows = positions.some((p) => p.borrowed > 0n);

  const { healthFactor } = useHealthFactor();

  // Format Health Factor
  // If > 100 or 0 with no debt, usually show infinity symbol or Max
  // If user has NO debt, HF is technically infinity. Contract returns type(uint256).max.
  // Our hook divides by 10000. So max uint256 / 10000 is still huge.
  // Let's settle on: if HF > 100 -> "∞"
  const formattedHF = healthFactor > 100 ? "∞" : healthFactor.toFixed(2);
  const hfColor = healthFactor > 2 ? "text-green-400" : healthFactor > 1.1 ? "text-orange-400" : "text-red-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* SUPPLY PANEL */}
      <div
        className="
          bg-black/40 backdrop-blur-xl
          border border-[#8AE06C]/20 rounded-xl
          p-5 shadow-[0_0_24px_rgba(138,224,108,0.18)]
        "
      >
        <h2 className="text-base font-mono tracking-wide text-white mb-3">
          Your Supplies
        </h2>

        {hasSupplies ? (
          <div className="space-y-2">
            {ASSETS.map((a) => (
              <UserPositionRow key={`sup-${a.symbol}`} symbol={a.symbol} type="supply" />
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm font-mono">Nothing supplied yet</p>
        )}
      </div>

      {/* BORROW PANEL */}
      <div
        className="
          bg-black/40 backdrop-blur-xl
          border border-[#8AE06C]/20 rounded-xl
          p-5 shadow-[0_0_24px_rgba(138,224,108,0.18)]
        "
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-mono tracking-wide text-white">
            Your Borrows
          </h2>
          <div className="flex items-center gap-4">
            {hasBorrows && (
              <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-xs text-white/60 font-mono uppercase tracking-wider">Health Factor</span>
                <span className={`text-sm font-bold font-mono ${formattedHF === "∞" ? "text-green-400" : hfColor}`}>
                  {formattedHF}
                </span>
              </div>
            )}
            <EModeToggle />
          </div>
        </div>

        {hasBorrows ? (
          <div className="space-y-2">
            {ASSETS.map((a) => (
              <UserPositionRow key={`bor-${a.symbol}`} symbol={a.symbol} type="borrow" />
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm font-mono">Nothing borrowed yet</p>
        )}
      </div>

    </div>
  );
};
