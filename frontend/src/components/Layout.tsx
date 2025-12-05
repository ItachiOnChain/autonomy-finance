import React from "react";
import { useTheme } from "../App";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

/* NAV WORDS */
const navWords = ["Borrowing", "Credit", "IP Loans", "Auto-Repay"];

const AnimatedNavWord: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % navWords.length),
      1800
    );
    return () => clearInterval(id);
  }, []);

  return <span className="text-primary drop-shadow-[0_0_6px_#8AE06C]">{navWords[index]}</span>;
};

const Divider = () => <span className="text-primary/40 select-none">|</span>;

const NavItem = ({ to, children }: any) => (
  <Link
    to={to}
    className="hover:text-primary transition drop-shadow-[0_0_4px_rgba(138,224,108,0.25)] font-mono"
  >
    {children}
  </Link>
);

/* MAIN LAYOUT */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useTheme();

  return (
    <div
      className="min-h-screen flex flex-col bg-black text-white transition-all duration-300"
    >
      {/* NAVBAR */}
      <header className="w-full relative z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

    {/* LOGO */}
    <Link to="/" className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-[8px] bg-primary/15 flex items-center justify-center overflow-hidden">
        <img src="/Favicon.svg" alt="Autonomy Finance" className="w-6 h-6" />
      </div>

      <div className="leading-tight">
        <div className="text-[10px] font-mono tracking-[0.32em] text-primary/70">
          AUTONOMY
        </div>
        <div className="text-base font-semibold tracking-tight text-primary">
          FINANCE
        </div>
      </div>
    </Link>

    {/* NAV */}
    <nav className="hidden md:flex items-center gap-6 text-sm font-mono text-white/70">
      <NavItem to="/core">Protocol</NavItem>
      <Divider />

      <NavItem to="/ip-mint">Mint IP</NavItem>
      <Divider />

      <NavItem to="/ip-dashboard">IP Dashboard</NavItem>
      <Divider />

      <NavItem to="/core">
        <AnimatedNavWord />
      </NavItem>
    </nav>

    {/* WALLET BTN */}
    <div className="flex items-center">
      <ConnectButton.Custom>
        {({ openConnectModal, account, mounted }) => {
          const connected = mounted && account;

          return (
            <button
              onClick={openConnectModal}
              className={`
                px-4 py-2 font-mono text-xs lg:text-sm rounded-md border border-[#8AE06C]
                ${connected ? "bg-black text-[#8AE06C]" : "bg-[#8AE06C] text-black"} 
                hover:shadow-[0_0_14px_rgba(138,224,108,0.8)]
                hover:bg-[#a4f17f] transition-all
              `}
            >
              {connected ? "CONNECTED" : "CONNECT WALLET"}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  </div>
</header>


      {/* MAIN */}
      <main className="flex-grow max-w-7xl mx-auto w-full pb-0">{children}</main>

      {/* FOOTER — premium fix */}
      <footer className="mt-0 py-16 border-t border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 font-mono">

          {/* BRAND */}
          <div>
            <div className="font-bold text-primary tracking-[0.2em] mb-4 drop-shadow-[0_0_8px_#8AE06C]">
              AUTONOMY FINANCE
            </div>
            <p className="text-sm text-white/60">Self-repaying credit powered by Story Protocol.</p>
          </div>

          {/* PROTOCOL */}
          <div>
            <div className="font-bold text-primary tracking-[0.2em] mb-4">PROTOCOL</div>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><a href="#" className="hover:text-primary">Documentation</a></li>
              <li><a href="#" className="hover:text-primary">GitHub</a></li>
              <li><a href="#" className="hover:text-primary">Audits</a></li>
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <div className="font-bold text-primary tracking-[0.2em] mb-4">COMMUNITY</div>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><a href="#" className="hover:text-primary">Discord</a></li>
              <li><a href="#" className="hover:text-primary">Twitter</a></li>
              <li><a href="#" className="hover:text-primary">Mirror</a></li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <div className="font-bold text-primary tracking-[0.2em] mb-4">LEGAL</div>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><a href="#" className="hover:text-primary">Terms</a></li>
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
            </ul>
          </div>

        </div>
      </footer>
    </div>
  );
};
