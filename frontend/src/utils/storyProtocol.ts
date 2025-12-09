// Story Protocol utilities

import { AENEID_TESTNET } from "../constants/story";

/**
 * Generate Story Protocol explorer URL for an IP asset
 * Uses correct Story Foundation explorer domain
 * @param ipId - The IP asset ID
 * @returns Full URL to view the IP on Story Explorer
 */
export function generateExplorerURL(ipId: string): string {
    const id = (ipId || "").trim();
    return `https://aeneid.explorer.story.foundation/ipa/${encodeURIComponent(id)}`;
}

/**
 * Generate Story Explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Story Explorer URL
 */
export function generateTxExplorerURL(txHash: string): string {
    return `${AENEID_TESTNET.explorerUrl}/tx/${txHash}`;
}

/**
 * Parse mint events from transaction receipt
 * Note: Story SDK's registerIpAsset() returns ipId directly,
 * so this is mainly for backup/verification purposes
 * 
 * @param receipt - Transaction receipt
 * @returns Parsed event data
 */
export function parseMintEvents(receipt: any): { ipId?: string; tokenId?: bigint } {
    try {
        // Story SDK returns ipId in the response, so we primarily use that
        // This function is for additional event parsing if needed
        if (receipt.logs && receipt.logs.length > 0) {
            // Look for IPMinted or similar events
            // The exact event structure depends on Story Protocol's contracts
            const ipId = receipt.logs[0]?.topics?.[1];
            const tokenId = receipt.logs[0]?.topics?.[2]
                ? BigInt(receipt.logs[0].topics[2])
                : undefined;

            return { ipId, tokenId };
        }
        return {};
    } catch (error) {
        console.error('[Story] Error parsing mint events:', error);
        return {};
    }
}
