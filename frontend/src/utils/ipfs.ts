// IPFS utilities using Pinata

import { PinataSDK } from "pinata-web3";
import { PINATA_CONFIG } from "../constants/pinata";

// Initialize Pinata SDK
const pinata = new PinataSDK({
    pinataJwt: PINATA_CONFIG.pinataJwt
});

/**
 * Upload a file to IPFS via Pinata
 * @param file - File to upload
 * @returns IPFS URI (ipfs://CID)
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
    try {
        console.log('[IPFS] Uploading file:', file.name, file.size, 'bytes');
        const upload = await pinata.upload.file(file);
        const ipfsUri = `ipfs://${upload.IpfsHash}`;
        console.log('[IPFS] File uploaded successfully:', ipfsUri);
        return ipfsUri;
    } catch (error) {
        console.error('[IPFS] File upload failed:', error);
        throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param metadata - Metadata object to upload
 * @returns IPFS URI (ipfs://CID)
 */
export async function uploadMetadataToIPFS(metadata: object): Promise<string> {
    try {
        console.log('[IPFS] Uploading metadata:', metadata);
        const upload = await pinata.upload.json(metadata);
        const ipfsUri = `ipfs://${upload.IpfsHash}`;
        console.log('[IPFS] Metadata uploaded successfully:', ipfsUri);
        return ipfsUri;
    } catch (error) {
        console.error('[IPFS] Metadata upload failed:', error);
        throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get all IPFS gateway URLs for fallback support
 * Normalizes various IPFS URI formats and returns ordered list of gateway URLs
 * IMPORTANT: Never truncates CID - always uses full CID for all gateways
 * 
 * @param ipfsURI - IPFS URI in any format (ipfs://CID, https://gateway/ipfs/CID, or bare CID)
 * @returns Array of gateway URLs in priority order
 */
export function ipfsToGatewayUrls(ipfsURI: string): string[] {
    if (!ipfsURI) return [];

    // Extract CID from various formats - NEVER truncate
    let cid = ipfsURI.trim();

    // Handle ipfs:// protocol
    if (cid.startsWith('ipfs://')) {
        cid = cid.substring(7);
    }
    // Handle existing gateway URLs
    else if (cid.includes('/ipfs/')) {
        const parts = cid.split('/ipfs/');
        cid = parts[1] || cid;
    }

    // Remove any trailing slashes or query params but preserve full CID
    cid = cid.split('?')[0].split('#')[0].replace(/\/+$/, '');

    // Return ordered list of gateway URLs with FULL CID (no truncation)
    // Note: Using working IPFS gateways as of 2024
    return [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://cf-ipfs.com/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`
    ];
}

/**
 * Convert IPFS URI to HTTP gateway URL with fallback support
 * @param ipfsURI - IPFS URI (ipfs://CID or https://gateway/ipfs/CID or bare CID)
 * @returns Primary gateway URL
 */
export function ipfsToGatewayURL(ipfsURI: string): string {
    const urls = ipfsToGatewayUrls(ipfsURI);
    return urls[0] || ipfsURI;
}
