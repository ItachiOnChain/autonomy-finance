
function ipfsToGatewayUrls(ipfsURI) {
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
    // Handle subdomain gateways (e.g. https://bafy...ipfs.dweb.link)
    else if (cid.includes('.ipfs.')) {
        // Extract CID from subdomain
        const matches = cid.match(/https?:\/\/([^.]+)\.ipfs\./);
        if (matches && matches[1]) {
            cid = matches[1];
        }
    }

    // Remove any trailing slashes or query params but preserve full CID
    cid = cid.split('?')[0].split('#')[0].replace(/\/+$/, '');

    // Return ordered list of gateway URLs with FULL CID (no truncation)
    // Note: Using working IPFS gateways as of 2024
    return [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://cf-ipfs.com/ipfs/${cid}`,
        `https://dweb.link/ipfs/${cid}`,
        `https://flk-ipfs.xyz/ipfs/${cid}`,
        `https://nftstorage.link/ipfs/${cid}`,
        `https://4everland.io/ipfs/${cid}`,
        `https://w3s.link/ipfs/${cid}`
    ];
}

const testCids = [
    'ipfs://bafkreiebbzocgj6yhwyjftdwh6xguivoaxcsljy5g3zpeiu3gcvndowslm',
    'bafkreiebbzocgj6yhwyjftdwh6xguivoaxcsljy5g3zpeiu3gcvndowslm',
    'https://bafkreiebbzocgj6yhwyjftdwh6xguivoaxcsljy5g3zpeiu3gcvndowslm.ipfs.dweb.link/',
    'https://cf-ipfs.com/ipfs/bafkreiebbzocgj6yhwyjftdwh6xguivoaxcsljy5g3zpeiu3gcvndowslm'
];

testCids.forEach(cid => {
    console.log(`Input: ${cid}`);
    console.log('Output:', ipfsToGatewayUrls(cid));
    console.log('---');
});
