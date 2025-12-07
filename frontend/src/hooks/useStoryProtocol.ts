import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseEther, parseUnits, type Address } from 'viem';
import { getContracts } from '../config/contracts';

// Types
export interface IPMetadata {
    title: string;
    description: string;
    image: File | null;
    attributes?: Record<string, string>;
}

export interface RoyaltyPayment {
    ipaId: string;
    token: string;
    amount: string;
    timestamp: number;
    txHash: string;
}

export function useStoryProtocol() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();
    const contracts = getContracts(chainId);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Safe check for contracts
    if (!contracts) {
        console.error('[useStoryProtocol] No contracts found for current chain');
    }

    // Phase detection
    const isPhase1 = import.meta.env.VITE_NETWORK !== 'story';

    // Mock IPFS upload (Phase 1) or Real (Phase 2)
    const uploadMetadata = async (_metadata: IPMetadata): Promise<string> => {
        // In a real app, this would upload to IPFS via Infura/Pinata
        // For Phase 1, we just return a mock hash
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        return `ipfs://QmMockHash${Date.now()}`;
    };

    // Mint IP Asset
    const mintIP = useCallback(async (metadata: IPMetadata) => {
        if (!address || !walletClient) {
            throw new Error('Wallet not connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const metadataUri = await uploadMetadata(metadata);

            let txHash;
            let ipaId;

            if (isPhase1) {
                if (!contracts?.MockIPAssetRegistry) {
                    throw new Error('MockIPAssetRegistry not configured for this network');
                }

                // Call MockIPAssetRegistry
                const hash = await walletClient.writeContract({
                    address: contracts.MockIPAssetRegistry.address as Address,
                    abi: contracts.MockIPAssetRegistry.abi,
                    functionName: 'mintIP',
                    args: [address, metadataUri],
                });
                txHash = hash;

                // Wait for receipt to get IPA ID
                if (!publicClient) throw new Error('Public client not available');
                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                // Parse logs to find IPMinted event
                // Get IPA ID from event logs (first topic after event signature)
                ipaId = receipt.logs[0].topics[1] as string;

                // Auto-create vault for this IPA
                const vaultHash = await walletClient.writeContract({
                    address: contracts.MockRoyaltyVault.address as Address,
                    abi: contracts.MockRoyaltyVault.abi,
                    functionName: 'createVault',
                    args: [ipaId],
                });
                await publicClient.waitForTransactionReceipt({ hash: vaultHash });
            } else {
                // Call Real Story Protocol SDK
                // const client = StoryClient.newClient(config);
                // const response = await client.ipAsset.mint(...)
                throw new Error('Phase 2 not implemented yet');
            }

            return { txHash, ipaId };
        } catch (err: any) {
            console.error('Mint error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, publicClient, isPhase1]);

    // Lock IPA for Auto-Repay (not as collateral)
    const lockIPA = useCallback(async (ipaId: string) => {
        if (!address || !walletClient) throw new Error('Wallet not connected');

        setIsLoading(true);
        setError(null);

        try {
            // Convert string IP ID to bytes32 if needed
            const ipaIdBytes32 = ensureBytes32(ipaId);

            if (!contracts?.IP_MANAGER) {
                throw new Error('IP_MANAGER not configured for this network');
            }

            // Lock IPA with zero collateral value (not used as collateral, only for auto-repay)
            const hash = await walletClient.writeContract({
                address: contracts.IP_MANAGER.address as Address,
                abi: contracts.IP_MANAGER.abi,
                functionName: 'lockIPA',
                args: [ipaIdBytes32, address, 0n], // 0 collateral value
            });

            if (!publicClient) throw new Error('Public client not available');
            await publicClient.waitForTransactionReceipt({ hash });
            return hash;
        } catch (err: any) {
            console.error('Lock IPA error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, publicClient]);

    // Helper function to ensure proper bytes32 format
    const ensureBytes32 = (input: string): string => {
        // Remove 0x prefix if present
        let hex = input.startsWith('0x') ? input.slice(2) : input;

        // Pad to 64 characters (32 bytes)
        hex = hex.padStart(64, '0');

        // Add 0x prefix
        return `0x${hex}`;
    };

    // Pay Royalty (Simulation) - Fixed to handle vault creation and all tokens
    const payRoyalty = useCallback(async (ipaId: string, token: string, amount: string) => {
        if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

        setIsLoading(true);
        setError(null);

        try {
            // Get token decimals
            const decimals = await publicClient.readContract({
                address: token as Address,
                abi: contracts?.MockRoyaltyToken?.abi || [], // All ERC20s have decimals()
                functionName: 'decimals',
            }) as number;

            const amountWei = parseUnits(amount, decimals);

            // Ensure proper bytes32 format
            const ipaIdBytes32 = ensureBytes32(ipaId);

            // Check if vault exists, create if not
            if (!contracts?.MockRoyaltyVault) {
                throw new Error('MockRoyaltyVault not configured for this network');
            }

            const vaultAddress = await publicClient.readContract({
                address: contracts.MockRoyaltyVault.address as Address,
                abi: contracts.MockRoyaltyVault.abi,
                functionName: 'getVaultAddress',
                args: [ipaIdBytes32],
            });

            if (!vaultAddress || vaultAddress === '0x0000000000000000000000000000000000000000') {
                const vaultHash = await walletClient.writeContract({
                    address: contracts.MockRoyaltyVault.address as Address,
                    abi: contracts.MockRoyaltyVault.abi,
                    functionName: 'createVault',
                    args: [ipaIdBytes32],
                });
                await publicClient.waitForTransactionReceipt({ hash: vaultHash });
            }

            // Check allowance first
            const allowance = await publicClient.readContract({
                address: token as Address,
                abi: contracts?.MockRoyaltyToken?.abi || [], // All ERC20s have allowance()
                functionName: 'allowance',
                args: [address, contracts.MockRoyaltyVault.address],
            }) as bigint;

            // Only approve if needed
            if (allowance < amountWei) {
                const approveHash = await walletClient.writeContract({
                    address: token as Address,
                    abi: contracts?.MockRoyaltyToken?.abi || [], // All ERC20s have approve()
                    functionName: 'approve',
                    args: [contracts.MockRoyaltyVault.address, amountWei],
                });
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }

            // Pay royalty
            const hash = await walletClient.writeContract({
                address: contracts.MockRoyaltyVault.address as Address,
                abi: contracts.MockRoyaltyVault.abi,
                functionName: 'payRoyalty',
                args: [ipaIdBytes32, token, amountWei],
            });

            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (err: any) {
            console.error('Pay royalty error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, publicClient]);

    // Claim Royalty
    const claimRoyalty = useCallback(async (ipaId: string, token: string) => {
        if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

        setIsLoading(true);
        setError(null);

        try {
            // Convert string IP ID to bytes32 if needed
            const ipaIdBytes32 = ensureBytes32(ipaId);

            if (!contracts?.MockRoyaltyVault) {
                throw new Error('MockRoyaltyVault not configured for this network');
            }

            const hash = await walletClient.writeContract({
                address: contracts.MockRoyaltyVault.address as Address,
                abi: contracts.MockRoyaltyVault.abi,
                functionName: 'claimRoyalty',
                args: [ipaIdBytes32, address, token],
            });

            await publicClient.waitForTransactionReceipt({ hash });
            return hash;
        } catch (err: any) {
            console.error('Claim royalty error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, publicClient]);

    // Get Royalty Balance (read function)
    const getRoyaltyBalance = useCallback(async (ipaId: string, token: string): Promise<bigint> => {
        if (!publicClient) throw new Error('Public client not available');

        try {
            // Convert string IP ID to bytes32 if needed
            const ipaIdBytes32 = ensureBytes32(ipaId);

            if (!contracts?.MockRoyaltyVault) {
                return 0n;
            }

            const balance = await publicClient.readContract({
                address: contracts.MockRoyaltyVault.address as Address,
                abi: contracts.MockRoyaltyVault.abi,
                functionName: 'getRoyaltyBalance',
                args: [ipaIdBytes32, token],
            });

            return balance as bigint;
        } catch (err: any) {
            console.error('Get royalty balance error:', err);
            return 0n;
        }
    }, [publicClient]);

    // Check if IPA is locked
    const isIPALocked = useCallback(async (ipaId: string): Promise<boolean> => {
        if (!publicClient || !contracts?.IP_MANAGER) return false;
        try {
            const ipaIdBytes32 = ensureBytes32(ipaId);
            const locked = await publicClient.readContract({
                address: contracts.IP_MANAGER.address as Address,
                abi: contracts.IP_MANAGER.abi,
                functionName: 'isIPALocked',
                args: [ipaIdBytes32],
            });
            return locked as boolean;
        } catch (err) {
            console.error('Error checking lock status:', err);
            return false;
        }
    }, [publicClient]);

    // Get locked IP for user
    const getLockedIP = useCallback(async (userAddress: string): Promise<string | null> => {
        if (!publicClient || !contracts?.IP_MANAGER) return null;
        try {
            console.log('[AutonomyFinance][Story] userIPA call', {
                // @ts-ignore - transport url access
                rpcUrlInUse: publicClient.transport?.url || 'unknown',
                chainId: publicClient.chain?.id,
                contractAddress: contracts.IP_MANAGER.address,
                userAddress,
            });

            const ipaId = await publicClient.readContract({
                address: contracts.IP_MANAGER.address as Address,
                abi: contracts.IP_MANAGER.abi,
                functionName: 'userIPA', // Mapping: address => bytes32
                args: [userAddress],
            });

            if (!ipaId || ipaId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                return null;
            }
            return ipaId as string;
        } catch (err) {
            console.error('Error getting locked IP:', err);
            return null;
        }
    }, [publicClient]);

    // Auto-Repay from Royalty (using AutoRepayEngine)
    const autoRepayFromRoyalty = useCallback(async (
        ipaId: string,
        tokenIn: string,
        amountIn: string,
        minRepayOut: string = '0',
        slippageBps: number = 50, // 0.5%
        preferredDebtAsset: string = '0x0000000000000000000000000000000000000000'
    ) => {
        if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

        setIsLoading(true);
        setError(null);

        try {
            const ipaIdBytes32 = ensureBytes32(ipaId);
            const amountWei = parseEther(amountIn);
            const minOutWei = parseEther(minRepayOut);

            console.log('Initiating auto-repay:', { ipaId, tokenIn, amountIn, preferredDebtAsset });

            // 1. Check allowance for AutoRepayEngine
            if (!contracts?.AUTO_REPAY_ENGINE || !contracts?.MockRoyaltyToken) {
                throw new Error('AutoRepayEngine or MockRoyaltyToken not configured for this network');
            }

            const allowance = await publicClient.readContract({
                address: tokenIn as Address,
                abi: contracts.MockRoyaltyToken.abi, // ERC20 ABI
                functionName: 'allowance',
                args: [address, contracts.AUTO_REPAY_ENGINE.address],
            }) as bigint;

            if (allowance < amountWei) {
                console.log('Approving AutoRepayEngine...');
                const approveHash = await walletClient.writeContract({
                    address: tokenIn as Address,
                    abi: contracts.MockRoyaltyToken.abi,
                    functionName: 'approve',
                    args: [contracts.AUTO_REPAY_ENGINE.address, amountWei],
                });
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
                console.log('Approved AutoRepayEngine');
            }

            // 2. Call autoRepayFromRoyalty
            console.log('Calling autoRepayFromRoyalty...');
            const hash = await walletClient.writeContract({
                address: contracts.AUTO_REPAY_ENGINE.address as Address,
                abi: contracts.AUTO_REPAY_ENGINE.abi,
                functionName: 'autoRepayFromRoyalty',
                args: [
                    ipaIdBytes32,
                    tokenIn,
                    amountWei,
                    minOutWei,
                    slippageBps,
                    preferredDebtAsset as Address
                ],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log('Auto-repay successful:', receipt);

            return hash;
        } catch (err: any) {
            console.error('Auto-repay error:', err);
            // Parse error message if possible
            let message = err.message || 'Unknown error';
            if (message.includes('Token not whitelisted')) {
                message = 'Token not supported for auto-repay. Please use USDC or whitelisted tokens.';
            } else if (message.includes('Slippage too high')) {
                message = 'Slippage too high. Try a smaller amount.';
            }
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [address, walletClient, publicClient]);

    return {
        mintIP,
        lockIPA,
        payRoyalty,
        claimRoyalty,
        getRoyaltyBalance,
        isIPALocked,
        getLockedIP,
        autoRepayFromRoyalty,
        isLoading,
        error
    };
}
