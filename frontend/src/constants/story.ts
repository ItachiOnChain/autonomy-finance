// Story Protocol Contract Addresses on Aeneid Testnet (Chain ID: 1315)
export const STORY_CONTRACTS = {
    IPAssetRegistry: "0x77319B4031e6eF1250907aa00018B8B1c67a244b",
    LicensingModule: "0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f",
    PILicenseTemplate: "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316",
    RoyaltyModule: "0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086",
    RoyaltyPolicyLAP: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
    SPG_NFT_CONTRACT: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc"
} as const;

export const AENEID_TESTNET = {
    chainId: 1315,
    name: "Story Aeneid Testnet",
    rpcUrl: "https://aeneid.storyrpc.io",
    explorerUrl: "https://aeneid.storyscan.io",
    faucetUrl: "https://faucet.story.foundation"
} as const;

// WIP token address on Aeneid Testnet (for license currency)
export const WIP_TOKEN_ADDRESS = "0x1514000000000000000000000000000000000000" as const;
