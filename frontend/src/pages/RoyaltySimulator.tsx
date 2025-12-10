// ROYALTY SIMULATOR — GLOW CARD + BETTER LAYOUT + IPMINT THEME

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRoyaltySimulator } from "../hooks/useRoyaltySimulator";
import type { SimulationResult } from "../types/royaltySimulator";

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
      <div className="relative w-[420px] h-[400px] flex items-center justify-center scale-75 md:scale-100 origin-center">
        {popups.map((popup: any) => (
          <div
            key={popup.id}
            className="absolute px-4 py-2 bg-black/80 backdrop-blur-md 
            border border-[#8AE06C]/40 rounded-full text-xs font-bold 
            text-[#8AE06C] shadow-[0_0_15px_rgba(138,224,108,0.4)] animate-popupFade"
            style={{
              "--tw-translate-x": `${popup.x}px`,
              "--tw-translate-y": `${popup.y - 30}px`,
            } as React.CSSProperties}
          >
            {popup.text}
          </div>
        ))}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg width="500" height="350" viewBox="0 0 280 220">
            <rect
              x="20"
              y="40"
              width="240"
              height="140"
              rx="14"
              fill="rgba(138,224,108,0.08)"
              stroke="#8AE06C"
              strokeWidth="2"
            />
            <circle cx="80" cy="195" r="16" fill="#0a0f16" stroke="#8AE06C" strokeWidth="2" />
            <circle cx="200" cy="195" r="16" fill="#0a0f16" stroke="#8AE06C" strokeWidth="2" />
          </svg>
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
        <br/>
        <h2 className="text-lg md:text-xl tracking-[0.32em] font-bold uppercase">
          SIMULATE ROYALTY MINTING
        </h2>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 pb-24 flex flex-col lg:flex-row gap-10 lg:gap-16">

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
        <div className="hidden lg:flex w-full lg:w-[52%] h-[550px] items-center justify-center">
          <RoyaltyFlowAnimation />
        </div>
      </div>
    </div>
  );
}
