import { readFile } from 'node:fs/promises'
import { connect, createDataItemSigner } from '@permaweb/aoconnect'
import assert from 'node:assert'

// Helper: Delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random values for round-trip testing
const RANDOM_BOOLEAN = Math.random() > 0.5
const RANDOM_STRING = Math.random().toString().slice(2)

// Configuration
const WALLET_FILE = '../lua/wallet.json'
const PROCESS_NAME = 'place-canvas-' + Math.random().toString().slice(-4)
const PATCH_KEY = 'state'
const PATCH_VALUE = `{
  random_boolean = ${RANDOM_BOOLEAN},
  random_string = '${RANDOM_STRING}'
}`

const AOS_MODULE = 'XcWULRSWWv_bmaEyx4PEOFf4vgRSVCP9vM5AucRvI40' // AOS 2.0.3
const MU_URL = 'https://ur-mu.randao.net'
const SCHEDULER = 'hgyPiR329mfonaqwAdqIygJPrLL8ypflUAzgUZTyYnA'
//const SCHEDULER = 'DDyQNDRVdrNRZkU8Y4qOn6V-y_BI7u1zpPpAoWhy3N0'
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

  // Wait 15 minutes for process initialization
  console.log("Waiting 15 minutes before continuing...")
  await delay(15 * 60 * 1000);

  return { processId, signer };
}

// Patch initial state with random data
async function patchInitialState(processId, signer) {
  console.log('\nPatching initial state with random data...')
  const luaCode = `
    ao.send({
      device = 'patch@1.0',
      ${PATCH_KEY} = ${PATCH_VALUE}
    })
  `
  const messageId = await message({
    process: processId,
    data: luaCode,
    signer,
    tags: [
      { name: 'Action', value: 'Eval' }
    ]
  })
  console.log(`messageId: ${messageId}`)

  // Wait for process to propagate
  const hyperbeamBaseUrl = `${HB_NODE}/${processId}~process@1.0`
  const healthcheckEndpoint = `${hyperbeamBaseUrl}/compute&slot=1/results/json`
  while (true) {
    console.log('Waiting for process to propagate...')
    const res = await fetch(healthcheckEndpoint)
    if (res.status !== 404) {
      console.log('Process ready.')
      break
    }
    await delay(5000) // Wait 5 seconds before checking again
  }

  // Verify patch data
  console.log('\nVerifying patch data on HyperBEAM node...')
  const hyperbeamPatchEndpoint = `${hyperbeamBaseUrl}/now/${PATCH_KEY}/serialize~json@1.0`
  console.log(hyperbeamPatchEndpoint)
  const results = await (await fetch(hyperbeamPatchEndpoint)).json()

  assert.strictEqual(results.random_boolean, RANDOM_BOOLEAN, 'random_boolean did not match')
  assert.strictEqual(results.random_string, RANDOM_STRING, 'random_string did not match')
  console.log('Initial state patch verified successfully.')
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

// Set example colors on the canvas
async function patchColors(processId, signer) {
  console.log('\nSetting example colors...')
  const colors = [
    { x: 10, y: 10, color: [255, 0, 0] },    // Red
    { x: 20, y: 20, color: [0, 255, 0] },    // Green
    { x: 30, y: 30, color: [0, 0, 255] },    // Blue
    { x: 40, y: 40, color: [255, 255, 0] },  // Yellow
    { x: 50, y: 50, color: [255, 0, 255] },  // Magenta
  ]

  // Send all color changes in sequence
  for (const { x, y, color } of colors) {
    await message({
      process: processId,
      signer,
      tags: [{ name: 'Action', value: 'changePixel' }],
      data: JSON.stringify({ x, y, color })
    })
    console.log(`Set color at (${x},${y}) to [${color.join(',')}]`)
    await delay(1000) // Small delay between messages
  }
}

// Verify final state after all changes
async function verifyFinalState(processId) {
  console.log('\nVerifying final state on HyperBEAM node...')
  const hyperbeamBaseUrl = `${HB_NODE}/${processId}~process@1.0`
  const hyperbeamPatchEndpoint = `${hyperbeamBaseUrl}/now/${PATCH_KEY}/serialize~json@1.0`
  console.log(hyperbeamPatchEndpoint)
  const results = await (await fetch(hyperbeamPatchEndpoint)).json()

  // Verify our initial random values are still there
  assert.strictEqual(results.random_boolean, RANDOM_BOOLEAN, 'random_boolean did not match')
  assert.strictEqual(results.random_string, RANDOM_STRING, 'random_string did not match')

  // Verify pixels were set
  const expectedColors = [
    { x: 10, y: 10, color: [255, 0, 0] },
    { x: 20, y: 20, color: [0, 255, 0] },
    { x: 30, y: 30, color: [0, 0, 255] },
    { x: 40, y: 40, color: [255, 255, 0] },
    { x: 50, y: 50, color: [255, 0, 255] }
  ]

  for (const {x, y, color} of expectedColors) {
    const pixelColor = results.pixels[x][y]
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

    // Step 1: Patch initial state with random data and verify
    await patchInitialState(processId, signer);

    // Step 2: Push Lua code and set pixel colors
    await pushCode(processId, signer);
    await patchColors(processId, signer);

    // Step 3: Verify final state including both random data and pixels
    await verifyFinalState(processId);

    console.log('\nProcess complete!')
    console.log(`Process ID: ${processId}`)
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
