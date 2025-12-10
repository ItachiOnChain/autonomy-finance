
import { ipfsToGatewayUrls } from './src/utils/ipfs';

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
