export interface IP {
    ipId: string;
    contractAddress: string;
    tokenId: string;
    owner: string;
    metadataResolver: string;
    isRegistered: boolean;
    metadata?: {
        title: string;
        description: string;
        image: string;
        mediaUrl: string;
        attributes: {
            key: string;
            value: string;
        }[];
    };
}

export interface RoyaltyToken {
    address: string;
    balance: string;
}
