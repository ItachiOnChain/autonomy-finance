import { Link } from "react-router-dom";
import { IPGallery } from "./IPGallery/IPGallery";

export function IPDashboard() {

  // Note: getRoyaltyBalance functionality removed as it was part of old mock implementation
  // This dashboard now focuses on displaying the IP Gallery

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
      <div className="flex justify-between items-center mb-12">
        <div>
          <p className="text-xs tracking-[0.32em] text-[#8AE06C]/85 uppercase">
            IP DASHBOARD
          </p>
          <h1 className="mt-2 text-sm md:text-base lg:text-lg tracking-[0.32em] font-bold uppercase">
            MANAGE YOUR ON-CHAIN IP ASSETS
          </h1>
        </div>

        <Link
          to="/ip-mint"
          className="
            px-5 py-3 rounded-lg font-bold tracking-wide text-black
            bg-[#8AE06C]
            border border-[#8AE06C]
            shadow-[0_0_18px_rgba(138,224,108,0.8)]
            hover:shadow-[0_0_28px_rgba(138,224,108,1)]
            transition
          "
        >
          + CREATE NEW IP
        </Link>
      </div>

      {/* IP GALLERY */}
      <div className="mb-12">
        <h2 className="text-base tracking-[0.2em] font-bold mb-6 text-white uppercase">
          YOUR IP ASSETS
        </h2>
        <IPGallery />
      </div>

      {/* INFO BOX */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-xs text-white/60 leading-relaxed">
          💡 Your minted IP assets are stored locally and on-chain. Each IP has a unique ID on Story Protocol.
          Click "View on Explorer" to see your IP on the Story blockchain explorer.
        </p>
      </div>
    </div>
  );
}
