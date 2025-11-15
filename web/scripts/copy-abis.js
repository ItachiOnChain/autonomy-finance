import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contracts = [
  'AutonomyV1',
  'Adapter',
  'RWAAdapter',
  'AtAsset',
  'CollateralToken',
  'MockOracle',
  'RWAOracle',
  'IERC20',
]

const outDir = path.join(__dirname, '../out')
const abisDir = path.join(__dirname, '../src/abis')

// Create abis directory if it doesn't exist
if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true })
}

// Copy ABIs
for (const contract of contracts) {
  const contractDir = path.join(outDir, `${contract}.sol`)
  const jsonFile = path.join(contractDir, `${contract}.json`)
  
  if (fs.existsSync(jsonFile)) {
    const json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    const abi = json.abi || []
    
    const outputFile = path.join(abisDir, `${contract}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(abi, null, 2))
    console.log(`✓ Copied ${contract}.json`)
  } else {
    console.warn(`⚠ ${contract}.json not found`)
  }
}

console.log('\n✅ ABI extraction complete!')

