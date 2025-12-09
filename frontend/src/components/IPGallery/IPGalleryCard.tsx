// IP Gallery Card Component with IPFS fallback, copy functionality, and details modal

import { useState, useEffect } from 'react';
import type { IPAsset } from '../../types/ipAsset';
import { ipfsToGatewayUrls } from '../../utils/ipfs';
import { generateExplorerURL } from '../../utils/storyProtocol';
import { useRoyaltySimulator } from '../../hooks/useRoyaltySimulator';

interface IPGalleryCardProps {
    ipAsset: IPAsset;
}

export function IPGalleryCard({ ipAsset }: IPGalleryCardProps) {
    const [gatewayIndex, setGatewayIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [royaltyBalance, setRoyaltyBalance] = useState<string>('0');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const { getRoyaltyBalance } = useRoyaltySimulator();

    // Get all gateway URLs for fallback
    const gatewayUrls = ipAsset.thumbnailURI ? ipfsToGatewayUrls(ipAsset.thumbnailURI) : [];
    const currentGatewayUrl = gatewayUrls[gatewayIndex];

    // Reset gateway index when ipAsset changes
    useEffect(() => {
        setGatewayIndex(0);
        setImageError(false);
    }, [ipAsset.thumbnailURI]);

    // Load royalty balance when details modal opens
    useEffect(() => {
        async function loadBalance() {
            if (showDetails) {
                setIsLoadingBalance(true);
                try {
                    // CRITICAL FIX: Query balance by IP ID, not creator address
                    const balance = await getRoyaltyBalance(ipAsset.ipId);
                    setRoyaltyBalance(balance);
                } catch (error) {
                    console.error('Failed to load royalty balance:', error);
                    setRoyaltyBalance('0');
                } finally {
                    setIsLoadingBalance(false);
                }
            }
        }
        loadBalance();
    }, [showDetails, ipAsset.ipId, getRoyaltyBalance]);

    const handleImageError = () => {
        // Try next gateway after short delay
        if (gatewayIndex < gatewayUrls.length - 1) {
            setTimeout(() => {
                setGatewayIndex(prev => prev + 1);
            }, 150);
        } else {
            // All gateways failed
            setImageError(true);
            console.warn('[IPGalleryCard] All IPFS gateways failed for:', ipAsset.thumbnailURI);
        }
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const truncateMiddle = (str: string, maxLength: number = 24) => {
        if (str.length <= maxLength) return str;
        const start = str.slice(0, maxLength / 2);
        const end = str.slice(-maxLength / 2);
        return `${start}...${end}`;
    };

    const explorerUrl = generateExplorerURL(ipAsset.ipId);

    return (
        <>
            {/* Card */}
            <div
                onClick={() => setShowDetails(true)}
                className="group relative bg-black/50 backdrop-blur-xl border border-[#8AE06C]/25 rounded-2xl p-6 hover:border-[#8AE06C]/60 hover:shadow-[0_0_30px_rgba(138,224,108,0.3)] transition-all duration-300 cursor-pointer"
            >
                {/* Thumbnail */}
                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-black/40">
                    {currentGatewayUrl && !imageError ? (
                        <img
                            src={currentGatewayUrl}
                            alt={ipAsset.title}
                            onError={handleImageError}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                            <div className="text-4xl">📄</div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-white line-clamp-2">{ipAsset.title}</h3>

                    {/* Description */}
                    {ipAsset.description && (
                        <p className="text-sm text-white/60 line-clamp-2">{ipAsset.description}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded text-xs text-[#8AE06C] uppercase">
                            {ipAsset.ipType}
                        </span>
                        {ipAsset.royaltyPercent > 0 && (
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                                {ipAsset.royaltyPercent}% Royalty
                            </span>
                        )}
                        {ipAsset.hasCommercialLicense && (
                            <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-300">
                                COMMERCIAL
                            </span>
                        )}
                    </div>

                    {/* IP ID with copy button */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/40">IP ID:</span>
                        <code className="text-white/70 font-mono flex-1 truncate" title={ipAsset.ipId}>
                            {truncateMiddle(ipAsset.ipId, 24)}
                        </code>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(ipAsset.ipId, 'ipId');
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition"
                            title="Copy IP ID"
                        >
                            {copied === 'ipId' ? '✓' : '📋'}
                        </button>
                    </div>

                    {/* Minted date */}
                    <p className="text-xs text-white/40">
                        Minted {new Date(ipAsset.mintedAt).toLocaleDateString()}
                    </p>

                    {/* Click to view details hint */}
                    <p className="text-xs text-[#8AE06C]/60 text-center pt-2">
                        Click for full details →
                    </p>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDetails(false)}
                >
                    <div
                        className="bg-[#02060b] border border-[#8AE06C]/40 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDetails(false)}
                            className="float-right text-white/60 hover:text-white text-2xl"
                        >
                            ×
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">IP Asset Details</h2>

                        {/* Full image */}
                        {currentGatewayUrl && !imageError && (
                            <img
                                src={currentGatewayUrl}
                                alt={ipAsset.title}
                                className="w-full rounded-lg mb-6 border border-white/10"
                            />
                        )}

                        {/* Full details */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider">Title</label>
                                <p className="text-white font-medium">{ipAsset.title}</p>
                            </div>

                            {ipAsset.description && (
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Description</label>
                                    <p className="text-white/80">{ipAsset.description}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider">IP ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-white/80 font-mono text-sm break-all">{ipAsset.ipId}</code>
                                    <button
                                        onClick={() => handleCopy(ipAsset.ipId, 'ipId-modal')}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition"
                                    >
                                        {copied === 'ipId-modal' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider">Token ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-white/80 font-mono text-sm break-all">{ipAsset.tokenId.toString()}</code>
                                    <button
                                        onClick={() => handleCopy(ipAsset.tokenId.toString(), 'tokenId-modal')}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition"
                                    >
                                        {copied === 'tokenId-modal' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>

                            {/* CRITICAL FIX: Add Royalty Balance Display */}
                            <div className="p-4 bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-lg">
                                <label className="text-xs text-white/40 uppercase tracking-wider">Royalty Balance</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {isLoadingBalance ? (
                                        <p className="text-white/60">Loading...</p>
                                    ) : (
                                        <p className="text-[#8AE06C] font-bold text-2xl">{parseFloat(royaltyBalance).toFixed(2)} tokens</p>
                                    )}
                                </div>
                                <p className="text-xs text-white/40 mt-1">Total accumulated royalty tokens for this IP</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Type</label>
                                    <p className="text-white/80">{ipAsset.ipType}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Royalty</label>
                                    <p className="text-white/80">{ipAsset.royaltyPercent}%</p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Commercial License</label>
                                    <p className="text-white/80">{ipAsset.hasCommercialLicense ? 'Enabled' : 'Disabled'}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Minted</label>
                                    <p className="text-white/80">{new Date(ipAsset.mintedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {ipAsset.thumbnailURI && (
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Thumbnail URI</label>
                                    <code className="text-white/60 font-mono text-xs break-all block">{ipAsset.thumbnailURI}</code>
                                </div>
                            )}

                            {/* Explorer link */}
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-3 bg-[#8AE06C]/20 border border-[#8AE06C]/40 rounded-lg text-[#8AE06C] hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]/60 transition text-center font-medium"
                            >
                                View on Explorer →
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
