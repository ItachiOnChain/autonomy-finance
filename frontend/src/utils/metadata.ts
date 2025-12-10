// Metadata composition and hashing utilities

import { keccak256, toHex } from "viem";
import type { IPMetadata, NFTMetadata, PreparedMetadata } from "../types/metadata";
import type { IPAssetFormData } from "../types/ipAsset";
import { uploadFileToIPFS, uploadMetadataToIPFS } from "./ipfs";

/**
 * Compute keccak256 hash of metadata object
 * @param metadata - Metadata object to hash
 * @returns Hex-encoded hash
 */
export function computeMetadataHash(metadata: object): string {
    const metadataString = JSON.stringify(metadata);
    return keccak256(toHex(metadataString));
}

/**
 * Compose Story Protocol-compliant IP metadata from form data
 * @param formData - Form data from IP mint form
 * @param creatorAddress - Ethereum address of the creator
 * @param fileURI - IPFS URI of the uploaded file
 * @param fileHash - Hash of the file metadata
 * @param fileType - MIME type of the file
 * @returns IP metadata object
 */
export function composeMetadata(
    formData: IPAssetFormData,
    creatorAddress: string,
    fileURI: string,
    fileHash: string,
    fileType: string
): IPMetadata {
    return {
        title: formData.title,
        description: formData.description,
        ipType: formData.ipType,
        creators: [
            {
                name: "Creator",
                address: creatorAddress,
                contributionPercent: 100
            }
        ],
        mediaUrl: fileURI,
        mediaHash: fileHash,
        mediaType: fileType,
        image: fileURI, // Use same file as thumbnail for simplicity
        imageHash: fileHash
    };
}

/**
 * Prepare complete IP metadata for Story Protocol minting
 * Uploads file and metadata to IPFS and computes hashes
 * 
 * @param file - File to upload
 * @param title - IP title
 * @param description - IP description
 * @param ipType - Type of IP (image, video, etc.)
 * @param creatorAddress - Ethereum address of creator
 * @returns Prepared metadata with URIs and hashes
 */
export async function prepareIPMetadata(
    file: File,
    title: string,
    description: string,
    ipType: string,
    creatorAddress: string
): Promise<PreparedMetadata> {
    // 1. Upload file to IPFS
    const fileURI = await uploadFileToIPFS(file);
    const fileHash = computeMetadataHash({ uri: fileURI });

    // 2. Compose IP metadata
    const ipMetadata: IPMetadata = {
        title,
        description,
        ipType,
        creators: [
            {
                name: "Creator",
                address: creatorAddress,
                contributionPercent: 100
            }
        ],
        mediaUrl: fileURI,
        mediaHash: fileHash,
        mediaType: file.type,
        image: fileURI,
        imageHash: fileHash
    };

    // 3. Upload IP metadata to IPFS
    const ipMetadataURI = await uploadMetadataToIPFS(ipMetadata);
    const ipMetadataHash = computeMetadataHash(ipMetadata);

    // 4. Compose NFT metadata (simpler version)
    const nftMetadata: NFTMetadata = {
        name: title,
        description,
        image: fileURI
    };

    // 5. Upload NFT metadata to IPFS
    const nftMetadataURI = await uploadMetadataToIPFS(nftMetadata);
    const nftMetadataHash = computeMetadataHash(nftMetadata);

    return {
        ipMetadataURI,
        ipMetadataHash,
        nftMetadataURI,
        nftMetadataHash,
        imageURI: fileURI
    };
}
