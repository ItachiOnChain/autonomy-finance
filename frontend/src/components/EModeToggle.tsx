import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useUserEMode, useSetUserEMode } from "../hooks/useEMode";
import { EMODE_CATEGORIES, EMODE_CATEGORY_LABELS, ASSETS } from "../config/assets";
import { useAllUserPositions } from "../hooks/useLendingPool";

export const EModeToggle: React.FC = () => {
  const { address } = useAccount();
  const { eModeCategory, isEModeEnabled } = useUserEMode(address);
  const { setUserEMode, isPending } = useSetUserEMode();
  const [error, setError] = useState("");

  // Use the bulk hook which handles contract resolution correctly
  // and follows hook rules (as long as ASSETS length is constant)
  const allPositions = useAllUserPositions();

  // -------- DETECT USER COLLATERAL CORRECTLY ----------
  const detectUserCategory = () => {
    if (!address) return null;

    let hasStable = false;
    let hasETH = false;
    let hasBTC = false;

    for (const { asset, supplied } of allPositions) {
      // Check if user has supplied this asset
      if (supplied > 0n) {
        if (asset.category === EMODE_CATEGORIES.STABLECOINS) hasStable = true;
        if (asset.category === EMODE_CATEGORIES.ETH) hasETH = true;
        if (asset.category === EMODE_CATEGORIES.BTC) hasBTC = true;
      }
    }

    // Priorities: Stable > ETH > BTC (Arbitrary priority if user has multiple categories)
    // In reality, user should choose, but simple toggle assumes "Best" or first eligible.
    // If we want to support switching between categories, UI needs dropdown.
    // The previous code had implicit priority.
    if (hasStable) return EMODE_CATEGORIES.STABLECOINS;
    if (hasETH) return EMODE_CATEGORIES.ETH;
    if (hasBTC) return EMODE_CATEGORIES.BTC;

    return null; // no eligible collateral
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
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isEModeEnabled}
              onChange={handleToggle}
              disabled={isPending || !address}
              className="sr-only peer"
            />
            <div className="
              w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8AE06C]
            "></div>
          </div>

          <span className="text-sm md:text-base font-mono tracking-wide text-white group-hover:text-[#8AE06C] transition-colors">
            E-Mode (Unlock Maximum LTV)
          </span>

          {isEModeEnabled && (
            <span className="px-2 py-0.5 bg-[#8AE06C]/20 text-[#8AE06C] border border-[#8AE06C]/30 rounded text-xs font-mono uppercase">
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
