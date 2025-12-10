<<<<<<< HEAD
// Royalty Simulator Page - Redesigned
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRoyaltySimulator } from '../hooks/useRoyaltySimulator';
import { DEFAULT_REVENUE_PER_DERIVATIVE, DEFAULT_NUMBER_OF_DERIVATIVES, MAX_DERIVATIVES } from '../constants/royaltySimulator';
=======
// ROYALTY SIMULATOR — GLOW CARD + BETTER LAYOUT + IPMINT THEME

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRoyaltySimulator } from "../hooks/useRoyaltySimulator";
import type { SimulationResult } from "../types/royaltySimulator";
>>>>>>> 8eeea86 (feat: add royalty flow animations and redesign the royalty simulator page layout.)

import {
  DEFAULT_REVENUE_PER_DERIVATIVE,
  DEFAULT_NUMBER_OF_DERIVATIVES,
  MAX_DERIVATIVES,
} from "../constants/royaltySimulator";

/* --------------------------------------------------------
   POPUP + TOKEN ANIMATION
--------------------------------------------------------- */
const POPUP_MESSAGES = [
  "You are earning royalty! 💸",
  "Your IP was viewed 👀",
  "Your IP was licensed 📜",
  "Your IP is going viral! 🚀",
  "New derivative created ✨",
  "Royalty payout incoming 💰",
];

const RoyaltyFlowAnimation = () => {
  const [popups, setPopups] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      const text = POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)];
      const x = Math.random() * 200 - 100;
      const y = Math.random() * 100 - 50;

      setPopups((prev) => [...prev, { id, text, x, y }]);

      setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 3000);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-[420px] h-[420px] flex items-center justify-center">
        {popups.map((popup: any) => (
          <div
            key={popup.id}
            className="absolute px-4 py-2 bg-black/80 backdrop-blur-md 
            border border-[#8AE06C]/40 rounded-full text-xs font-bold 
            text-[#8AE06C] shadow-[0_0_15px_rgba(138,224,108,0.4)] animate-popupFade"
            style={{ transform: `translate(${popup.x}px, ${popup.y - 120}px)` }}
          >
            {popup.text}
          </div>
        ))}

<<<<<<< HEAD
        if (royaltyToMint === 0) {
            alert('Royalty to mint cannot be zero. Please enter valid amounts.');
            return;
        }

        try {
            const result = await simulateRevenue(
                ipId,
                revenuePerDerivative,
                numberOfDerivatives
            );

            setLastSimulation(result);
            await loadIpInfo(); // Refresh balance
        } catch (err) {
            console.error('Simulation failed:', err);
            alert('Simulation failed. Please check console for details.');
        }
    };

    // CRITICAL FIX: Simple multiplication - NO royaltyPercent division
    const royaltyToMint = parseFloat(revenuePerDerivative) * numberOfDerivatives;

    return (
        <div
            className="min-h-screen w-full text-white flex flex-col font-mono"
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
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-[0.28em] uppercase">
                        ROYALTY SIMULATOR
                    </h1>
                </div>
            </div>

            {/* ================= BODY ================= */}
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">

                {!isConnected ? (
                    /* Wallet Warning */
                    <div
                        className="
                          bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-xl
                          p-8 font-mono tracking-wide 
                          shadow-[0_0_20px_rgba(138,224,108,0.25)]
                        "
                    >
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="text-4xl">⚠</div>
                            <div>
                                <div className="text-xl font-bold uppercase text-[#8AE06C] tracking-widest">
                                    Wallet Not Connected
                                </div>
                                <div className="text-sm text-white/70 mt-2">
                                    Please connect your wallet to use the Royalty Simulator.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Input & Parameters */}
                            <div className="space-y-8">
                                {/* IP Input Panel */}
                                <div
                                    className="
                                      bg-black/40 border border-white/10 
                                      rounded-2xl p-8 backdrop-blur-xl
                                      shadow-[0_0_25px_rgba(138,224,108,0.1)]
                                    "
                                >
                                    <h2 className="text-sm font-mono tracking-[0.25em] uppercase text-[#8AE06C] mb-6">
                                        TARGET IP ASSET
                                    </h2>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider text-white/50">
                                            IP ADDRESS (IP ID)
                                        </label>
                                        <input
                                            type="text"
                                            value={ipId}
                                            onChange={(e) => setIpId(e.target.value)}
                                            placeholder="Paste here (e.g., 0x1234...)"
                                            className="
                                              w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 
                                              text-white font-mono placeholder-white/20
                                              focus:border-[#8AE06C] focus:outline-none focus:ring-1 focus:ring-[#8AE06C]/50
                                              transition-all
                                            "
                                        />
                                    </div>
                                </div>

                                {/* Simulation Parameters Panel */}
                                <div
                                    className="
                                      bg-black/40 border border-white/10 
                                      rounded-2xl p-8 backdrop-blur-xl
                                      shadow-[0_0_25px_rgba(138,224,108,0.1)]
                                    "
                                >
                                    <h2 className="text-sm font-mono tracking-[0.25em] uppercase text-[#8AE06C] mb-6">
                                        SIMULATION PARAMETERS
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-wider text-white/50">
                                                ROYALTY EARNED PER DERIVATIVE (USD)
                                            </label>
                                            <input
                                                type="number"
                                                value={revenuePerDerivative}
                                                onChange={(e) => setRevenuePerDerivative(e.target.value)}
                                                className="
                                                  w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 
                                                  text-white font-mono focus:border-[#8AE06C] focus:outline-none focus:ring-1 focus:ring-[#8AE06C]/50
                                                  transition-all
                                                "
                                                min="0"
                                                step="1"
                                                placeholder="Enter amount"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-wider text-white/50">
                                                NUMBER OF DERIVATIVES (MAX: {MAX_DERIVATIVES})
                                            </label>
                                            <input
                                                type="number"
                                                value={numberOfDerivatives}
                                                onChange={(e) => setNumberOfDerivatives(parseInt(e.target.value) || 1)}
                                                className="
                                                  w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 
                                                  text-white font-mono focus:border-[#8AE06C] focus:outline-none focus:ring-1 focus:ring-[#8AE06C]/50
                                                  transition-all
                                                "
                                                min="1"
                                                max={MAX_DERIVATIVES}
                                                step="1"
                                            />
                                        </div>

                                        {/* Prediction Box */}
                                        <div className="mt-4 p-4 bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-white/70 uppercase tracking-wide">Expected Mint</span>
                                                <span className="text-lg font-bold text-[#8AE06C] drop-shadow-[0_0_8px_rgba(138,224,108,0.5)]">
                                                    {royaltyToMint.toFixed(2)} TOKENS
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-white/40 font-mono">
                                                Formula: {numberOfDerivatives} × {parseFloat(revenuePerDerivative).toFixed(2)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSimulate}
                                            disabled={isLoading || !ipId || !address}
                                            className="
                                              w-full py-4 mt-2
                                              bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                                              hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]/60 hover:shadow-[0_0_20px_rgba(138,224,108,0.2)]
                                              rounded-lg font-bold text-sm tracking-[0.15em] uppercase
                                              transition-all duration-300
                                              disabled:opacity-40 disabled:cursor-not-allowed
                                            "
                                        >
                                            {isLoading ? 'PROCESSING SIMULATION...' : 'SIMULATE REVENUE'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Results & Status */}
                            <div className="space-y-8">
                                {/* Results Panel */}
                                {lastSimulation && (
                                    <div
                                        className="
                                          bg-black/40 border border-[#8AE06C]/25 
                                          rounded-2xl p-8 backdrop-blur-xl
                                          shadow-[0_0_35px_rgba(138,224,108,0.15)]
                                          animate-in fade-in slide-in-from-bottom-4 duration-500
                                        "
                                    >
                                        <h2 className="text-sm font-mono tracking-[0.25em] uppercase text-[#8AE06C] mb-6">
                                            SIMULATION RESULTS
                                        </h2>

                                        <div className="space-y-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase tracking-wider text-white/50">Transaction Hash</span>
                                                <a
                                                    href={`https://aeneid.storyscan.io/tx/${lastSimulation.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-[#8AE06C] hover:text-white hover:underline transition-colors truncate"
                                                >
                                                    {lastSimulation.txHash} ↗
                                                </a>
                                            </div>

                                            <div className="border-t border-white/10 my-4" />

                                            <div className="flex justify-between items-center">
                                                <span className="text-xs uppercase tracking-wider text-white/60">Minted Now</span>
                                                <span className="text-lg font-bold text-white">
                                                    {royaltyToMint.toFixed(2)} <span className="text-xs font-normal text-white/40">TOKENS</span>
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                                <span className="text-xs uppercase tracking-wider text-white/60">Total Balance</span>
                                                <span className="text-xl font-bold text-[#8AE06C] drop-shadow-[0_0_10px_rgba(138,224,108,0.3)]">
                                                    {royaltyBalance} <span className="text-xs font-normal text-[#8AE06C]/60">TOKENS</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-md">
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl">🛑</span>
                                            <div>
                                                <h3 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Error Occurred</h3>
                                                <p className="text-red-300/80 text-xs font-mono break-all">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Placeholder empty state if no results yet */}
                                {!lastSimulation && !error && (
                                    <div
                                        className="
                                          h-full min-h-[200px] flex items-center justify-center
                                          border border-dashed border-white/10 rounded-2xl
                                          bg-white/[0.02]
                                        "
                                    >
                                        <div className="text-center opacity-40">
                                            <div className="text-4xl mb-2">📊</div>
                                            <div className="text-xs uppercase tracking-widest">
                                                Awaiting Simulation
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
=======
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg width="240" height="160" viewBox="0 0 200 140">
            <rect
              x="20"
              y="40"
              width="160"
              height="80"
              rx="14"
              fill="rgba(138,224,108,0.08)"
              stroke="#8AE06C"
              strokeWidth="2"
            />
            <circle cx="70" cy="125" r="14" fill="#0a0f16" stroke="#8AE06C" strokeWidth="2" />
            <circle cx="140" cy="125" r="14" fill="#0a0f16" stroke="#8AE06C" strokeWidth="2" />
          </svg>
>>>>>>> 8eeea86 (feat: add royalty flow animations and redesign the royalty simulator page layout.)
        </div>

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full animate-tokenFall"
            style={{
              animationDelay: `${i * 0.5}s`,
              background: "radial-gradient(circle, #8AE06C 0%, transparent 70%)",
              boxShadow: "0 0 15px #8AE06C",
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function RoyaltySimulator() {
  const { address, isConnected } = useAccount();
  const { isLoading, simulateRevenue, getRoyaltyBalance, getIpInfo } =
    useRoyaltySimulator();

  const [ipId, setIpId] = useState("");
  const [revenuePerDerivative, setRevenuePerDerivative] = useState(
    DEFAULT_REVENUE_PER_DERIVATIVE
  );
  const [numberOfDerivatives, setNumberOfDerivatives] = useState(
    DEFAULT_NUMBER_OF_DERIVATIVES
  );

  const [royaltyBalance, setRoyaltyBalance] = useState("0");
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);

  useEffect(() => {
    if (ipId && ipId.length > 10) loadIpInfo();
  }, [ipId]);

  async function loadIpInfo() {
    try {
      const info = await getIpInfo(ipId);
      if (info && info.owner !== "0x0000000000000000000000000000000000000000") {
        const balance = await getRoyaltyBalance(ipId);
        setRoyaltyBalance(balance);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSimulate() {
    if (!ipId || !address) return;

    const result = await simulateRevenue(
      ipId,
      revenuePerDerivative,
      numberOfDerivatives
    );
    setLastSimulation(result);

    await loadIpInfo();
  }

  const royaltyToMint = parseFloat(revenuePerDerivative) * numberOfDerivatives;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#02060b] flex items-center justify-center text-white font-mono">
        Connect Wallet to Use Simulator
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full font-mono text-white relative"
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
      <div className="text-center pt-16 mb-10">
        <h1 className="text-xs tracking-[0.32em] text-[#8AE06C]/80 uppercase">
          ROYALTY SIMULATOR
        </h1>
        <br />
        <h2 className="text-lg md:text-xl tracking-[0.32em] font-bold uppercase">
          SIMULATE ROYALTY MINTING
        </h2>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 pb-24 flex flex-col lg:flex-row gap-16">

        {/* LEFT CARD — BIGGER + GLOWING PREMIUM */}
        <div className="w-full lg:w-[48%]">
          <div
            className="
              p-10 rounded-2xl
              bg-black/60 backdrop-blur-2xl
              border border-[#8AE06C]/30

              shadow-[0_0_35px_rgba(138,224,108,0.25)]
              hover:shadow-[0_0_55px_rgba(138,224,108,0.35)]

              transition-all duration-500
            "
            style={{
              boxShadow:
                "0 0 40px rgba(138,224,108,0.25), inset 0 0 20px rgba(138,224,108,0.08)",
            }}
          >

            {/* INPUT FIELDS — all same style */}
            <label className="text-xs text-white/60 uppercase tracking-wide">IP ASSET ID</label>
            <input
              value={ipId}
              onChange={(e) => setIpId(e.target.value)}
              placeholder="0xABC..."
              className="
                w-full mt-2 mb-6 px-4 py-3 rounded-lg
                bg-[#0d0f12] text-white placeholder-white/30
                border border-white/20

                hover:border-[#8AE06C] focus:border-[#8AE06C]
                focus:outline-none
                transition-all
              "
            />

            <label className="text-xs text-white/60 uppercase tracking-wide">ROYALTY / DERIVATIVE</label>
            <input
              type="number"
              value={revenuePerDerivative}
              onChange={(e) => setRevenuePerDerivative(e.target.value)}
              className="
                w-full mt-2 mb-6 px-4 py-3 rounded-lg
                bg-[#0d0f12] text-white border border-white/20
                hover:border-[#8AE06C] focus:border-[#8AE06C]
                focus:outline-none transition-all
              "
            />

            <label className="text-xs text-white/60 uppercase tracking-wide">NUMBER OF DERIVATIVES</label>
            <input
              type="number"
              min="1"
              max={MAX_DERIVATIVES}
              value={numberOfDerivatives}
              onChange={(e) => setNumberOfDerivatives(parseInt(e.target.value))}
              className="
                w-full mt-2 mb-6 px-4 py-3 rounded-lg
                bg-[#0d0f12] text-white border border-white/20
                hover:border-[#8AE06C] focus:border-[#8AE06C]
                focus:outline-none transition-all
              "
            />

            {/* PREVIEW */}
            <div className="p-5 rounded-xl border border-[#8AE06C]/30 bg-[#8AE06C]/10 mb-8">
              <p className="text-2xl text-[#8AE06C] font-bold">
                {royaltyToMint.toFixed(2)} tokens
              </p>
              <p className="text-xs text-white/40 mt-1">
                {numberOfDerivatives} × {revenuePerDerivative}
              </p>
            </div>

            {/* BUTTON */}
            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="
                w-full py-4 rounded-lg font-bold text-lg
                bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]

                hover:shadow-[0_0_25px_rgba(138,224,108,0.6)]
                transition-all disabled:opacity-50
              "
            >
              {isLoading ? "Simulating..." : "Simulate Revenue"}
            </button>

            {/* RESULTS */}
            {lastSimulation && (
              <div className="p-6 mt-6 bg-black/40 border border-[#8AE06C]/25 rounded-xl">
                <h3 className="text-lg font-bold">Simulation Results</h3>

                <p className="mt-4 flex justify-between text-sm text-white/60">
                  Royalty Minted:
                  <span className="text-[#8AE06C] font-bold">{royaltyToMint}</span>
                </p>

                <p className="mt-2 flex justify-between text-sm text-white/60">
                  New Balance:
                  <span className="text-[#8AE06C] font-bold">{royaltyBalance}</span>
                </p>

                <a
                  href={`https://aeneid.storyscan.io/tx/${lastSimulation.txHash}`}
                  target="_blank"
                  className="block mt-4 text-xs text-[#8AE06C] underline"
                >
                  View on Scan →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE ANIMATION */}
        <div className="w-full lg:w-[52%] h-[550px] flex items-center justify-center">
          <RoyaltyFlowAnimation />
        </div>
      </div>
    </div>
  );
}
