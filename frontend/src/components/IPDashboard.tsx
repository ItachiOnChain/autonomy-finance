import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { IPSimulator } from "./IPSimulator";
import { useStoryProtocol } from "../hooks/useStoryProtocol";
import { ROYALTY_TOKENS, type RoyaltyToken } from "../config/royaltyTokens";

interface TokenBalance {
  token: RoyaltyToken;
  balance: string;
  balanceRaw: bigint;
}

export function IPDashboard() {
  const { getRoyaltyBalance } = useStoryProtocol();

  const [ipaId, setIpaId] = useState("");
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = async () => {
    if (!ipaId) return;
    setIsLoading(true);
    try {
      const balancePromises = ROYALTY_TOKENS.map(async (token) => {
        const balanceRaw = await getRoyaltyBalance(ipaId, token.address);
        const balance = formatUnits(balanceRaw, token.decimals);
        return { token, balance, balanceRaw };
      });

      const balances = await Promise.all(balancePromises);
      setTokenBalances(balances);
    } catch (err) {
      console.error(err);
      setTokenBalances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ipaId) return;
    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [ipaId]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          <div
            className="
              bg-black/50 backdrop-blur-xl 
              border border-[#8AE06C]/25 
              rounded-2xl p-8
              shadow-[0_0_30px_rgba(138,224,108,0.25)]
            "
          >
            {/* SECTION TITLE */}
            <h2 className="text-base tracking-[0.2em] font-bold mb-6 text-white uppercase">
              VIEW IP ASSET
            </h2>

            {/* INPUT FIELD */}
            <div className="mb-6">
              <label className="block text-xs tracking-wider text-white/70 mb-2">
                ENTER IPA ID
              </label>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={ipaId}
                  onChange={(e) => setIpaId(e.target.value)}
                  className="
                    flex-grow p-3 rounded-lg text-sm 
                    bg-black/40 border border-white/20 
                    focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
                    outline-none transition text-white
                  "
                  placeholder="0x..."
                />

                <button
                  onClick={fetchBalance}
                  disabled={isLoading || !ipaId}
                  className="
                    px-4 py-2 rounded-lg text-sm font-bold
                    bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                    hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]
                    hover:shadow-[0_0_16px_rgba(138,224,108,0.8)]
                    transition disabled:opacity-40
                  "
                >
                  {isLoading ? "..." : "Load"}
                </button>
              </div>
            </div>

            {/* DISPLAY DETAILS */}
            {ipaId && (
              <div className="space-y-6">
                {/* IPA ID BOX */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
                  <p className="text-xs text-white/50 tracking-wider mb-1">
                    IPA ID
                  </p>
                  <p className="font-mono text-sm break-all text-white">
                    {ipaId}
                  </p>
                </div>

                {/* BALANCES */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
                  <p className="text-xs text-white/50 tracking-wider mb-3">
                    ROYALTY BALANCES
                  </p>

                  {isLoading ? (
                    <p className="text-sm text-white/60">Loading...</p>
                  ) : tokenBalances.length === 0 ? (
                    <p className="text-sm text-white/60">No balances loaded</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {tokenBalances.map(({ token, balance, balanceRaw }) => {
                        const active = balanceRaw > 0n;

                        return (
                          <div
                            key={token.symbol}
                            className={`
                              p-4 rounded-xl
                              border transition
                              ${
                                active
                                  ? "bg-[#8AE06C]/10 border-[#8AE06C]/40 shadow-[0_0_14px_rgba(138,224,108,0.3)]"
                                  : "bg-black/30 border-white/10"
                              }
                            `}
                          >
                            <p className="text-xs text-white/50 uppercase tracking-wider">
                              {token.symbol}
                            </p>
                            <p
                              className={`
                                mt-1 font-mono text-lg
                                ${active ? "text-[#8AE06C]" : "text-white/40"}
                              `}
                            >
                              {parseFloat(balance) > 0 ? balance : "0"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* INFO BOX */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs text-white/60 leading-relaxed">
                    💡 This dashboard displays royalty balances for all supported
                    tokens. Lock your IP on the asset page to enable automatic
                    repayment using royalties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <IPSimulator onRoyaltyPaid={fetchBalance} />
        </div>
      </div>
    </div>
  );
}
