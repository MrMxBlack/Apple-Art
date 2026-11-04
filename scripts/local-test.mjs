// Apple Art local tests on ganache. Run: node scripts/local-test.mjs
// Covers: price math at the MockFeed sample rate ($880), treasury forward +
// refund accounting, reserve-skip behavior, reserve cap, owner-only reserve
// mint, public supply cap (full 3,300 sellout), final total 3,333.
import ganache from "ganache";
import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const art = (n) => JSON.parse(readFileSync(join(root, "build", `${n}.json`), "utf8"));
const reserve = JSON.parse(readFileSync(join(root, "assets", "reserve.json"), "utf8")).reserveTokenIds;
const RESERVED = new Set(reserve.map(BigInt));
const TREASURY = "0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486";
const MEE = "0xB0cB52091aDd24aCb9542081a0f1d5a946998636";
const BASE = "ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log("  PASS", m)) : (fail++, console.log("  FAIL", m)); };
const eq = (a, b, m) => ok(a === b, `${m} (got ${a}, want ${b})`);
async function expectRevert(p, s, m) { try { await p; ok(false, m + " — no revert"); } catch (e) { const hay = [e.message, e.code, e?.revert?.name, e?.data, JSON.stringify(e?.revert ?? ""), JSON.stringify(e)].join(" "); const selOk = s === "OwnableUnauthorizedAccount" && typeof e?.data === "string" && e.data.startsWith("0x118cdaa7"); ok(hay.includes(s) || selOk, `${m} — reverted "${s}"`); } }

const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, chain: { chainId: 56 } }));
const owner = await provider.getSigner(0);
const buyer = await provider.getSigner(1);
const buyer2 = await provider.getSigner(2);
const O = await owner.getAddress();
const B = await buyer.getAddress();

async function deploy(name, signer, ...args) {
  const a = art(name);
  const f = new ethers.ContractFactory(a.abi, a.bytecode, signer);
  const c = await f.deploy(...args);
  await c.waitForDeployment();
  return c;
}

const gas = {};
const feed = await deploy("MockFeed", owner); // $880
const nftDeployTx = await (async () => {
  const a = art("AppleArt");
  const f = new ethers.ContractFactory(a.abi, a.bytecode, owner);
  const c = await f.deploy(await feed.getAddress(), BASE);
  const r = await c.deploymentTransaction().wait();
  gas.deploy = r.gasUsed;
  await c.waitForDeployment();
  return c;
})();
const nft = nftDeployTx;
const CA = await nft.getAddress();
console.log("AppleArt at", CA, "| deploy gas", gas.deploy.toString());

// --- constants / metadata wiring
eq(await nft.TREASURY(), TREASURY, "treasury is W2");
eq(await nft.MAX_SUPPLY(), 3333n, "max supply 3333");
eq(await nft.saleActive(), false, "sale starts closed");

// --- price math at $880 sample rate: $0.10 = 1e7 usd8 -> wei = 1e7*1e18/8.8e10
const expectPrice = (10_000_000n * 10n ** 18n) / 88_000_000_000n;
eq(await nft.priceWei(), expectPrice, "priceWei at $880 BNB/USD");

// --- mint while closed reverts
await expectRevert(nft.connect(buyer).mint(1, { value: expectPrice }), "sale closed", "mint blocked while sale closed");

// --- reserve setup: owner-only, cap 33
await expectRevert(nft.connect(buyer).setReserved(reserve), "OwnableUnauthorizedAccount", "setReserved is owner-only");
const srTx = await (await nft.connect(owner).setReserved(reserve)).wait();
gas.setReserved33 = srTx.gasUsed;
eq(await nft.reservedCount(), 33n, "33 ids reserved");
eq(await nft.isReserved(80), true, "id 80 reserved");
eq(await nft.publicRemaining(), 3300n, "public supply 3300 after reserve");
await expectRevert(nft.connect(owner).setReserved([7]), "reserve full", "34th reserve id rejected");

// --- open sale (record gas)
const saTx = await (await nft.connect(owner).setSaleActive(true)).wait();
gas.setSaleActive = saTx.gasUsed;

// --- underpayment reverts
await expectRevert(nft.connect(buyer).mint(1, { value: expectPrice - 1n }), "underpaid", "underpayment reverts");

// --- single mint: forward + ownership + accounting
const t0 = await provider.getBalance(TREASURY);
await (await nft.connect(buyer).mint(1, { value: expectPrice })).wait();
eq((await provider.getBalance(TREASURY)) - t0, expectPrice, "treasury received exactly priceWei");
eq(await provider.getBalance(CA), 0n, "contract holds 0 after mint");
eq(await nft.balanceOf(B), 1n, "buyer owns 1");
// first public id must be 1 (not reserved)
eq(await nft.ownerOf(1), B, "first public mint took id 1");
ok(!RESERVED.has(1n), "id 1 not reserved (sanity)");
eq(await nft.tokenURI(1), BASE + "1.json", "tokenURI(1)");

// --- overpay refund: contract still 0, treasury gets exactly cost, buyer refunded
const price = await nft.priceWei();
const bBefore = await provider.getBalance(B);
const tBefore = await provider.getBalance(TREASURY);
const overTx = await nft.connect(buyer).mint(2, { value: price * 2n + 999_999n });
const overRc = await overTx.wait();
const bAfter = await provider.getBalance(B);
eq((await provider.getBalance(TREASURY)) - tBefore, price * 2n, "treasury got exactly 2x price on overpay");
eq(await provider.getBalance(CA), 0n, "contract holds 0 after overpay mint");
const gasPaid = overRc.gasUsed * overRc.gasPrice;
eq(bBefore - bAfter, price * 2n + gasPaid, "buyer net spend = cost + gas only (refund worked)");

// --- reserve mint: owner-only, only reserved ids, to team wallet
await expectRevert(nft.connect(buyer).mintReserved(MEE, [80]), "OwnableUnauthorizedAccount", "mintReserved is owner-only");
await expectRevert(nft.connect(owner).mintReserved(MEE, [7]), "not reserved", "mintReserved rejects non-reserved id");
const rmTx = await (await nft.connect(owner).mintReserved(MEE, [80, 181])).wait();
gas.mintReserved2 = rmTx.gasUsed;
eq(await nft.ownerOf(80), MEE, "reserve id 80 minted to team wallet");
eq(await nft.ownerOf(181), MEE, "reserve id 181 minted to team wallet");

// --- reserve-skip stress + full sellout: mint the remaining public supply in batches
console.log("  ... minting the full public supply in batches of 50 (this takes a while)");
let seen = new Set([1n]);
for (const id of [2n, 3n]) seen.add(id); // from the overpay mint (ids 2,3 — none reserved)
let batches = 0;
while ((await nft.publicMinted()) < 3300n) {
  const remaining = 3300n - (await nft.publicMinted());
  const qty = remaining > 50n ? 50n : remaining;
  await (await nft.connect(buyer2).mint(qty, { value: price * qty })).wait();
  batches++;
}
console.log(`  ... ${batches} batches done`);
eq(await nft.publicMinted(), 3300n, "public supply sold out at 3300");
// scan every id 1..3333: owner is buyer/buyer2, MEE (reserve-minted), or nonexistent (still-reserved)
let publicHitReserved = 0, unminted = [];
for (let id = 1; id <= 3333; id++) {
  try {
    const ow = await nft.ownerOf(id);
    if (RESERVED.has(BigInt(id)) && ow !== MEE) publicHitReserved++;
  } catch { unminted.push(id); }
}
eq(publicHitReserved, 0, "no reserved id ever landed in a public wallet");
eq(unminted.length, 31, "exactly the 31 un-minted reserve ids remain");
ok(unminted.every((id) => RESERVED.has(BigInt(id))), "all unminted ids are reserved ids");

// --- sold out: further public mint reverts
await expectRevert(nft.connect(buyer).mint(1, { value: price }), "sold out", "public mint reverts after sellout");

// --- mint the remaining 31 reserve ids; final total = 3333
const rest = reserve.filter((id) => id !== 80 && id !== 181);
const rmAllTx = await (await nft.connect(owner).mintReserved(MEE, rest)).wait();
gas.mintReserved31 = rmAllTx.gasUsed;
eq(await nft.totalMinted(), 3333n, "total minted 3333 after reserve mints");
eq(await nft.balanceOf(MEE), 33n, "team wallet holds all 33 Legendaries");
await expectRevert(nft.connect(owner).mintReserved(MEE, [80]), "already minted", "double reserve mint reverts");

// --- ownership transfer gas (deploy flow step)
const toTx = await (await nft.connect(owner).transferOwnership(MEE)).wait();
gas.transferOwnership = toTx.gasUsed;
eq(await nft.owner(), MEE, "ownership transferred");

console.log("GAS:", Object.fromEntries(Object.entries(gas).map(([k, v]) => [k, v.toString()])));
writeFileSync(join(root, "build", "gas-report.json"), JSON.stringify(Object.fromEntries(Object.entries(gas).map(([k, v]) => [k, v.toString()])), null, 2));
console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
