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
    const [resolvedImageUri, setResolvedImageUri] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [royaltyBalance, setRoyaltyBalance] = useState<string>('0');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const { getRoyaltyBalance } = useRoyaltySimulator();

    const sourceUri = resolvedImageUri || ipAsset.thumbnailURI;
    const gatewayUrls = sourceUri ? ipfsToGatewayUrls(sourceUri) : [];
    const currentGatewayUrl = gatewayUrls[gatewayIndex];

    useEffect(() => {
        setGatewayIndex(0);
        setImageError(false);
        setResolvedImageUri(null);
    }, [ipAsset.thumbnailURI]);

    useEffect(() => {
        async function loadBalance() {
            if (showDetails) {
                setIsLoadingBalance(true);
                try {
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
        if (gatewayIndex < gatewayUrls.length - 1) {
            setTimeout(() => setGatewayIndex((prev) => prev + 1), 150);
        } else if (!resolvedImageUri) {
            checkIfMetadata();
        } else {
            setImageError(true);
        }
    };

    const checkIfMetadata = async () => {
        try {
            const urls = ipfsToGatewayUrls(ipAsset.thumbnailURI);
            if (urls.length === 0) return;

            const response = await fetch(urls[0]);
            const data = await response.json();

            if (data.image || data.mediaUrl) {
                setResolvedImageUri(data.image || data.mediaUrl);
                setGatewayIndex(0);
                setImageError(false);
            } else {
                setImageError(true);
            }
        } catch {
            setImageError(true);
        }
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const truncateMiddle = (str: string, maxLength = 24) => {
        if (str.length <= maxLength) return str;
        const start = str.slice(0, maxLength / 2);
        const end = str.slice(-maxLength / 2);
        return `${start}...${end}`;
    };

    const explorerUrl = generateExplorerURL(ipAsset.ipId);

    return (
        <>
            {/* CARD */}
            <div
                onClick={() => setShowDetails(true)}
                className="
                    group relative rounded-2xl p-6 cursor-pointer 
                    bg-black/40 backdrop-blur-xl 
                    border border-[#8AE06C]/20 
                    hover:border-[#8AE06C]/60
                    hover:shadow-[0_0_40px_rgba(138,224,108,0.35)]
                    shadow-[0_0_25px_rgba(138,224,108,0.08)]
                    transition-all duration-300
                "
            >
                <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-black/50 border border-white/5">
                    {currentGatewayUrl && !imageError ? (
                        <img
                            src={currentGatewayUrl}
                            alt={ipAsset.title}
                            onError={handleImageError}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover scale-[1.02] group-hover:scale-105 transition-all duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                            <div className="text-4xl">📄</div>
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-[#8AE06C] transition">
                        {ipAsset.title}
                    </h3>

                    {ipAsset.description && (
                        <p className="text-sm text-white/60 line-clamp-2">
                            {ipAsset.description}
                        </p>
                    )}

                    {/* TAGS */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-[#8AE06C]/10 border border-[#8AE06C]/40 rounded text-xs text-[#8AE06C] uppercase">
                            {ipAsset.ipType}
                        </span>

                        {ipAsset.royaltyPercent > 0 && (
                            <span className="px-2 py-1 bg-blue-600/10 border border-blue-600/40 rounded text-xs text-blue-300">
                                {ipAsset.royaltyPercent}% Royalty
                            </span>
                        )}

                        {ipAsset.hasCommercialLicense && (
                            <span className="px-2 py-1 bg-purple-600/10 border border-purple-600/40 rounded text-xs text-purple-300">
                                Commercial
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/40">IP ID:</span>
                        <code className="text-white/70 font-mono flex-1 truncate">
                            {truncateMiddle(ipAsset.ipId)}
                        </code>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(ipAsset.ipId, 'ipId');
                            }}
                            className="
                                px-2 py-1 rounded text-white/60 
                                bg-white/5 hover:bg-white/10 
                                hover:text-white transition
                            "
                        >
                            {copied === 'ipId' ? '✓' : '📋'}
                        </button>
                    </div>

                    <p className="text-xs text-white/40">Minted {new Date(ipAsset.mintedAt).toLocaleDateString()}</p>

                    <p className="text-xs text-[#8AE06C]/60 text-center group-hover:text-[#8AE06C] pt-2 transition">
                        Click for full details →
                    </p>
                </div>
            </div>

            {/* MODAL */}
            {showDetails && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDetails(false)}
                >
                    <div
                        className="
                            bg-[#02070d] border border-[#8AE06C]/40 
                            rounded-2xl p-6 sm:p-8 
                            w-full max-w-2xl 
                            max-h-[90vh] overflow-y-auto 
                            shadow-[0_0_40px_rgba(138,224,108,0.25)]
                        "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDetails(false)}
                            className="float-right text-white/60 hover:text-white text-3xl"
                        >
                            ×
                        </button>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            IP Asset Details
                        </h2>

                        {currentGatewayUrl && !imageError && (
                            <img
                                src={currentGatewayUrl}
                                alt={ipAsset.title}
                                className="w-full rounded-xl mb-6 border border-white/10"
                            />
                        )}

                        <div className="space-y-6 text-sm sm:text-base">
                            
                            {/* TITLE */}
                            <div>
                                <label className="text-xs text-white/40 uppercase">Title</label>
                                <p className="text-white font-medium">{ipAsset.title}</p>
                            </div>

                            {/* DESCRIPTION */}
                            {ipAsset.description && (
                                <div>
                                    <label className="text-xs text-white/40 uppercase">Description</label>
                                    <p className="text-white/80">{ipAsset.description}</p>
                                </div>
                            )}

                            {/* IP ID */}
                            <div>
                                <label className="text-xs text-white/40 uppercase">IP ID</label>
                                <div className="flex items-center gap-2 break-all">
                                    <code className="text-white/80 font-mono text-sm">{ipAsset.ipId}</code>
                                    <button
                                        onClick={() => handleCopy(ipAsset.ipId, 'ipId-modal')}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"
                                    >
                                        {copied === 'ipId-modal' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>

                            {/* TOKEN ID */}
                            <div>
                                <label className="text-xs text-white/40 uppercase">Token ID</label>
                                <div className="flex items-center gap-2 break-all">
                                    <code className="text-white/80 font-mono text-sm">
                                        {ipAsset.tokenId.toString()}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(ipAsset.tokenId.toString(), 'tokenId-modal')}
                                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"
                                    >
                                        {copied === 'tokenId-modal' ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>

                            {/* ROYALTY BALANCE */}
                            <div className="p-4 bg-[#8AE06C]/10 border border-[#8AE06C]/30 rounded-xl">
                                <label className="text-xs text-white/40 uppercase">Royalty Balance</label>
                                <div className="mt-2">
                                    {isLoadingBalance ? (
                                        <p className="text-white/60">Loading...</p>
                                    ) : (
                                        <p className="text-[#8AE06C] text-2xl font-bold">
                                            {parseFloat(royaltyBalance).toFixed(2)} tokens
                                        </p>
                                    )}
                                </div>
                                <p className="text-xs text-white/40 mt-1">
                                    Total accumulated royalties
                                </p>
                            </div>

                            {/* GRID INFO */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase">Type</label>
                                    <p className="text-white/80">{ipAsset.ipType}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase">Royalty</label>
                                    <p className="text-white/80">{ipAsset.royaltyPercent}%</p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase">Commercial License</label>
                                    <p className="text-white/80">
                                        {ipAsset.hasCommercialLicense ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs text-white/40 uppercase">Minted</label>
                                    <p className="text-white/80">
                                        {new Date(ipAsset.mintedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* URI */}
                            {ipAsset.thumbnailURI && (
                                <div>
                                    <label className="text-xs text-white/40 uppercase">Thumbnail URI</label>
                                    <code className="text-white/60 font-mono text-xs break-all block">
                                        {ipAsset.thumbnailURI}
                                    </code>
                                </div>
                            )}

                            {/* EXPLORER */}
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    block text-center py-3 rounded-lg 
                                    bg-[#8AE06C]/20 border border-[#8AE06C]/40 
                                    text-[#8AE06C] hover:bg-[#8AE06C]/30 
                                    hover:border-[#8AE06C]/60 transition
                                "
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
