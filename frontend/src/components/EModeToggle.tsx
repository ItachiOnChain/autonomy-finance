import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useUserEMode, useSetUserEMode } from "../hooks/useEMode";
import { EMODE_CATEGORIES, EMODE_CATEGORY_LABELS, ASSETS } from "../config/assets";
import { CONTRACTS } from "../config/contracts";
import { useUserPosition } from "../hooks/useLendingPool";

export const EModeToggle: React.FC = () => {
  const { address } = useAccount();
  const { eModeCategory, isEModeEnabled } = useUserEMode(address);
  const { setUserEMode, isPending } = useSetUserEMode();
  const [error, setError] = useState("");

  // Call all hooks at component level (not in loops!)
  const assetPositions = ASSETS.map(asset => {
    const assetAddress = (CONTRACTS as any)[asset.symbol]?.address;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const position = assetAddress ? useUserPosition(assetAddress) : { supplied: 0n };
    return { asset, supplied: position.supplied };
  });

  // -------- DETECT USER COLLATERAL CORRECTLY ----------
  const detectUserCategory = () => {
    if (!address) return null;

    let hasStable = false;
    let hasETH = false;

    for (const { asset, supplied } of assetPositions) {
      if (supplied > 0n) {
        if (asset.category === EMODE_CATEGORIES.STABLECOINS) hasStable = true;
        if (asset.category === EMODE_CATEGORIES.ETH) hasETH = true;
      }
    }

    if (hasStable) return EMODE_CATEGORIES.STABLECOINS;
    if (hasETH) return EMODE_CATEGORIES.ETH;

    return null; // no collateral
  };

  // -------- TOGGLE E-MODE LOGIC ----------
  const handleToggle = async () => {
    setError("");

    try {
      if (isEModeEnabled) {
        await setUserEMode(EMODE_CATEGORIES.DISABLED);
        return;
      }

      const category = detectUserCategory();

      if (!category) {
        setError("You must supply eligible collateral before enabling E-Mode.");
        return;
      }

      await setUserEMode(category);
    } catch (err: any) {
      console.error("E-Mode error:", err);
      setError(err.message || "Failed to toggle E-Mode");
    }
  };

  const categoryLabel =
    EMODE_CATEGORY_LABELS[eModeCategory as keyof typeof EMODE_CATEGORY_LABELS] ||
    "Unknown";

  const eModeLTV = (() => {
    const asset = ASSETS.find((a) => a.category === eModeCategory);
    return asset?.eModeLTV || null;
  })();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isEModeEnabled}
            onChange={handleToggle}
            disabled={isPending || !address}
            className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-blue-500"
          />

          <span className="text-base font-mono tracking-wide text-white">
  E-Mode (Unlock Maximum LTV)
</span>


          {isEModeEnabled && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
              {categoryLabel}
            </span>
          )}
        </label>

        {isEModeEnabled && eModeLTV && (
          <div className="text-right">
            <div className="text-xs text-white/60">E-Mode LTV</div>
            <div className="text-green-400 font-bold">{eModeLTV}%</div>
          </div>
        )}
      </div>

      <div className="text-xs text-white/60">
        {isEModeEnabled ? (
          <>Higher LTV enabled for {categoryLabel} assets.</>
        ) : (
          <>
          
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
          {error}
        </div>
      )}

      {isPending && (
        <div className="mt-2 text-xs text-blue-400">Processing transaction…</div>
      )}
    </div>
  );
};
