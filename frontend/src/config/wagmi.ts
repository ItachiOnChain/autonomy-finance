import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

// Define Story Aeneid Testnet chain (PRIMARY AND ONLY CHAIN)
const storyAeneid = {
    id: 1315, // Story Aeneid testnet chain ID
    name: 'Story Aeneid Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: {
        default: { http: [import.meta.env.VITE_STORY_RPC_URL] },
    },
    blockExplorers: {
        default: { name: 'Story Aeneid Explorer', url: 'https://aeneid.storyscan.io' },
    },
    testnet: true,
} as const;

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const rpcUrl = import.meta.env.VITE_STORY_RPC_URL;

if (!projectId) throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID");
if (!rpcUrl) throw new Error("Missing VITE_STORY_RPC_URL");

export const config = getDefaultConfig({
    appName: 'Autonomy Finance',
    projectId,
    chains: [storyAeneid], // Story Aeneid ONLY
    transports: {
        [storyAeneid.id]: http(rpcUrl),
    },
});
