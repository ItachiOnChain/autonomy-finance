// Custom hook for IP minting orchestration

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { IPAssetFormData, MintResult, IPAsset } from '../types/ipAsset';
import type { TransactionState } from '../types/transaction';
import { prepareIPMetadata } from '../utils/metadata';
import { generateExplorerURL } from '../utils/storyProtocol';
import { validateForm } from '../utils/validation';
import { useIPGallery } from './useIPGallery';
import { useStoryProtocol } from './useStoryProtocol';
import { useRoyaltySimulator } from './useRoyaltySimulator';

export function useIPMint() {
    const { address } = useAccount();
    const { mintIPAsset } = useStoryProtocol();
    const { registerIp } = useRoyaltySimulator();
    const { addIP } = useIPGallery();

    const [transactionState, setTransactionState] = useState<TransactionState>({
        status: 'idle',
        message: ''
    });

    const mintIP = useCallback(async (formData: IPAssetFormData): Promise<MintResult> => {
        if (!address) {
            throw new Error('Wallet not connected');
        }

        if (!formData.file) {
            throw new Error('File is required');
        }

        // Validate form
        const errors = validateForm({
            title: formData.title,
            description: formData.description,
            royaltyPercent: formData.royaltyPercent,
            file: formData.file,
            ipType: formData.ipType
        });

        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join(', '));
        }

        try {
            // Step 1: Upload file and metadata to IPFS
            setTransactionState({
                status: 'uploading',
                message: 'Uploading file to IPFS...'
            });

            const preparedMetadata = await prepareIPMetadata(
                formData.file,
                formData.title,
                formData.description,
                formData.ipType,
                address
            );

            // Step 2: Prepare transaction
            setTransactionState({
                status: 'preparing',
                message: 'Preparing metadata...'
            });

            // Step 3: Sign transaction
            setTransactionState({
                status: 'signing',
                message: 'Please sign transaction in wallet...'
            });

            // Step 4: Mint IP using Story Protocol
            const result = await mintIPAsset(
                preparedMetadata,
                formData.royaltyPercent,
                formData.enableCommercialLicense
            );

            // Step 5: Transaction pending
            setTransactionState({
                status: 'pending',
                message: 'Transaction pending...',
                txHash: result.txHash
            });

            // Step 6: Register IP in RoyaltyDistributor (CRITICAL FIX for "IP not registered" error)
            if (result.ipId) {
                try {
                    console.log('[useIPMint] Registering IP in RoyaltyDistributor...');

                    await registerIp(
                        result.ipId,
                        address,
                        formData.royaltyPercent || 10,
                        '0x0000000000000000000000000000000000000000' as `0x${string}`
                    );

                    console.log('[useIPMint] IP registered successfully in RoyaltyDistributor');
                } catch (regError) {
                    console.error('[useIPMint] Failed to register IP in RoyaltyDistributor:', regError);
                    // Don't fail the entire mint if registration fails
                    // User can register manually later or we can retry
                }
            }

            // Step 7: Success
            const explorerUrl = generateExplorerURL(result.ipId);
            setTransactionState({
                status: 'success',
                message: 'IP minted successfully!',
                txHash: result.txHash,
                ipId: result.ipId,
                explorerLink: explorerUrl
            });

            // Step 8: Add to gallery
            const newIP: IPAsset = {
                ipId: result.ipId,
                tokenId: result.tokenId || 0n,
                title: formData.title,
                description: formData.description,
                ipType: formData.ipType,
                thumbnailURI: preparedMetadata.imageURI,
                mediaUrl: preparedMetadata.imageURI,
                royaltyPercent: formData.royaltyPercent,
                hasCommercialLicense: formData.enableCommercialLicense,
                licenseTermsIds: result.licenseTermsIds,
                mintedAt: Date.now(),
                txHash: result.txHash,
                explorerUrl,
                creator: address
            };

            addIP(newIP);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setTransactionState({
                status: 'error',
                message: errorMessage,
                error: errorMessage
            });
            throw error;
        }
    }, [address, mintIPAsset, registerIp, addIP]);

    const reset = useCallback(() => {
        setTransactionState({
            status: 'idle',
            message: ''
        });
    }, []);

    return {
        mintIP,
        transactionState,
        reset
    };
}
