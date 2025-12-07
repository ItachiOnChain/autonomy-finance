import React, { useState } from "react";
import { useStoryProtocol } from "../hooks/useStoryProtocol";
import { getContracts, MARKET_CHAIN_ID } from "../config/contracts";

interface IPSimulatorProps {
  onRoyaltyPaid?: () => void;
}

export function IPSimulator({ onRoyaltyPaid }: IPSimulatorProps) {
  const { payRoyalty, isLoading, error } = useStoryProtocol();

  const [ipaId, setIpaId] = useState("");
  const [amount, setAmount] = useState("");

  // Get contracts for MARKET chain
  const contracts = getContracts(MARKET_CHAIN_ID);
  const MockRoyaltyToken = contracts?.MockRoyaltyToken;

  const [selectedToken, setSelectedToken] = useState<string>(
    MockRoyaltyToken?.address || ""
  );
  const [success, setSuccess] = useState("");

  if (!MockRoyaltyToken) {
    return (
      <div className="text-white/50 text-sm">
        MockRoyaltyToken not available on this network
      </div>
    );
  }

  const handlePayRoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipaId || !amount) return;

    setSuccess("");
    try {
      await payRoyalty(ipaId, selectedToken, amount);
      setSuccess("Royalty paid successfully ✔");
      setAmount("");

      if (onRoyaltyPaid) onRoyaltyPaid();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="
        bg-black/50 backdrop-blur-xl
        border border-[#8AE06C]/25 
        rounded-2xl p-8
        shadow-[0_0_28px_rgba(138,224,108,0.25)]
        text-white font-mono
      "
    >
      {/* TITLE */}
      <h2 className="text-base tracking-[0.2em] font-bold uppercase mb-3">
        ROYALTY SIMULATOR
      </h2>

      <p className="text-xs text-white/60 leading-relaxed mb-6">
        Simulate real-world usage of your IP by paying royalties to it.
      </p>

      {/* ERROR */}
      {error && (
        <div
          className="
            bg-red-500/10 border border-red-500 
            text-red-400 p-3 rounded-lg text-xs mb-4
          "
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          className="
            bg-[#8AE06C]/10 border border-[#8AE06C]/40
            text-[#8AE06C] p-3 rounded-lg text-xs mb-4
            shadow-[0_0_12px_rgba(138,224,108,0.4)]
          "
        >
          {success}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handlePayRoyalty} className="space-y-5">
        {/* IPA ID */}
        <div>
          <label className="block text-[10px] tracking-wider text-white/60 mb-1 uppercase">
            Target IPA ID
          </label>
          <input
            type="text"
            value={ipaId}
            onChange={(e) => setIpaId(e.target.value)}
            className="
              w-full bg-black/40 border border-white/20 
              rounded-lg p-3 text-sm text-white
              focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
              outline-none transition
            "
            placeholder="0x..."
            required
          />
        </div>

        {/* TOKEN SELECT */}
        <div>
          <label className="block text-[10px] tracking-wider text-white/60 mb-1 uppercase">
            Royalty Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="
              w-full bg-black/40 border border-white/20 
              rounded-lg p-3 text-sm text-white
              focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
              outline-none transition
            "
          >
            <option value={MockRoyaltyToken.address}>
              MOCK Token
            </option>
          </select>
        </div>

        {/* AMOUNT */}
        <div>
          <label className="block text-[10px] tracking-wider text-white/60 mb-1 uppercase">
            Amount
          </label>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="
              w-full bg-black/40 border border-white/20 
              rounded-lg p-3 text-sm text-white
              focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
              outline-none transition
            "
            placeholder="0.00"
            required
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full rounded-lg py-3 text-sm font-bold 
            border border-[#8AE06C]/60
            bg-[#8AE06C]/20 text-[#8AE06C]
            hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]
            hover:shadow-[0_0_22px_rgba(138,224,108,0.7)]
            transition disabled:opacity-40
          "
        >
          {isLoading ? "Processing..." : "Pay Royalty"}
        </button>
      </form>
    </div>
  );
}
