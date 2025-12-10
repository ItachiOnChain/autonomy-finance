import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "../App";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";
import { DashboardFooter } from "./DashboardFooter";
import { MarketingFooter } from "./MarketingFooter";

interface LayoutProps {
  children: React.ReactNode;
}

import { useDisconnect } from "wagmi";

const Divider = () => <span className="text-primary/40 select-none">|</span>;

const NavItem = ({ to, children }: any) => (
  <Link
    to={to}
    className="hover:text-primary transition drop-shadow-[0_0_4px_rgba(138,224,108,0.25)] font-mono"
  >
    {children}
  </Link>
);

/* CUSTOM CONNECT BUTTON WITH DISCONNECT */
const NavConnectButton = () => {
  const { disconnect } = useDisconnect();
  const [showDisconnect, setShowDisconnect] = React.useState(false);

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, account, mounted }) => {
        const connected = mounted && account;

        return (
          <div className="relative">
            <button
              onClick={() => {
                if (connected) {
                  setShowDisconnect(!showDisconnect);
                } else {
                  openConnectModal();
                }
              }}
              className={`
                px-4 py-2 font-mono text-xs lg:text-sm rounded-md border border-[#8AE06C]
                ${connected ? "bg-black text-[#8AE06C]" : "bg-[#8AE06C] text-black"}
                hover:shadow-[0_0_14px_rgba(138,224,108,0.8)]
                hover:bg-[#a4f17f] transition-all
              `}
            >
              {connected ? "CONNECTED" : "CONNECT WALLET"}
            </button>

            {/* Disconnect Popover */}
            {showDisconnect && connected && (
              <div className="absolute right-0 mt-2 w-48 bg-black border border-[#8AE06C]/30 rounded-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-white/80 text-xs font-mono mb-3 text-center">
                  Do you want to disconnect?
                </p>
                <button
                  onClick={() => {
                    disconnect();
                    setShowDisconnect(false);
                  }}
                  className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-md text-xs font-mono transition-colors"
                >
                  DISCONNECT
                </button>
              </div>
            )}

            {/* Click outside closer (simple overlay) */}
            {showDisconnect && (
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowDisconnect(false)} />
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

/* MAIN LAYOUT */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useTheme();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);


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
            <NavItem to="/core">Dashboard</NavItem>
            <Divider />
            <NavItem to="/ip-mint">Mint IP</NavItem>
            <Divider />
            <NavItem to="/ip-dashboard">IP Gallery</NavItem>
            <Divider />
            <NavItem to="/royalty-simulator">Royalty Simulator</NavItem>
          </nav>

          {/* WALLET BTN */}
          <div className="flex items-center gap-4">
            <NavConnectButton />

            {/* MOBILE MENU TOGGLE */}
            <button
              className="md:hidden text-white/70 hover:text-[#8AE06C] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-5 duration-200">
            <nav className="flex flex-col gap-4 text-base font-mono text-white/80">
              <NavItem to="/core">Dashboard</NavItem>
              <NavItem to="/ip-mint">Mint IP</NavItem>
              <NavItem to="/ip-dashboard">IP Gallery</NavItem>
              <NavItem to="/royalty-simulator">Royalty Simulator</NavItem>
            </nav>
          </div>
        )}
      </header>


      {/* MAIN */}
      <main className="flex-grow max-w-7xl mx-auto w-full pb-0">{children}</main>

      {/* FOOTER - Route Aware */}
      {isLanding ? <MarketingFooter /> : <DashboardFooter />}
    </div>
  );
};
