import React from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

/* ---------------- FLOW ANIMATION ---------------- */
const FlowAnimation = () => {
  const animSteps = ["COLLATERAL", "ASSIGN IP", "ROYALTIES", "AUTO-REPAY"];
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % animSteps.length),
      1300
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {animSteps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={`text-[10px] lg:text-xs font-mono tracking-[0.22em] transition-all duration-500 
              ${i === active ? "text-[#8AE06C]" : "text-white/30"}`}
          >
            {s}
          </span>
          {i < animSteps.length - 1 && (
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

/* ---------------- METRICS ---------------- */
const AnimatedMetrics = () => {
  const [tvl, setTvl] = React.useState(2138218);
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
    <div className="w-full max-w-sm p-7 rounded-2xl bg-white/6 border border-[#8AE06C]/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(138,224,108,0.28)] animate-[float_6s_ease-in-out_infinite] transition-all duration-500">
      <MetricRow label="TVL" value={`$${tvl.toFixed(2)}`} glow />
      <MetricRow
        label="TOTAL_DEBT"
        value={`$${debt.toFixed(2)}`}
        negative={debt < 300}
      />
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

const MetricRow = ({ label, value, glow = false, negative = false }: any) => (
  <div className="flex justify-between items-center py-3 border-b border-white/10">
    <span className="text-white/65 tracking-wide text-xs lg:text-sm">{label}</span>
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

/* ---------------- HOW IT WORKS TITLE ---------------- */
const HowTitle: React.FC = () => {
  const full = "HOW IT WORKS";
  const [visible, setVisible] = React.useState(false);
  const [text, setText] = React.useState("");

  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible(true);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    let i = 0;
    setText("");
    const id = setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i === full.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <div ref={ref} className="mb-8 flex items-center justify-center min-h-[44px]">
      <h2 className="text-3xl md:text-5xl font-black font-mono tracking-[0.18em] text-white">
        {text}
        {text.length < full.length && <span className="text-[#8AE06C] animate-pulse">|</span>}
      </h2>
    </div>
  );
};

/* ---------------- HOW IT WORKS LEFT STEPS ---------------- */
const steps = [
  { label: "DEPOSIT COLLATERAL" },
  { label: "ASSIGN IP" },
  { label: "AUTONOMOUS REPAYMENT" },
];

const HowStepsLeftGrid: React.FC = () => {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px]">
      <div className="space-y-4">
        {steps.map((step, i) => {
          const isActive = i === active;
          return (
            <div
              key={step.label}
              className={`flex items-center gap-4 px-6 py-3 rounded-xl border min-w-[190px]
                transition-all duration-300
                ${isActive
                  ? "border-[#8AE06C] bg-[#8AE06C]/15 shadow-[0_0_28px_rgba(138,224,108,0.18)]"
                  : "border-white/15 bg-black/40"
                }`}
            >
              <div
                className={`w-6 h-6 rounded-[5px] border flex items-center justify-center text-md font-bold
                  ${isActive
                    ? "border-[#8AE06C] bg-[#8AE06C]/30 text-[#8AE06C]"
                    : "border-white/40 text-white/30"
                  }`}
              >
                {isActive ? "✓" : ""}
              </div>
              <span
                className={`text-[13px] font-mono tracking-[0.15em] uppercase ${isActive ? "text-[#8AE06C]" : "text-[#8AE06C]/65"
                  }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- HOW IT WORKS CAROUSEL ---------------- */
const cardDetails = [
  {
    title: "Deposit collateral",
    description:
      "Supply stablecoins or ERC20 tokens into Autonomy. This creates a collateralized position.",
    bullets: ["Connect wallet", "Choose asset", "Confirm transaction"],
    image:
      "https://i0.wp.com/www.crypto-news-flash.com/wp-content/uploads/2025/11/Stellar-Users-Can-Now-Borrow-USDC-Using-XLM-as-Collateral-via-Templar-Protocol.png?w=750&resize=750,375&ssl=1",
  },
  {
    title: "Assign your IP",
    description:
      "Connect Story Protocol IP and assign rev-share rights. Future royalties repay debt.",
    bullets: ["Link IP", "Select asset", "Set rev-share"],
    image:
      "https://www.wikihow.com/images/thumb/c/c6/Find-Out-Your-IP-Address-Step-7-Version-2.jpg/v4-728px-Find-Out-Your-IP-Address-Step-7-Version-2.jpg.webp",
  },
  {
    title: "Autonomous repayment",
    description:
      "Royalties stream in automatically and reduce outstanding debt.",
    bullets: ["Royalties flow", "Debt reduces", "IP returns when paid"],
    image:
      "https://newfrontierfunding.com/wp-content/uploads/2024/06/dividend-recaps-2024-scaled.webp",
  },
];

const HowItWorksCarousel: React.FC = () => {
  const [index, setIndex] = React.useState(0);
  const step = cardDetails[index];

  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const obs = new IntersectionObserver((entry) => {
      setVisible(entry[0].isIntersecting);
    });
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex justify-end">
      <div
        ref={cardRef}
        className={`w-full max-w-3xl border border-[#8AE06C]/40 bg-black/60 backdrop-blur-2xl rounded-2xl 
          p-4 md:p-5 shadow-[0_0_40px_rgba(138,224,108,0.35)]
          transition-all duration-700
          ${visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
          }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black h-36 md:h-40">
            <img src={step.image} className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-[#8AE06C]/20" />
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-mono tracking-[0.25em] text-[#8AE06C]/80">
              STEP 0{index + 1}
            </p>
            <h3 className="text-lg md:text-xl font-bold text-white">{step.title}</h3>
            <p className="text-xs md:text-base font-mono text-white/70">{step.description}</p>

            <ul className="mt-1 space-y-1 text-[11px] font-mono text-white/65">
              {step.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-[#8AE06C]">▹</span> {b}
                </li>
              ))}
            </ul>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() =>
                  setIndex((prev) => (prev - 1 + cardDetails.length) % cardDetails.length)
                }
                className="px-3 py-1.5 rounded-md border border-white/20 text-[11px] font-mono text-white/80 hover:bg-white/10"
              >
                ← Prev
              </button>
              <button
                onClick={() => setIndex((prev) => (prev + 1) % cardDetails.length)}
                className="px-3 py-1.5 rounded-md border-[#8AE06C]/60 bg-[#8AE06C]/15 text-[11px] font-mono text-[#8AE06C] hover:bg-[#8AE06C]/25"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- WHY AUTONOMY ---------------- */
const WhyAutonomy = () => {
  const [hover, setHover] = React.useState(false);

  const left = [
    { title: "Self-repaying credit", desc: "Royalties reduce debt in real time." },
    { title: "IP as collateral", desc: "Borrow without selling long-term assets." },
  ];

  const right = [
    { title: "Transparent & auditable", desc: "Everything is fully on-chain and verifiable." },
    { title: "Creator-first UX", desc: "Repayments happen automatically in the background." },
  ];

  return (
    <section className="w-full py-32 font-mono">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10">

        {/* HEADER */}
        <div className="text-center mb-16 font-mono">
          <p className="text-base md:text-lg tracking-[0.32em] text-[#8AE06C]/85 uppercase">
            WHY AUTONOMY
          </p>

          <h2
            className="
    mt-4 text-lg md:text-2xl lg:text-3xl xl:text-4xl font-mono font-bold
    tracking-[0.32em] text-white uppercase
  "
          >
            THE FLAGSHIP PRIMITIVE FOR{" "}
            <span className="text-[#8AE06C] tracking-[0.32em]">CREATOR CREDIT</span>
          </h2>

        </div>

        <div className="w-full flex flex-col lg:flex-row items-center justify-center relative gap-8 lg:gap-0">

          {/* LEFT FEATURES */}
          <div className="flex flex-col space-y-8 lg:mr-10 order-2 lg:order-1 w-full lg:w-auto items-center lg:items-end text-center lg:text-right">
            {left.map((f, i) => (
              <div
                key={i}
                className={`w-56 transition-all duration-500 ${hover ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
                  }`}
              >
                <p className="text-base font-semibold text-white">{f.title}</p>
                <p className="text-xs text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* IMAGE SHRINK */}
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={`
              relative rounded-3xl overflow-hidden cursor-pointer
              border border-[#8AE06C]/30 bg-black/40 backdrop-blur-xl
              shadow-[0_25px_80px_-10px_rgba(138,224,108,0.4)]
              transition-all duration-500
              ${hover ? "w-[90%] lg:w-[50%]" : "w-[90%]"}
              max-w-[900px] aspect-[16/6]
              order-1 lg:order-2
            `}
          >
            <img src="/green1.png" className="w-full h-full object-cover" />
            <div
              className={`absolute inset-0 bg-[#8AE06C]/15 transition-opacity duration-500 ${hover ? "opacity-60" : "opacity-0"
                }`}
            />
          </div>

          {/* RIGHT FEATURES */}
          <div className="flex flex-col space-y-8 lg:ml-10 order-3 lg:order-3 w-full lg:w-auto items-center lg:items-start text-center lg:text-left">
            {right.map((f, i) => (
              <div
                key={i}
                className={`w-56 transition-all duration-500 ${hover ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
                  }`}
              >
                <p className="text-base font-semibold text-white">{f.title}</p>
                <p className="text-xs text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

/* ---------------- BUILT FOR ---------------- */
/**************************************
 *  BUILT FOR — AUTONOMY SECTION
 **************************************/

import { Music, Palette, Film, BookOpen, Gamepad2, Lightbulb } from "lucide-react";

const creatorRoles = [
  {
    title: "MUSICIANS",
    desc: "Turn predictable royalty income into self-repaying credit.",
    icon: Music,
  },
  {
    title: "ARTISTS",
    desc: "Borrow without selling your IP.",
    icon: Palette,
  },
  {
    title: "FILMMAKERS",
    desc: "Autonomy automatically repays debt using incoming royalties.",
    icon: Film,
  },
  {
    title: "WRITERS",
    desc: "Turn book, script, or content IP into self-repaying credit lines.",
    icon: BookOpen,
  },
  {
    title: "GAMERS",
    desc: "Fund development cycles while keeping complete creative control.",
    icon: Gamepad2,
  },
  {
    title: "IMAGINATORS",
    desc: "Your ideas → collateral → self-repaying credit.",
    icon: Lightbulb,
  },
];

export const BuiltFor: React.FC = () => {
  return (
    <section className="w-full py-32 font-mono text-white">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10">

        {/* HEADER */}
        <div className="text-center mb-16">
          <p className="text-sm md:text-base tracking-[0.32em] text-[#8AE06C] uppercase">
            WHO AUTONOMY EMPOWERS
          </p>

          <h2 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.25em] uppercase">
            THE NEW FOUNDATION FOR CREATOR CREDIT
          </h2>
          
          <p className="mt-4 text-white/60 text-sm md:text-base tracking-wide uppercase">
            Hover on any creator type to see how Autonomy empowers them.
          </p>
        </div>

        {/* 6-CARD ROW (Responsive Grid -> Flex) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex w-full gap-4 lg:gap-4">
          {creatorRoles.map((r, idx) => (
            <div
              key={idx}
              className="
                lg:flex-1 h-[280px]
                group relative p-4 lg:p-5 rounded-xl
                bg-black/40 border border-[#8AE06C]/40 backdrop-blur-xl
                flex flex-col justify-between overflow-hidden
                transition-all duration-300 ease-out
                lg:hover:flex-[1.5] hover:bg-black/60
                hover:shadow-[0_0_35px_rgba(138,224,108,0.55)]
              "
            >
              {/* ICON (Visible in default state) */}
              <div className="
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                text-[#8AE06C]/20 group-hover:opacity-0 transition-all duration-300
              ">
                <r.icon size={64} strokeWidth={1} />
              </div>

              {/* TITLE */}
              <h3
                className="
                  text-sm lg:text-base font-bold tracking-wide text-white
                  group-hover:text-[#8AE06C] transition-colors duration-300
                  whitespace-nowrap relative z-10
                "
              >
                {r.title}
              </h3>

              {/* DEFAULT STATE: HINT */}
              <div
                className="
                  absolute bottom-4 left-4
                  text-[10px] lg:text-xs text-white/50 tracking-widest uppercase
                  transition-all duration-300
                  group-hover:opacity-0 group-hover:translate-y-4
                "
              >
                Hover →
              </div>

              {/* HOVER STATE: DESCRIPTION */}
              <div
                className="
                  absolute bottom-4 left-4 right-4
                  text-xs lg:text-sm text-white/90 leading-snug
                  opacity-0 translate-y-4
                  transition-all duration-300
                  group-hover:opacity-100 group-hover:translate-y-0
                "
              >
                {r.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};









/* ---------------- MAIN LANDING EXPORT ---------------- */
export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <div
      className="min-h-screen w-full text-white overflow-hidden"
      style={{
        backgroundColor: "#02060b",
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    >
      <div className="space-y-16 pb-0"> {/* gap removed */}

        {/* HERO */}
        <section className="relative w-full pt-20 pb-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 w-full max-w-6xl mx-auto">

            {/* LEFT HERO CONTENT */}
            <div className="lg:col-span-8 px-6 lg:px-10 pt-12 pb-14 flex flex-col">
              <div>
                <div className="text-[10px] lg:text-xs opacity-60 animate-pulse mb-3 font-mono">
                  SYS.STATUS: ONLINE
                </div>
                <FlowAnimation />
              </div>

              <div className="mt-10" />
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
                      onClick={() => navigate("/core")}
                      className="px-7 py-3.5 text-sm lg:text-base font-mono rounded-md border border-white/20 text-white hover:bg-white/10"
                    >
                      LAUNCH APP_
                    </button>
                  ) : (
                    <button
                      onClick={openConnectModal}
                      className="px-7 py-3.5 text-sm lg:text-base font-mono rounded-md border border-white/20 text-white hover:bg-white/10"
                    >
                      CONNECT WALLET
                    </button>
                  )}
                  <button className="px-7 py-3.5 text-sm lg:text-base font-mono border border-white/20 rounded-md hover:bg-white/10">
                    READ DOCS
                  </button>
                </div>
              </div>
            </div>

            {/* METRICS */}
            <div className="lg:col-span-4 flex items-start justify-center pt-24 lg:pt-28 px-6 lg:px-8 pb-10">
              <AnimatedMetrics />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative -mt-24 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative z-10 py-12 lg:px-12">
            <HowTitle />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
              <div>
                <HowStepsLeftGrid />
              </div>
              <div className="lg:col-span-2">
                <HowItWorksCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* WHY AUTONOMY */}
        <WhyAutonomy />

        {/* BUILT FOR */}
        <BuiltFor />
      </div>
    </div>
  );
};
