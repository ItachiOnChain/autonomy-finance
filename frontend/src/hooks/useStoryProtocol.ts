// Story Protocol SDK integration hook
// This hook provides functions to interact with Story Protocol on Aeneid Testnet

import { useState, useCallback, useMemo } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { StoryClient, type StoryConfig } from '@story-protocol/core-sdk';
import { custom, type Address } from 'viem';
import { STORY_CONTRACTS, WIP_TOKEN_ADDRESS } from '../constants/story';
import type { PreparedMetadata } from '../types/metadata';
import type { MintResult } from '../types/ipAsset';

export function useStoryProtocol() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize Story SDK client
    const storyClient = useMemo(() => {
        if (!walletClient || chainId !== 1315) {
            return null;
        }

        try {
            const config: StoryConfig = {
                wallet: walletClient,
                transport: custom(walletClient.transport),
                chainId: 'aeneid' // Story SDK uses string 'aeneid' for testnet
            };

            return StoryClient.newClient(config);
        } catch (err) {
            console.error('[Story SDK] Failed to initialize client:', err);
            return null;
        }
    }, [walletClient, chainId]);

    /**
     * Mint IP Asset using Story Protocol SDK
     * @param preparedMetadata - Metadata URIs and hashes from prepareIPMetadata()
     * @param royaltyPercent - Royalty percentage (0-10)
     * @param enableCommercialLicense - Whether to attach commercial license
     * @returns Mint result with txHash, ipId, tokenId, and licenseTermsIds
     */
    const mintIPAsset = useCallback(async (
        preparedMetadata: PreparedMetadata,
        royaltyPercent: number,
        enableCommercialLicense: boolean
    ): Promise<MintResult> => {
        if (!address || !storyClient) {
            throw new Error('Wallet not connected or Story client not initialized');
        }

        if (chainId !== 1315) {
            throw new Error('Please switch to Story Aeneid Testnet (Chain ID: 1315)');
        }

        setIsLoading(true);
        setError(null);

        try {
            // Validate royalty percentage (Story SDK expects 0-100 percent, NOT basis points)
            if (royaltyPercent < 0 || royaltyPercent > 100) {
                throw new Error('Commercial royalty must be between 0 and 100 (percent).');
            }

            console.log('[Story SDK] Minting IP asset...', {
                royaltyPercent,
                enableCommercialLicense,
                metadata: preparedMetadata
            });

            // NOTE: Story SDK expects commercialRevShare as PERCENTAGE (0-100), not basis points
            // Do NOT multiply by 100 for commercialRevShare field
            const commercialRevSharePercent = Math.round(royaltyPercent);

            // Prepare license terms if commercial license is enabled
            const licenseTermsData = enableCommercialLicense ? [
                {
                    terms: {
                        transferable: true,
                        royaltyPolicy: STORY_CONTRACTS.RoyaltyPolicyLAP,
                        defaultMintingFee: 0n,
                        expiration: 0n,
                        commercialUse: true,
                        commercialAttribution: false,
                        commercializerChecker: "0x0000000000000000000000000000000000000000" as Address,
                        commercializerCheckerData: "0x" as `0x${string}`,
                        // CRITICAL: Story SDK expects percentage (0-100), NOT basis points
                        // Passing 50 means 50%, NOT 5000 bps
                        commercialRevShare: commercialRevSharePercent,
                        commercialRevCeiling: 0n,
                        derivativesAllowed: true,
                        derivativesAttribution: true,
                        derivativesApproval: false,
                        derivativesReciprocal: true,
                        derivativeRevCeiling: 0n,
                        currency: WIP_TOKEN_ADDRESS as Address,
                        uri: ""
                    }
                }
            ] : undefined;

            // Call Story SDK registerIpAsset
            const result = await storyClient.ipAsset.registerIpAsset({
                nft: {
                    type: "mint" as const,
                    spgNftContract: STORY_CONTRACTS.SPG_NFT_CONTRACT as Address
                },
                ipMetadata: {
                    ipMetadataURI: preparedMetadata.ipMetadataURI,
                    ipMetadataHash: preparedMetadata.ipMetadataHash as `0x${string}`,
                    nftMetadataURI: preparedMetadata.nftMetadataURI,
                    nftMetadataHash: preparedMetadata.nftMetadataHash as `0x${string}`
                },
                licenseTermsData
            });

            console.log('[Story SDK] IP minted successfully:', result);

            return {
                txHash: result.txHash || '',
                ipId: result.ipId || '',
                tokenId: result.tokenId,
                // Story SDK may return licenseTermsId or licenseTermsIds depending on version
                licenseTermsIds: (result as any).licenseTermsId
                    ? [(result as any).licenseTermsId]
                    : (result as any).licenseTermsIds || undefined
            };
        } catch (err: any) {
            console.error('[Story SDK] Mint error:', err);

            // Provide user-friendly error messages
            let errorMessage = 'Failed to mint IP asset';
            if (err.message) {
                if (err.message.includes('commercialRevShare')) {
                    errorMessage = 'Invalid royalty percentage. Please enter a value between 0 and 100.';
                } else if (err.message.includes('license')) {
                    errorMessage = 'Failed to attach license terms. Please review your royalty and license settings.';
                } else {
                    errorMessage = err.message;
                }
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [address, storyClient, chainId]);

    /**
     * Check if wallet is connected and on correct network
     */
    const isReady = useMemo(() => {
        return !!(address && storyClient && chainId === 1315);
    }, [address, storyClient, chainId]);

    /**
     * Get all IP assets owned by the connected wallet
     * NOTE: Story SDK doesn't provide a direct method to query IPs by owner
     * For now, returning empty array - users will manually input IP IDs
     * @returns Array of IP assets (currently empty, manual input used instead)
     */
    const getOwnedIPs = useCallback(async () => {
        console.warn('[Story SDK] getOwnedIPs not implemented - using manual IP input');
        return [];
    }, []);

    return {
        mintIPAsset,
        getOwnedIPs,
        isLoading,
        error,
        isReady,
        chainId,
        storyClient
    };
}
