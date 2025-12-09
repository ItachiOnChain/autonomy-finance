// Aeneid chain configuration for viem
export const aeneid = {
    id: 1315,
    name: 'Story Aeneid Testnet',
    network: 'aeneid',
    nativeCurrency: {
        decimals: 18,
        name: 'IP',
        symbol: 'IP',
    },
    rpcUrls: {
        default: {
            http: ['https://aeneid.storyrpc.io'],
        },
        public: {
            http: ['https://aeneid.storyrpc.io'],
        },
    },
    blockExplorers: {
        default: { name: 'StoryScan', url: 'https://aeneid.storyscan.io' },
    },
    testnet: true,
} as const;
