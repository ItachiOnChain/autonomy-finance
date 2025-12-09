// ⚠️ SECURITY WARNING: TESTNET ONLY ⚠️
// These credentials are hardcoded for Story Aeneid testnet development ONLY.
// In production, these MUST be moved to environment variables and NEVER committed to git.

export const PINATA_CONFIG = {
    pinataApiKey: "a6b66a4c79ed522bbbc5",
    pinataSecretApiKey: "c1ad224951860b6d5915766e7c67def211e1e42b233c179c8ea6e6ee227b44d4",
    pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3ODc4ODIwZS1iMWI0LTRjMTUtYmE3MS0xY2EyMzc0ZGM0NDEiLCJlbWFpbCI6Iml0YWNoaW9uY2hhaW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImE2YjY2YTRjNzllZDUyMmJiYmM1Iiwic2NvcGVkS2V5U2VjcmV0IjoiYzFhZDIyNDk1MTg2MGI2ZDU5MTU3NjZlN2M2N2RlZjIxMWUxZTQyYjIzM2MxNzljOGVhNmU2ZWUyMjdiNDRkNCIsImV4cCI6MTc5NjgxNTUyNn0.wn0Aqi723bLUYhGGuR_4EGuLm-_RL8ICw0Z0nAOM3JI"
} as const;

// IPFS Gateway URLs
export const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Fallback gateways in case Pinata gateway fails
export const IPFS_GATEWAY_FALLBACKS = [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/"
] as const;

// Maximum file size for IPFS uploads (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported file types for IP assets
export const SUPPORTED_FILE_TYPES = {
    image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    document: ['application/pdf', 'text/plain']
} as const;
