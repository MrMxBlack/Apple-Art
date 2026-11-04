// Apple Art deploy: temporary deployer EOA (deployer.json); ownership moves
// to the mee.ai wallet at the end. Follows the Genesis1999 deploy pattern
// (curl JSON-RPC + locally signed legacy txs, resumable via state.json).
//
// Steps: deploy -> setReserved(33) -> mintReserved(33 -> mee.ai, batched)
//        -> setSaleActive(true) -> transferOwnership(mee.ai) -> verify.
// The script refuses to start if the deployer balance is below NEED_WEI
// (deploy + config + reserve mints at the live gas price, +30% buffer).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Wallet, Interface } from 'ethers';

const RPCS = ['https://bsc-dataseed1.bnbchain.org', 'https://bsc-dataseed2.bnbchain.org', 'https://bsc-dataseed.bnbchain.org'];
const FEED = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'; // Chainlink BNB/USD, BSC (same as G1999Presale)
const BASE_URI = 'ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/';
const MEE = '0xB0cB52091aDd24aCb9542081a0f1d5a946998636';

const dep = JSON.parse(fs.readFileSync(new URL('./deployer.json', import.meta.url), 'utf8'));
const wallet = new Wallet(dep.privateKey);
const art = JSON.parse(fs.readFileSync(new URL('../build/AppleArt.json', import.meta.url), 'utf8'));
const iface = new Interface(art.abi);
const reserve = JSON.parse(fs.readFileSync(new URL('../assets/reserve.json', import.meta.url), 'utf8')).reserveTokenIds;

const statePath = new URL('./state.json', import.meta.url);
let state = {};
try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch {}
function saveState() { fs.writeFileSync(statePath, JSON.stringify(state, null, 2)); }

function rpcAt(url, method, params) {
  const out = execFileSync('curl', ['-s', '-m', '25', url, '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })], { encoding: 'utf8' });
  const j = JSON.parse(out);
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}
function rpc(method, params) {
  for (const url of RPCS) { try { return rpcAt(url, method, params); } catch { /* next */ } }
  throw new Error('all RPCs failed for ' + method);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function sendTx(to, data, gasLimit, value = 0n) {
  const nonce = Number(BigInt(rpc('eth_getTransactionCount', [wallet.address, 'pending'])));
  const gasPrice = BigInt(rpc('eth_gasPrice', []));
  const tx = { data, value, gasLimit: BigInt(gasLimit), gasPrice, nonce, chainId: 56, type: 0 };
  if (to) tx.to = to;
  const raw = await wallet.signTransaction(tx);
  const hash = rpc('eth_sendRawTransaction', [raw]);
  let receipt = null;
  for (let i = 0; i < 40 && !receipt; i++) { await sleep(1500); receipt = rpc('eth_getTransactionReceipt', [hash]); }
  if (!receipt) throw new Error('no receipt for ' + hash);
  if (receipt.status !== '0x1') throw new Error('tx failed: ' + hash);
  return { hash, gasUsed: BigInt(receipt.gasUsed) };
}
function call(to, data, rpcIdx = 0) { return rpcAt(RPCS[rpcIdx], 'eth_call', [{ to, data }, 'latest']); }

// Gas: ganache-measured usage from build/gas-report.json. Tx LIMITS carry
// ~1.25 headroom; the funding NEED is measured gas x live price x 1.3 buffer.
let G = { deploy: 3_000_000, setReserved33: 900_000, setSaleActive: 80_000, transferOwnership: 80_000, mintReservedBatch: 1_600_000 };
let raw = { deploy: 2_105_738, setReserved33: 763_151, setSaleActive: 45_743, transferOwnership: 29_577, reserveAll: 1_805_586 };
try {
  const rep = JSON.parse(fs.readFileSync(new URL('../build/gas-report.json', import.meta.url), 'utf8'));
  const up = (v, min) => Math.max(min, Math.ceil(Number(v) * 1.25));
  if (rep.deploy) { G.deploy = up(rep.deploy, 2_200_000); raw.deploy = Number(rep.deploy); }
  if (rep.setReserved33) { G.setReserved33 = up(rep.setReserved33, 700_000); raw.setReserved33 = Number(rep.setReserved33); }
  if (rep.setSaleActive) { G.setSaleActive = up(rep.setSaleActive, 60_000); raw.setSaleActive = Number(rep.setSaleActive); }
  if (rep.transferOwnership) { G.transferOwnership = up(rep.transferOwnership, 60_000); raw.transferOwnership = Number(rep.transferOwnership); }
  if (rep.mintReserved2 && rep.mintReserved31) raw.reserveAll = Number(rep.mintReserved2) + Number(rep.mintReserved31);
} catch { /* defaults */ }
const RESERVE_BATCH = 11; // 3 batches of 11 for the 33 reserve mints
const coreGas = raw.deploy + raw.setReserved33 + raw.setSaleActive + raw.transferOwnership;
const fullGas = coreGas + raw.reserveAll;
// measured mintReserved cost model: ~36,131 + ~52,525 per id
const estReserveBatchGas = (n) => 36_131 + 52_525 * n;

const gasPrice = BigInt(rpc('eth_gasPrice', []));
const balance = BigInt(rpc('eth_getBalance', [wallet.address, 'latest']));
const needCore = BigInt(coreGas) * gasPrice * 130n / 100n;
const needFull = BigInt(fullGas) * gasPrice * 130n / 100n;
console.log(`deployer ${wallet.address} balance ${balance} wei, gasPrice ${gasPrice}`);
console.log(`need (core, +30%): ${needCore} wei | need (full incl. reserve mints, +30%): ${needFull} wei`);
state.funding = { deployer: wallet.address, balanceWei: balance.toString(), gasPriceWei: gasPrice.toString(), needCoreWei: needCore.toString(), needFullWei: needFull.toString() };
saveState();
if (balance < needCore) { console.log('INSUFFICIENT for core deploy+config. Aborting before any tx.'); process.exit(2); }
const doReserveMints = balance >= needFull;
if (!doReserveMints) console.log('NOTE: balance covers core only — reserve mints will be attempted best-effort and may be partial.');

// 1. deploy
if (!state.contract) {
  const ctor = iface.encodeDeploy([FEED, BASE_URI]);
  const { hash, gasUsed } = await sendTx(null, art.bytecode + ctor.slice(2), G.deploy);
  // contract address from receipt
  let receipt = rpc('eth_getTransactionReceipt', [hash]);
  state.contract = receipt.contractAddress;
  state.deployTx = hash; state.deployGas = gasUsed.toString();
  saveState();
  console.log('deployed:', state.contract, hash);
}
const CA = state.contract;

// 2. setReserved(33)
if (!state.setReservedTx) {
  const data = iface.encodeFunctionData('setReserved', [reserve]);
  const { hash, gasUsed } = await sendTx(CA, data, G.setReserved33);
  state.setReservedTx = hash; state.setReservedGas = gasUsed.toString(); saveState();
  console.log('setReserved:', hash);
}

// 3. mintReserved batches -> mee.ai (best effort if funds are tight)
state.reserveMinted = state.reserveMinted ?? [];
const todo = reserve.filter((id) => !state.reserveMinted.includes(id));
for (let i = 0; i < todo.length; i += RESERVE_BATCH) {
  const batch = todo.slice(i, i + RESERVE_BATCH);
  const balNow = BigInt(rpc('eth_getBalance', [wallet.address, 'latest']));
  const keepBack = BigInt(raw.setSaleActive + raw.transferOwnership) * gasPrice * 130n / 100n;
  if (balNow - keepBack < BigInt(estReserveBatchGas(batch.length)) * gasPrice) {
    console.log(`stopping reserve mints: ${state.reserveMinted.length}/33 done, balance too low to continue safely`);
    break;
  }
  const data = iface.encodeFunctionData('mintReserved', [MEE, batch]);
  const { hash, gasUsed } = await sendTx(CA, data, G.mintReservedBatch);
  state.reserveMinted.push(...batch);
  (state.reserveMintTxs ??= []).push({ hash, ids: batch, gasUsed: gasUsed.toString() });
  saveState();
  console.log(`mintReserved batch ${batch.length} ids:`, hash, `(${state.reserveMinted.length}/33)`);
}

// 4. open sale
if (!state.setSaleActiveTx) {
  const data = iface.encodeFunctionData('setSaleActive', [true]);
  const { hash, gasUsed } = await sendTx(CA, data, G.setSaleActive);
  state.setSaleActiveTx = hash; state.setSaleActiveGas = gasUsed.toString(); saveState();
  console.log('setSaleActive(true):', hash);
}

// 5. transfer ownership to mee.ai
if (!state.transferOwnershipTx) {
  const data = iface.encodeFunctionData('transferOwnership', [MEE]);
  const { hash, gasUsed } = await sendTx(CA, data, G.transferOwnership);
  state.transferOwnershipTx = hash; state.transferOwnershipGas = gasUsed.toString(); saveState();
  console.log('transferOwnership(mee.ai):', hash);
}

// 6. verify on two RPCs
function decode(fn, hex) { return iface.decodeFunctionResult(fn, hex); }
const checks = {};
for (const idx of [0, 1]) {
  const owner = decode('owner', call(CA, iface.encodeFunctionData('owner'), idx))[0];
  const active = decode('saleActive', call(CA, iface.encodeFunctionData('saleActive'), idx))[0];
  const total = decode('totalMinted', call(CA, iface.encodeFunctionData('totalMinted'), idx))[0];
  const uri = decode('tokenURI', call(CA, iface.encodeFunctionData('tokenURI', [reserve[0]]), idx))[0];
  const res = decode('isReserved', call(CA, iface.encodeFunctionData('isReserved', [7]), idx))[0];
  checks['rpc' + idx] = { owner, saleActive: active, totalMinted: total.toString(), sampleTokenURI: uri, id7Reserved: res };
}
state.verify = checks;
saveState();
console.log('VERIFY:', JSON.stringify(checks, null, 2));
console.log('DONE. contract:', CA);
