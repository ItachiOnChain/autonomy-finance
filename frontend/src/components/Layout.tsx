import React from "react";
import { useTheme } from "../App";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface LayoutProps {
  children: React.ReactNode;
}

/* ============================================================
   ⭐ Animated Nav Word Component
============================================================ */
const navWords = ["Borrowing", "Credit", "IP Loans", "Auto-Repay"];

const AnimatedNavWord: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % navWords.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-primary drop-shadow-[0_0_6px_#8AE06C]">
      {navWords[index]}
    </span>
  );
};

/* Divider */
const Divider: React.FC = () => (
  <span className="text-primary/40 select-none">|</span>
);

import { Link } from 'react-router-dom';

/* Nav Item Component */
const NavItem: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({
  to,
  children,
  className = "",
}) => (
  <Link
    to={to}
    className={`hover:text-primary transition drop-shadow-[0_0_4px_rgba(138,224,108,0.25)] ${className}`}
  >
    {children}
  </Link>
);

/* ============================================================
   ⭐ MAIN LAYOUT
============================================================ */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col
        bg-surface-light dark:bg-black
        text-black dark:text-white 
        transition-all duration-300`}
    >
      {/* ================= NAVBAR ================= */}
      <header
        className="
          w-full sticky top-0 z-50 
          border-b border-transparent dark:border-primary/20
          bg-surface-light/90 dark:bg-black/80
          backdrop-blur-xl 
          transition-all duration-300
        "
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LEFT WORDMARK LOGO */}
          <Link to="/" className="flex items-center gap-3">
            {/* favicon icon */}
            <div className="w-7 h-7 rounded-[8px] bg-primary/15 shadow-[0_0_16px_#8AE06C] flex items-center justify-center overflow-hidden">
              <img
                src="/Favicon.svg"
                alt="Autonomy Finance"
                className="w-6 h-6"
              />
            </div>

            {/* 2-line AUTONOMY / FINANCE */}
            <div className="leading-tight">
              <div className="text-[10px] font-mono tracking-[0.32em] text-primary/70">
                AUTONOMY
              </div>
              <div className="text-base font-semibold tracking-tight text-primary drop-shadow-[0_0_8px_#8AE06C]">
                FINANCE
              </div>
            </div>
          </Link>

          {/* CENTER NAV */}
          <nav
            className="hidden md:flex items-center gap-6 
              text-sm font-mono 
              text-black/70 dark:text-white/70"
          >
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

          {/* RIGHT SIDE: WALLET (neon green glow) */}
          <div className="flex items-center gap-3">
            <ConnectButton.Custom>
              {({ openConnectModal, account, mounted }) => {
                const connected = mounted && !!account;
                return (
                  <button
                    onClick={openConnectModal}
                    className={`
                      px-4 py-2 rounded-md text-xs lg:text-sm font-mono
                      border border-[#8AE06C]/70
                      ${connected ? "bg-black text-[#8AE06C]" : "bg-[#8AE06C] text-black"}
                      shadow-[0_0_14px_rgba(138,224,108,0.9)]
                      hover:shadow-[0_0_22px_rgba(138,224,108,1)]
                      hover:bg-[#a4f17f]
                      transition-all duration-200
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

      {/* ================= MAIN ================= */}
      <main className="flex-grow max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* ================= FOOTER ================= */}
      <footer
        className="
          border-t border-primary/20 
          py-12 mt-20
          bg-surface-light dark:bg-black 
          backdrop-blur-xl
        "
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-primary mb-4 drop-shadow-[0_0_8px_#8AE06C]">
              AUTONOMY FINANCE
            </div>
            <p className="text-sm text-black/70 dark:text-white/60">
              Self-repaying credit powered by Story Protocol.
            </p>
          </div>

          <div>
            <div className="font-bold text-primary mb-4">PROTOCOL</div>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>
                <a href="#" className="hover:text-primary">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Audits
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-primary mb-4">COMMUNITY</div>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>
                <a href="#" className="hover:text-primary">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Mirror
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-primary mb-4">LEGAL</div>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>
                <a href="#" className="hover:text-primary">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
