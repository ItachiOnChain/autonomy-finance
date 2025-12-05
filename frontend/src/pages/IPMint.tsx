import React, { useState } from "react";
import { useStoryProtocol, type IPMetadata } from "../hooks/useStoryProtocol";
import { useNavigate } from "react-router-dom";

export function IPMint() {
  const { mintIP, lockIPA, isLoading, error } = useStoryProtocol();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mintedId, setMintedId] = useState<string | null>(null);
  const [step, setStep] = useState<"MINT" | "LOCK">("MINT");

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const metadata: IPMetadata = {
        title,
        description,
        image: null,
      };

      const result = await mintIP(metadata);
      if (result && result.ipaId) {
        setMintedId(result.ipaId);
        setStep("LOCK");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLock = async () => {
    if (!mintedId) return;
    try {
      await lockIPA(mintedId);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="min-h-screen w-full px-6 py-16 font-mono text-white"
      style={{
        backgroundColor: "#02060b",
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    >
      {/* HEADER */}
      <h1 className="text-center text-xs md:text-sm tracking-[0.32em] text-[#8AE06C]/85 uppercase mb-3">
        MINT YOUR IP
      </h1>

      <h2 className="text-center text-sm md:text-base lg:text-lg tracking-[0.32em] font-bold uppercase text-white mb-12">
        REGISTER YOUR CREATIVE IP ON CHAIN
      </h2>

      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 shadow-[0_0_30px_rgba(138,224,108,0.25)]">

        {/* ERROR BOX */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-300 p-4 rounded-xl shadow-[0_0_12px_rgba(255,0,0,0.4)]">
            {error}
          </div>
        )}

        {/* MINT STEP */}
        {step === "MINT" ? (
          <form onSubmit={handleMint} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs tracking-wider text-white/70 mb-2">
                IP TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="
                  w-full p-3 rounded-lg 
                  bg-black/40 border border-white/20 
                  focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
                  outline-none transition text-white
                "
                placeholder="e.g. My Exclusive Song"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs tracking-wider text-white/70 mb-2">
                DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="
                  w-full p-3 rounded-lg h-32 
                  bg-black/40 border border-white/20 
                  focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
                  outline-none transition text-white
                "
                placeholder="Describe your IP asset..."
                required
              />
            </div>

            {/* Mint Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-4 rounded-lg font-bold tracking-wide 
                bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                hover:bg-[#8AE06C]/30 hover:border-[#8AE06C] 
                hover:shadow-[0_0_22px_rgba(138,224,108,0.8)]
                transition disabled:opacity-50
              "
            >
              {isLoading ? "Minting..." : "Mint IP Asset"}
            </button>
          </form>
        ) : (
          /* LOCK STEP */
          <div className="space-y-8">
            {/* Success Box */}
            <div className="bg-[#8AE06C]/10 border border-[#8AE06C]/50 text-[#8AE06C] p-4 rounded-xl shadow-[0_0_20px_rgba(138,224,108,0.4)]">
              <p className="font-bold tracking-wide">IP MINTED SUCCESSFULLY!</p>
              <p className="text-xs mt-1 opacity-90">ID: {mintedId}</p>
            </div>

            {/* Next Step Info */}
            <div className="bg-white/5 border border-white/20 text-white/70 p-5 rounded-xl">
              <p className="font-bold text-[#8AE06C] mb-2">
                LOCK FOR AUTO-REPAY
              </p>
              <p className="text-xs leading-relaxed text-white/70">
                Locking your IP enables **automated royalty-based repayment**.
                Your IP is <span className="text-[#8AE06C] font-semibold">NOT</span> used as collateral.
              </p>
            </div>

            {/* Lock Button */}
            <button
              onClick={handleLock}
              disabled={isLoading}
              className="
                w-full py-4 rounded-lg font-bold tracking-wide
                bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                hover:bg-[#8AE06C]/30 hover:border-[#8AE06C] 
                hover:shadow-[0_0_22px_rgba(138,224,108,0.8)]
                transition disabled:opacity-50
              "
            >
              {isLoading ? "Locking..." : "Lock for Auto-Repay"}
            </button>

            {/* Skip Button */}
            <button
              onClick={() => navigate("/dashboard")}
              className="
                w-full py-3 rounded-lg font-bold tracking-wide
                bg-white/5 border border-white/10 text-white/70
                hover:bg-white/10 transition
              "
            >
              Skip for Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
