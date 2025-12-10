// Story Protocol compliant metadata schemas

export interface IPMetadata {
    title: string;
    description: string;
    ipType?: string;
    creators: Creator[];
    image?: string;
    imageHash?: string;
    mediaUrl?: string;
    mediaHash?: string;
    mediaType?: string;
    tags?: string[];
    externalUrl?: string;
}

export interface Creator {
    name: string;
    address: string;
    contributionPercent: number;
    socialMedia?: SocialMedia[];
}

export interface SocialMedia {
    platform: string;
    url: string;
}

export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
}

export interface PreparedMetadata {
    ipMetadataURI: string;
    ipMetadataHash: string;
    nftMetadataURI: string;
    nftMetadataHash: string;
    imageURI: string; // Direct URI to the image file
}
