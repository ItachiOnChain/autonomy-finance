// IP Minting Page - Complete rewrite with Story Protocol SDK integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { IPMintForm } from "../components/IPMint/IPMintForm";
import { TransactionStatus } from "../components/IPMint/TransactionStatus";
import { useIPMint } from "../hooks/useIPMint";
import type { IPAssetFormData } from "../types/ipAsset";

export function IPMint() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();
  const { mintIP, transactionState, reset } = useIPMint();

  const [formData, setFormData] = useState<IPAssetFormData>({
    title: "",
    description: "",
    ipType: "image",
    file: null,
    royaltyPercent: 10, // Default 10% royalty
    enableCommercialLicense: false
  });

  const handleSubmit = async (data: IPAssetFormData) => {
    try {
      await mintIP(data);
      // Success - transaction state will show success message
    } catch (error) {
      console.error("[IPMint] Minting failed:", error);
      // Error state is handled by useIPMint
    }
  };

  const handleViewGallery = () => {
    navigate("/ip-dashboard");
  };

  const handleMintAnother = () => {
    reset();
    setFormData({
      title: "",
      description: "",
      ipType: "image",
      file: null,
      royaltyPercent: 10,
      enableCommercialLicense: false
    });
  };

  // Check if on correct network
  const isCorrectNetwork = chainId === 1315;

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
        MINT YOUR IP ASSET
      </h1>

      <h2 className="text-center text-sm md:text-base lg:text-lg tracking-[0.32em] font-bold uppercase text-white mb-12">
        REGISTER YOUR CREATIVE IP ON STORY PROTOCOL
      </h2>

      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 shadow-[0_0_30px_rgba(138,224,108,0.25)]">

        {/* WALLET NOT CONNECTED */}
        {!isConnected && (
          <div className="text-center py-12">
            <p className="text-white/70 mb-6">Please connect your wallet to mint IP assets</p>
            <button className="px-6 py-3 rounded-lg font-bold tracking-wide bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C] hover:bg-[#8AE06C]/30 hover:border-[#8AE06C] hover:shadow-[0_0_22px_rgba(138,224,108,0.8)] transition">
              Connect Wallet
            </button>
          </div>
        )}

        {/* WRONG NETWORK */}
        {isConnected && !isCorrectNetwork && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 p-6 rounded-xl shadow-[0_0_12px_rgba(255,0,0,0.4)]">
            <p className="font-bold mb-2">Wrong Network</p>
            <p className="text-sm mb-4">
              Please switch to Story Aeneid Testnet (Chain ID: 1315)
            </p>
            <p className="text-xs text-red-200/70">
              Current Chain ID: {chainId}
            </p>
          </div>
        )}

        {/* MINTING FORM */}
        {isConnected && isCorrectNetwork && (
          <>
            {transactionState.status === 'idle' || transactionState.status === 'error' ? (
              <IPMintForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={transactionState.status !== 'idle'}
              />
            ) : (
              <TransactionStatus
                state={transactionState}
                onViewGallery={handleViewGallery}
                onMintAnother={handleMintAnother}
              />
            )}
          </>
        )}
      </div>

      {/* INFO BOX */}
      <div className="max-w-2xl mx-auto mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-xs text-white/60 leading-relaxed">
          💡 <span className="font-bold text-[#8AE06C]">Story Protocol</span> enables you to register your creative works as on-chain IP assets.
          Set royalty percentages and enable commercial licensing to monetize your IP.
        </p>
      </div>
    </div>
  );
}
