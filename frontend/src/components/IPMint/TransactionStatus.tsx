// Transaction Status Component

import type { TransactionState } from "../../types/transaction";
import { generateTxExplorerURL } from "../../utils/storyProtocol";

interface TransactionStatusProps {
    state: TransactionState;
    onViewGallery: () => void;
    onMintAnother: () => void;
}

export function TransactionStatus({ state, onViewGallery, onMintAnother }: TransactionStatusProps) {
    const getStatusIcon = () => {
        switch (state.status) {
            case 'uploading':
            case 'preparing':
            case 'signing':
            case 'pending':
                return '⏳';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (state.status) {
            case 'success':
                return 'bg-[#8AE06C]/10 border-[#8AE06C]/50 text-[#8AE06C]';
            case 'error':
                return 'bg-red-500/10 border-red-500/50 text-red-300';
            default:
                return 'bg-white/5 border-white/20 text-white/70';
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Box */}
            <div className={`p-6 rounded-xl border shadow-[0_0_20px_rgba(138,224,108,0.2)] ${getStatusColor()}`}>
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{getStatusIcon()}</span>
                    <div className="flex-1">
                        <p className="font-bold tracking-wide uppercase">{state.message}</p>

                        {state.txHash && (
                            <p className="text-xs mt-2 opacity-70 break-all">
                                Tx: {state.txHash.slice(0, 10)}...{state.txHash.slice(-8)}
                            </p>
                        )}

                        {state.ipId && (
                            <p className="text-xs mt-1 opacity-70 break-all">
                                IP ID: {state.ipId.slice(0, 10)}...{state.ipId.slice(-8)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading Animation */}
            {(state.status === 'uploading' || state.status === 'preparing' || state.status === 'signing' || state.status === 'pending') && (
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-[#8AE06C]/20 border-t-[#8AE06C] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Success Actions */}
            {state.status === 'success' && (
                <div className="space-y-3">
                    {state.explorerLink && (
                        <a
                            href={state.explorerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                block w-full py-3 rounded-lg font-bold tracking-wide text-center
                bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
                hover:bg-[#8AE06C]/30 hover:border-[#8AE06C] 
                hover:shadow-[0_0_22px_rgba(138,224,108,0.8)]
                transition
              "
                        >
                            View on Story Explorer →
                        </a>
                    )}

                    <button
                        onClick={onViewGallery}
                        className="
              w-full py-3 rounded-lg font-bold tracking-wide
              bg-white/5 border border-white/20 text-white/70
              hover:bg-white/10 hover:border-white/30
              transition
            "
                    >
                        View IP Gallery
                    </button>

                    <button
                        onClick={onMintAnother}
                        className="
              w-full py-3 rounded-lg font-bold tracking-wide
              bg-white/5 border border-white/20 text-white/70
              hover:bg-white/10 hover:border-white/30
              transition
            "
                    >
                        Mint Another IP
                    </button>
                </div>
            )}

            {/* Error Actions */}
            {state.status === 'error' && (
                <div className="space-y-3">
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-200">{state.error}</p>
                    </div>

                    <button
                        onClick={onMintAnother}
                        className="
              w-full py-3 rounded-lg font-bold tracking-wide
              bg-red-500/20 border border-red-500/40 text-red-300
              hover:bg-red-500/30 hover:border-red-500
              transition
            "
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Transaction Link */}
            {state.txHash && state.status !== 'error' && (
                <a
                    href={generateTxExplorerURL(state.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-white/40 hover:text-[#8AE06C] transition"
                >
                    View Transaction Details →
                </a>
            )}
        </div>
    );
}
