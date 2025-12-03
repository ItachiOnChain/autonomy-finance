import React from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

/* ---------------- FLOW ANIMATION (thin) ---------------- */
const FlowAnimation = () => {
  const steps = ["COLLATERAL", "ASSIGN IP", "ROYALTIES", "AUTO-REPAY"];
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % steps.length),
      1300
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={`text-[10px] lg:text-xs font-mono tracking-[0.22em] transition-all duration-500 
              ${i === active ? "text-[#8AE06C]" : "text-white/30"}`}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-4 lg:w-7 transition-all 
                ${i === active ? "bg-[#8AE06C]" : "bg-white/15"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------------- TYPING WORDS ---------------- */
const words = ["CREATIVITY", "TALENT", "VISION", "IMAGINATION", "ARTISTRY"];

const TypingWords = () => {
  const [text, setText] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);

  React.useEffect(() => {
    const current = words[index];

    if (charIndex < current.length) {
      const t = setTimeout(() => {
        setText((prev) => prev + current[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 110);
      return () => clearTimeout(t);
    }

    const pause = setTimeout(() => {
      setText("");
      setCharIndex(0);
      setIndex((prev) => (prev + 1) % words.length);
    }, 1500);

    return () => clearTimeout(pause);
  }, [charIndex, index]);

  return (
    <span className="text-[#8AE06C] inline-block min-w-[220px]">
      {text}
    </span>
  );
};

/* ---------------- METRICS BOX ---------------- */
const AnimatedMetrics = () => {
  const [tvl, setTvl] = React.useState(2000);
  const [debt, setDebt] = React.useState(1200);
  const [assets, setAssets] = React.useState(3);

  React.useEffect(() => {
    const id = setInterval(() => {
      setTvl((v) => v + (Math.random() * 40 - 20));
      setDebt((d) => Math.max(0, d + (Math.random() * 30 - 15)));
      setAssets((a) => (Math.random() > 0.9 ? a + 1 : a));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="
        w-full max-w-sm p-7 rounded-2xl 
        bg-white/6 border border-[#8AE06C]/40 
        backdrop-blur-2xl 
        shadow-[0_0_30px_rgba(138,224,108,0.28)]
        animate-[float_6s_ease-in-out_infinite]
        transition-all duration-500
      "
    >
      <MetricRow label="TVL" value={`$${tvl.toFixed(2)}`} glow />
      <MetricRow label="TOTAL_DEBT" value={`$${debt.toFixed(2)}`} negative={debt < 300} />
      <MetricRow label="IP_ASSETS" value={assets} />

      <div className="mt-9 pt-5 border-t border-[#8AE06C]/30">
        <div className="font-bold text-[#8AE06C] mb-3 text-sm">
          LIVE ACTIVITY
        </div>

        <div className="space-y-1.5 text-[11px] lg:text-xs opacity-80 font-mono leading-relaxed">
          <div>&gt; Protocol responding to yield…</div>
          <div>&gt; Repayment stream activated…</div>
          <div>&gt; Credit channels stable…</div>
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({
  label,
  value,
  glow = false,
  negative = false,
}: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/10">
    <span className="text-white/65 tracking-wide text-xs lg:text-sm">
      {label}
    </span>
    <span
      className={`
        font-mono text-base lg:text-lg transition-all duration-700
        ${negative ? "text-red-400" : "text-white"}
        ${glow ? "drop-shadow-[0_0_12px_#8AE06C]" : ""}
      `}
    >
      {value}
    </span>
  </div>
);

/* ---------------- FULL-WIDTH GRID BACKGROUND ---------------- */
const GridHeroBackground = () => (
  <div className="w-full h-full bg-black relative overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }}
    />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.32),transparent_60%)]" />
  </div>
);

/* ===================== MAIN LANDING ===================== */
export const Landing: React.FC = () => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/core');
  };

  return (
    <div className="space-y-32 pb-24 bg-black text-white overflow-hidden">
      {/* HERO (start just below navbar) */}
      <section className="relative w-full pt-20 pb-10 overflow-hidden">
        {/* full‑width grid background */}
        <div className="pointer-events-none absolute inset-0 top-10">
          <GridHeroBackground />
        </div>

        {/* dark overlay on top of grid */}
        <div className="pointer-events-none absolute inset-0 top-10 bg-black/65" />

        {/* content (centered, but bg full width) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 w-full max-w-6xl mx-auto">
          {/* LEFT */}
          <div className="lg:col-span-8 px-6 lg:px-10 pt-12 pb-14 flex flex-col">
            {/* status + flow */}
            <div>
              <div className="font-mono text-[10px] lg:text-xs opacity-60 animate-pulse mb-3">
                SYS.STATUS: ONLINE
              </div>
              <FlowAnimation />
            </div>

            {/* gap between line animation and hero text */}
            <div className="mt-10" />

            {/* hero text */}
            <div className="mt-auto max-w-xl space-y-5 pb-2">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                BORROW AGAINST <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  YOUR <TypingWords />
                </span>
              </h1>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-base lg:text-lg font-mono text-white/90">
                  A self-repaying lending protocol powered by Story Protocol.
                </p>
              </div>

              <p className="text-xs lg:text-sm font-mono text-white/60">
                Your IP royalties automatically repay your debt over time.
              </p>

              <div className="flex flex-wrap gap-4 mt-4">
                {isConnected ? (
                  <button
                    onClick={handleLaunchApp}
                    className="px-7 py-3.5 text-sm lg:text-base bg-white text-black font-semibold rounded-md 
                      hover:bg-white/80 transition-all duration-200"
                  >
                    LAUNCH APP_
                  </button>
                ) : (
                  <button
                    onClick={openConnectModal}
                    className="px-7 py-3.5 text-sm lg:text-base font-mono rounded-md border border-white/20 
                      text-white hover:bg-white/10 transition-all"
                  >
                    CONNECT WALLET
                  </button>
                )}

                <button className="px-7 py-3.5 text-sm lg:text-base border border-white/20 rounded-md hover:bg-white/10 transition-all">
                  READ DOCS
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT – metrics slightly lower than center */}
          <div className="lg:col-span-4 flex items-start justify-center pt-24 lg:pt-28 px-6 lg:px-8 pb-10">
            <AnimatedMetrics />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-grow bg-[#8AE06C]/40" />
          <h2 className="text-3xl font-bold text-[#8AE06C]">HOW_IT_WORKS</h2>
          <div className="h-px flex-grow bg-[#8AE06C]/40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-[#8AE06C]/25 rounded-xl bg-black/40 backdrop-blur-xl">
          <HowCard
            index="01"
            title="DEPOSIT COLLATERAL"
            text="Supply stablecoins or ERC20 tokens."
          />
          <HowCard
            index="02"
            title="ASSIGN IP"
            text="Assign temporary rights to generate yield."
            border
          />
          <HowCard
            index="03"
            title="AUTONOMOUS REPAYMENT"
            text="Royalties reduce your debt automatically."
          />
        </div>
      </section>

      {/* WHY AUTONOMY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8">
        <WhyLeft />
        <WhyRight />
      </section>
    </div>
  );
};

/* ---------------- EXTRA COMPONENTS ---------------- */
const HowCard = ({ index, title, text, border }: any) => (
  <div
    className={`p-8 hover:bg-[#8AE06C]/10 transition border-[#8AE06C]/20 
      ${border ? "border-b md:border-b-0 md:border-r" : ""}`}
  >
    <div className="font-mono text-4xl mb-4 text-[#8AE06C]/40">{index}</div>
    <h3 className="text-xl font-bold text-[#8AE06C]">{title}</h3>
    <p className="font-mono text-sm text-white/70">{text}</p>
  </div>
);

const WhyLeft = () => (
  <div className="border border-[#8AE06C]/30 rounded-2xl p-8 bg-black/60 backdrop-blur-xl shadow-[0_0_20px_rgba(138,224,108,0.2)]">
    <h2 className="text-3xl font-bold text-[#8AE06C] mb-8">WHY_AUTONOMY?</h2>
    <ul className="space-y-6 font-mono text:white/80">
      {[
        "Self-repaying credit lines",
        "Productive IP-backed borrowing",
        "Story Protocol integration",
        "Zero-maintenance repayment",
        "Creator sovereignty",
      ].map((x) => (
        <li key={x} className="flex gap-3">
          <span className="text-[#8AE06C]">[+]</span> {x}
        </li>
      ))}
    </ul>
  </div>
);

const WhyRight = () => (
  <div className="border border-[#8AE06C]/30 rounded-2xl p-8 bg-black/30 backdrop-blur-xl text-center">
    <h3 className="text-2xl font-bold text-[#8AE06C] mb-6">BUILT FOR CREATORS</h3>
    <div className="flex flex-wrap justify-center gap-3 font-mono text-sm">
      {["MUSICIANS", "AUTHORS", "FILMMAKERS", "ANIMATORS", "AI_MODELS"].map(
        (tag) => (
          <span
            key={tag}
            className="border border-[#8AE06C]/40 text-[#8AE06C] px-3 py-1 rounded-full bg-black/40 hover:bg-[#8AE06C]/10 transition"
          >
            {tag}
          </span>
        )
      )}
    </div>
  </div>
);
