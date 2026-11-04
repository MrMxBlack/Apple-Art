# Apple Art — Deployment Record

Status: **NOT DEPLOYED — deployer funding shortfall** (re-verified live 2026-11-04 ~22:20–22:45 Asia/Dhaka, two BSC RPCs in agreement).
The contract is compiled and tested locally; the deploy script is ready and resumable. Nothing was funded and nothing was deployed, per the funding gate rule.

## Contract

- Source: `contracts/AppleArt.sol` — ERC-721 "Apple Art", symbol `APPL`, solc 0.8.26, OpenZeppelin 5.1.0, optimizer 200 runs, Shanghai EVM. Bytecode 9,415 bytes.
- Constructor args (in `deploy/deploy.mjs`): Chainlink BNB/USD feed `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE` (BSC mainnet, same feed as G1999Presale — verified in `~/workspace/nft-launch/contracts/Genesis1999.sol`), base URI `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/` (set in the constructor, so no separate setBaseURI tx is needed).
- Treasury (hardcoded, immutable): `0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486` — 100% of every mint payment forwards there in the same transaction; if the forward fails the mint reverts; overpayments are refunded in the same transaction; the contract has no receive/fallback and no withdrawal path.
- Price: $0.10 per mint at the live Chainlink BNB/USD rate. Public supply 3,300; the 33 reserved Legendary ids (`assets/reserve.json`) are set on-chain via `setReserved` and are skipped by the public mint pointer; `mintReserved` is owner-only and mints them to the team wallet. Sale starts closed. No per-wallet cap (50 per tx anti-spam limit only). Minters pay their own gas.

## Local tests (ganache, `scripts/local-test.mjs`)

Full-suite runs cover: price math at a sample $880 BNB/USD rate, exact treasury forward + overpay refund (contract balance stays 0), reserve-skip over a complete 3,300-piece public sellout (no reserved id ever lands in a public wallet), the 33-id reserve cap, final total 3,333 with the team wallet holding all 33 Legendaries, and ownership transfer to the team wallet.
Across runs, 31–33 of 33 checks pass. Two checks are harness assertion-string mismatches only: OpenZeppelin 5.x reverts owner-only calls with the `OwnableUnauthorizedAccount` custom error, whose name does not survive ethers/ganache error stringification in this harness — the reverts themselves are verified (non-owner calls change nothing; owner calls succeed). One run also showed a single flaky treasury-balance read (delta 0) in the harness; a focused isolation test (fresh deploy, mint 1, measure treasury delta) passed 3/3 runs with the delta exactly equal to the mint price.

Measured gas (`build/gas-report.json`):

| Step | Gas |
|---|---|
| Deploy | 2,096,607 |
| setReserved (33 ids) | 891,089 |
| setSaleActive(true) | 46,922 |
| transferOwnership | 28,675 |
| **Core total** | **3,063,293** |
| Reserve mints (all 33) | 1,048,474 |

## Deployer

- Temporary deployer EOA: **`0x066904bCa722825A936520C28C8568E351f0b887`** (key in `deploy/deployer.json`, local only, chmod 600, gitignored — never committed or printed).
- Balance: 0 BNB.
- Ownership transfers to the mee.ai wallet `0xB0cB52091aDd24aCb9542081a0f1d5a946998636` as the final deploy step.

## Funding gate (why it is not deployed)

Live BSC gas price: 0.05 gwei (50,000,000 wei), confirmed on two RPCs.

- Core need (deploy + setReserved + open sale + transfer ownership): 3,063,293 gas = 0.00015316 BNB; with the required 30% buffer: **0.00019911 BNB**.
- Full need (core + all 33 reserve mints, buffered): **0.00026726 BNB**.
- Agent (mee.ai) wallet balance: **0.00026606 BNB**. The funding rule requires leaving at least 0.00008 BNB in it, so at most **0.00018606 BNB** could be spared — **0.00001305 BNB short of the buffered core need**, before the funding transfer's own gas (~0.00000105 BNB). Per the rule, the deployer was NOT funded and nothing was deployed.

**To unblock:** send **0.00030 BNB** to the deployer `0x066904bCa722825A936520C28C8568E351f0b887` — that covers deploy + configuration + all 33 reserve mints with buffer. A smaller top-up of **0.00021 BNB** covers deploy + configuration (the reserve mints can be finished by the owner afterwards). Then run `node deploy/deploy.mjs` — it deploys, sets the 33 reserved ids, mints the reserve Legendaries to the team wallet, opens the sale, transfers ownership to mee.ai, and verifies the final state on two RPCs.

## Sourcify

Pending deployment. After deploy: `node scripts/verify-sourcify.mjs <address> AppleArt.sol:AppleArt <creationTxHash>`.

## Deploy txs

- None yet. Reserve mints: 0 of 33 (all 33 ids remain protected once `setReserved` runs at deploy time).

## GitHub

- Repo: **https://github.com/MrMxBlack/apple-art** (public).
- History: repo creation via the GitHub connector failed on 2026-11-04 (`403 Resource not accessible by integration` — the Muse GitHub App cannot create repositories). The user created the repo manually (initial commit `0d3ac39b32560b23b43afc7c00ea9d045cd69d4d`, placeholder `# apple-art` README), made it public, and the app installation could then access it.
- **Upload completed 2026-11-04 ~23:0x Asia/Dhaka** via connector snapshot pushes to `main`:
  - Batch 1 — commit `94f99a4c63507128ab084ae79df7a2e67644351c`: `assets/metadata/1.json`–`2000.json` (2,000 files).
  - Batch 2 — commit `c65651a59ea491318171fa19b3e71816b44efb28`: `assets/metadata/2001.json`–`3333.json` plus contracts, scripts, docs (README.md, PLAN.md, BUILD-RESULT.md, DEPLOY.md, .gitignore), `assets/assignment.json`, `assets/reserve.json`, build artifacts, root helper scripts, and `deploy/deploy.mjs` (1,353 files).
  - Total pushed: **3,353 UTF-8 text files (~1.31 MB)**. The placeholder README was replaced by the project README.
  - Verified after push: root listing, `contracts/` (AppleArt.sol, MockFeed.sol), `assets/` (assignment.json, reserve.json, metadata/), and `deploy/` (deploy.mjs only) all present; README read back with the liquidity commitment and share-phase teaser intact; metadata spot-checks (1, 1000, 1001, 2000, 2001, 2500, 3333) byte-identical to local. (The GitHub contents API caps directory listings at 1,000 entries, so the metadata count was verified by the validated push manifests + spot-checks rather than a full listing.)
  - **Not pushed:** `deploy/deployer.json` (secret key material — excluded and verified absent; remote `deploy/` contains only `deploy.mjs`); the 4 tier PNGs in `assets/images/` (8.4 MB binary — the connector snapshot push is UTF-8 text only; they are publicly hosted on IPFS, CID `bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm`, gateway links in README.md, and can be added later via a normal git push); `metadata.car` (binary); `samples/` (4 WebP images + generation sidecar JSONs, working files not part of the prepared snapshot).
  - Sync record: `~/workspace/apple-art.muse-github-snapshot-sync.json`.
