import React from "react";
import { useTheme } from "../App";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";
import { DashboardFooter } from "./DashboardFooter";
import { MarketingFooter } from "./MarketingFooter";

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
  const location = useLocation();
  const isLanding = location.pathname === "/";
  // Debug log
  // console.log('[Layout] Path:', location.pathname, 'isLanding:', isLanding);


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

      {/* FOOTER - Route Aware */}
      {isLanding ? <MarketingFooter /> : <DashboardFooter />}
    </div>
  );
};
