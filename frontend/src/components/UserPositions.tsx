import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { ASSETS } from "../config/assets";
import { useUserPosition } from "../hooks/useLendingPool";
import { CONTRACTS } from "../config/contracts";
import { EModeToggle } from "./EModeToggle";

/* ROW COMPONENT */
const UserPositionRow = ({ symbol, type }: any) => {
  const navigate = useNavigate();
  const asset = ASSETS.find((a) => a.symbol === symbol);
  const assetAddress = asset ? (CONTRACTS as any)[asset.symbol]?.address : undefined;

  const { supplied, borrowed } = useUserPosition(assetAddress || "");

  const amount = type === "supply" ? supplied : borrowed;
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

  const positions = ASSETS.map((asset) => {
    const assetAddress = (CONTRACTS as any)[asset.symbol]?.address;
    const pos = useUserPosition(assetAddress || "");
    return { symbol: asset.symbol, assetAddress, ...pos };
  });

  const hasSupplies = positions.some((p) => p.supplied > 0n);
  const hasBorrows = positions.some((p) => p.borrowed > 0n);

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
          <EModeToggle />
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
