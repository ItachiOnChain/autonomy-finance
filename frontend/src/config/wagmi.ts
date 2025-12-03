import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { anvil, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

// Define Story Testnet chain
const storyTestnet = {
    id: 1513, // Replace with actual Story Testnet Chain ID if different
    name: 'Story Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.odyssey.storyrpc.io'] }, // Replace with actual RPC
    },
    blockExplorers: {
        default: { name: 'Story Explorer', url: 'https://explorer.story.foundation' },
    },
    testnet: true,
} as const;

export const config = getDefaultConfig({
    appName: 'Autonomy Finance',
    projectId: 'YOUR_PROJECT_ID', // Replace with actual WalletConnect Project ID
    chains: [anvil, sepolia, storyTestnet],
    transports: {
        [anvil.id]: http(),
        [sepolia.id]: http(),
        [storyTestnet.id]: http(),
    },
});
