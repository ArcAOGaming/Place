import { readFile } from 'node:fs/promises'
import { connect, createDataItemSigner } from '@permaweb/aoconnect'
import assert from 'node:assert'

// Helper: Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuration
const WALLET_FILE = '../lua/wallet.json'
const PROCESS_NAME = 'place-canvas-' + Math.random().toString().slice(-4)
const PATCH_KEY = 'state'

const AOS_MODULE = 'XcWULRSWWv_bmaEyx4PEOFf4vgRSVCP9vM5AucRvI40' // AOS 2.0.3
const MU_URL = 'https://ur-mu.randao.net'
const SCHEDULER = 'hgyPiR329mfonaqwAdqIygJPrLL8ypflUAzgUZTyYnA'
const AUTHORITIES = ['fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY', '--TKpHlFyOR7aLqZ-uR3tqtmgQisllKaRVctMlwvPwE','DDyQNDRVdrNRZkU8Y4qOn6V-y_BI7u1zpPpAoWhy3N0', SCHEDULER]
const HB_NODE = 'https://hb.randao.net'

const { message, spawn } = connect({ MU_URL });

// Create a new process and return its ID
async function createProcess() {
  console.log(`Loading wallet from ${WALLET_FILE}...`)
  const jwk = JSON.parse(await readFile(WALLET_FILE, 'utf-8'));
  const signer = createDataItemSigner(jwk)
  
  console.log('\nSpawning process...')
  const processId = await spawn({
    module: AOS_MODULE,
    scheduler: SCHEDULER,
    signer,
    tags: [
      { name: 'Name', value: PROCESS_NAME },
      ...AUTHORITIES.map(addr => ({ name: 'Authority', value: addr })),
    ],
  });
  console.log(`processId: ${processId}`)

  // Wait 5 minutes for process initialization
  console.log("Waiting 5 minutes before continuing...")
  await delay(5 * 60 * 1000);

  return { processId, signer };
}

// Push Lua code to a process
async function pushCode(processId, signer) {
  console.log('\nPushing Lua code...')
  const luaCode = await readFile('../lua/main.lua', 'utf-8')
  await message({
    process: processId,
    data: luaCode,
    signer,
    tags: [
      { name: 'Action', value: 'Eval' }
    ]
  })

  // Wait 1 minute for code to settle
  console.log("Waiting 1 minute before continuing...")
  await delay(60 * 1000);
}

// Set example colors on the canvas using multiple pixel changes
async function patchColors(processId, signer) {
  console.log('\nSetting example colors...')
  
  // Simple 3x3 test pattern
  const testPattern = [
    { x: 1, y: 1, color: [255, 0, 0] },    // Red center
    { x: 0, y: 0, color: [0, 0, 0] },      // Black corners
    { x: 2, y: 0, color: [0, 0, 0] },
    { x: 0, y: 2, color: [0, 0, 0] },
    { x: 2, y: 2, color: [0, 0, 0] }
  ];

  // Send all pixel changes at once
  await message({
    process: processId,
    signer,
    tags: [{ name: 'Action', value: 'changePixels' }],
    data: JSON.stringify({ pixels: testPattern })
  });
  console.log('Set test pattern');
  await delay(1000);
}

// Verify final state after all changes
async function verifyFinalState(processId) {
  console.log('\nVerifying final state on HyperBEAM node...')
  const hyperbeamBaseUrl = `${HB_NODE}/${processId}~process@1.0`
  const hyperbeamPatchEndpoint = `${hyperbeamBaseUrl}/now/${PATCH_KEY}/serialize~json@1.0`
  console.log(hyperbeamPatchEndpoint)
  const results = await (await fetch(hyperbeamPatchEndpoint)).json()

  // Verify key points of the test pattern
  const checkPoints = [
    { x: 1, y: 1, color: [255, 0, 0] },    // Red center
    { x: 0, y: 0, color: [0, 0, 0] },      // Black corner
    { x: 2, y: 2, color: [0, 0, 0] }       // Black corner
  ];

  for (const {x, y, color} of checkPoints) {
    // No need to adjust indices since backend returns in 0-based format
    const pixelColor = results.pixels[y][x]
    assert.deepStrictEqual(pixelColor, color, `Pixel at ${x},${y} did not match expected color`)
  }
  
  console.log('All final state tests passed.')
}

// Main execution
async function main() {
  try {
    // Get process ID from command line args or create new process
    let processId = process.argv[2] || '';
    let signer;
    
    if (!processId) {
      console.log('No process ID provided, creating new process...');
      const result = await createProcess();
      processId = result.processId;
      signer = result.signer;
    } else {
      console.log(`Using existing process: ${processId}`);
      console.log(`Loading wallet from ${WALLET_FILE}...`)
      const jwk = JSON.parse(await readFile(WALLET_FILE, 'utf-8'));
      signer = createDataItemSigner(jwk)
    }

    // Push Lua code and set pixel colors
    await pushCode(processId, signer);
    await patchColors(processId, signer);

    // Verify final state
    await verifyFinalState(processId);

    console.log('\nProcess complete!')
    console.log(`Process ID: ${processId}`)
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
