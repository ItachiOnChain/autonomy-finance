// TypeScript types for IP Asset management

export interface IPAsset {
    ipId: string;
    tokenId: bigint;
    title: string;
    description: string;
    ipType: string;
    thumbnailURI: string;
    mediaUrl: string;
    royaltyPercent: number;
    hasCommercialLicense: boolean;
    licenseTermsIds?: bigint[];
    mintedAt: number;
    txHash: string;
    explorerUrl: string;
    creator: string;
}

export interface IPAssetFormData {
    title: string;
    description: string;
    ipType: 'image' | 'video' | 'audio' | 'document' | 'other';
    file: File | null;
    royaltyPercent: number;
    enableCommercialLicense: boolean;
}

export interface MintResult {
    txHash: string;
    ipId: string;
    tokenId?: bigint;
    licenseTermsIds?: bigint[];
}
