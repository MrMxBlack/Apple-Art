# Apple Art — Deployment Record

Status: **DEPLOYED AND LIVE 2026-11-05 ~00:5x Asia/Dhaka** — contract **`0xe06FbCce9b843931253D36AFD2ACa75E8be78112`** (BSC), sale OPEN, Sourcify exact_match. Full record in the "Deploy txs" and "Sourcify" sections below.

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
- Balance after deploy: 0.00009248525 BNB (funded 0.00030, spent 0.00020751475 on deploy gas).
- Ownership transfers to the mee.ai wallet `0xB0cB52091aDd24aCb9542081a0f1d5a946998636` as the final deploy step.

## Funding gate (why it was not deployed earlier — resolved 2026-11-05)

Live BSC gas price: 0.05 gwei (50,000,000 wei), confirmed on two RPCs.

- Core need (deploy + setReserved + open sale + transfer ownership): 3,063,293 gas = 0.00015316 BNB; with the required 30% buffer: **0.00019911 BNB**.
- Full need (core + all 33 reserve mints, buffered): **0.00026726 BNB**.
- Agent (mee.ai) wallet balance: **0.00026606 BNB**. The funding rule requires leaving at least 0.00008 BNB in it, so at most **0.00018606 BNB** could be spared — **0.00001305 BNB short of the buffered core need**, before the funding transfer's own gas (~0.00000105 BNB). Per the rule, the deployer was NOT funded and nothing was deployed.

**Resolution (2026-11-05):** the user topped up the agentic wallet instead and ordered the deploy funded from it — 0.00030 BNB was sent W1 → deployer and `node deploy/deploy.mjs` ran to completion. See "Deploy txs" below.

## Website

- Built 2026-11-04 (dark Web3 single-page site): hero with the Legendary artwork, live stats, tiers section with all 4 artworks, how-it-works (BNB at the live rate, proceeds auto-forward to treasury, 100% of proceeds to future token liquidity), token + share-phase teaser, transparency section (treasury, 33-Legendary reserve, IPFS CIDs, GitHub), mint panel with quantity selector and live BNB estimate, FAQ. English, mobile responsive, images loaded from the IPFS gateway (Pinata, with an ipfs.io fallback in JS).
- Sources: `~/workspace/apple-art/site/` (`index.html`, `styles.css`, `app.js`); identical copies live in this repo under `docs/` (commit `3bdc5b3ba1d5facbe57e8f928649fe3558b48b3d`, read-back verified via the connector).
- Standalone preview for the user: `~/workspace/your_files/apple-art-website.html` (CSS/JS inlined, images from IPFS — opens without hosting).
- Mint wiring: `docs/app.js` has one clearly marked `CONFIG.contractAddress` constant at the top. It was EMPTY until deployment (site ran in "Mint — Opening Soon" mode, button disabled, CoinGecko-based BNB estimates). **Set 2026-11-05 to the deployed contract `0xe06FbCce9b843931253D36AFD2ACa75E8be78112`** — the button goes live, prices switch to the exact on-chain `priceWei()`, minted/remaining counts go live, and the transparency section shows the address.
- **GitHub Pages: enabled by the user 2026-11-04 ~23:28 Asia/Dhaka** (GitHub's repo list shows `has_pages = true`), but `https://mrmxblack.github.io/apple-art/` still returns 404.
- **404 fix applied 2026-11-04 ~23:39 +06 (belt and braces, commit `972f1a5b2e08569b9ccc0bdc2b5392aff667307e`):** the same site files were also pushed to the repo ROOT (`index.html`, `styles.css`, `app.js`), and an empty `.nojekyll` was added at BOTH the root and `docs/` so Pages skips Jekyll processing entirely. The site now works with the Pages source folder set to either `/ (root)` or `/docs`. Read-back verified: root listing shows `index.html`, `styles.css`, `app.js`, `.nojekyll` (and the sync record entry was appended).
- **Check result:** the URL was polled with curl 8 times over ~8 minutes after the fix push (17:40–17:47 UTC) — **still HTTP 404 on every attempt**. The files are confirmed present at both candidate source folders, so the remaining cause sits in the Pages settings themselves, which the connector cannot read or change (no Pages tool): the selected branch/folder the user actually saved is unverified, or the Pages build is stuck/failed. **User step:** repo → Settings → Pages → confirm Source: "Deploy from a branch", Branch: `main`, folder `/docs` (or `/ (root)` — both now work) → Save, and check the top of that page for a "Your site is live at…" line or a build error banner, then re-check `https://mrmxblack.github.io/apple-art/`.
- **Settings confirmed + build retrigger 2026-11-05 ~00:0x +06:** the user sent a screenshot of the Pages settings (2026-11-04 23:50 +06) showing Source "Deploy from a branch", Branch `main`, folder `/docs`, and the text "Your GitHub Pages site is currently being built from the /docs folder in the main branch" — so the settings are correct. The URL nevertheless stayed 404 for ~25 minutes, indicating a stuck build. **Retrigger commit `691236d8be7a1e50924f74c83172f9002f87f52c`** ("Retrigger GitHub Pages build") appended one comment line (`<!-- pages build retrigger 2026-11-05 -->`) to `docs/index.html` only; read-back verified (remote blob SHA `a0bfd20fa8ce2e7be3f1e9a225dc880f871892ae` matches the local file exactly, comment line present at the tail). **Check result:** the URL was polled with curl 10 times over ~10 minutes after the retrigger (18:10–18:19 UTC) — **still HTTP 404 on every attempt**. The build remains stuck on GitHub's side despite a fresh commit on the confirmed-correct source; the connector has no Pages API to inspect or force the build. Next options if it stays 404: the user toggles the Pages source in Settings (e.g. switch folder to `/ (root)`, Save, or set Source to None, Save, then back to branch `main` + `/docs`, Save) to force a fresh build, and checks for a build error banner at the top of the Pages settings page.
- **Contract wired into the website 2026-11-05 ~01:0x +06 (commit `f3e0b43976bb49da9a1db906f5215d2ec5ba6c6d`):** `CONFIG.contractAddress` set to `0xe06FbCce9b843931253D36AFD2ACa75E8be78112` in `site/app.js`, `docs/app.js`, the repo-root `app.js`, and the standalone preview `~/workspace/your_files/apple-art-website.html` (all four updated locally; the three repo copies pushed in ONE snapshot commit with the updated DEPLOY.md — exactly the paths `app.js`, `docs/app.js`, `DEPLOY.md`, no key material). Pre-push checks: remote head `691236d8…` matched the sync record, and remote head == sync base for all three paths (no divergence); the only remote→local diffs were the one contractAddress line in each app.js and the deployment record in DEPLOY.md. **Read-back verified:** `docs/app.js` fetched at the new commit shows the contract address in `CONFIG.contractAddress`. Sync record appended (8 entries). **Pages poll result:** `https://mrmxblack.github.io/apple-art/` polled with curl 8 times over ~8 minutes after this push — **still HTTP 404 on every attempt**; the push did not unstick the build within that window. The website code is fully live-ready in the repo; only the GitHub-side Pages build remains outstanding.

## Sourcify

**Verified — exact_match** (creation + runtime), matchId **58399145**, verifiedAt 2026-11-04T19:00:25Z. Run: `node scripts/verify-sourcify.mjs 0xe06FbCce9b843931253D36AFD2ACa75E8be78112 AppleArt.sol:AppleArt 0x67bbb3b85f94220eece58633b863cc1815d11863c8b36d61bcdedb8571c33fb7`; confirmed via the Sourcify v2 API (`match: exact_match`).

## Deploy txs (2026-11-05 Asia/Dhaka)

Funding (user-ordered, from the mee.ai agentic wallet — the user confirmed the money was in the agentic wallet; the direct-user-top-up plan was superseded):

- **Fund deployer: 0.00030 BNB** W1 → deployer `0x066904bCa722825A936520C28C8568E351f0b887`, tx **`0x4fc23f4602282fcc7941f85882feb02ce4ea476736ba627d2e7b892771dcda09`** (block 131676879, gasUsed 21,000; clean baw preview — pure BNB send, no risks/approvals; deployer balance verified 0.00030 BNB on two RPCs).

Deploy run (`node deploy/deploy.mjs`; one script bug fixed first — `art.bytecode` lacked the `0x` prefix ethers requires for tx `data`, line 110):

| Step | Tx | Gas used |
|---|---|---|
| Deploy AppleArt | `0x67bbb3b85f94220eece58633b863cc1815d11863c8b36d61bcdedb8571c33fb7` | 2,096,607 |
| setReserved(33) | `0x60e562b09c2073630cbd3e17670a9fdcc10d4ab5d6cce1dfc25fac96c0219e6d` | 891,089 |
| mintReserved batch 1 (11 ids) | `0x25ef6da97e7e768c0c1c9f1bd1e79d1de8322f1992c82ed02db1f34dc677ae5f` | 385,146 |
| mintReserved batch 2 (11 ids) | `0x70ac76e7ced5e5b6bce4736c80df14081e96b9447afe61bb4ae23632b50bfaf3` | 350,934 |
| mintReserved batch 3 (11 ids) | `0x703541236df392913b52737ec69dfe6437b2c99bf559a39ca16f0b139693c5db` | 350,922 |
| setSaleActive(true) | `0x75cf5e3d21c417702d29657a5343be72e2a157c62f2e682549ffdb85ed2eb911` | 46,922 |
| transferOwnership(mee.ai) | `0xfaf9b1db2affd5a7bab3c4730674b5c31009d821e8f20e7ce61cdb1a1236291d` | 28,675 |

- Total deploy gas: 4,150,295 gas = **0.00020751475 BNB** at 0.05 gwei; deployer remainder **0.00009248525 BNB** (stays in the deployer EOA).
- **Contract: `0xe06FbCce9b843931253D36AFD2ACa75E8be78112`.**

Final state verified on two RPCs (dataseed1 + dataseed3):

- `owner()` = `0xB0cB52091aDd24aCb9542081a0f1d5a946998636` (mee.ai) ✓
- `saleActive()` = true — **the public sale is OPEN** ✓
- `totalMinted()` = 33; mee.ai `balanceOf` = 33 (all 33 reserve Legendaries held by the team wallet) ✓
- `TREASURY()` = `0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486` (W2) ✓
- `priceWei()` = 139,610,286,067,605 wei (~$0.10 at the live Chainlink rate) ✓
- Sample `tokenURI(2065)` = `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/2065.json` ✓

Next step (not done here): set `CONFIG.contractAddress` in the site `app.js` (local `site/` + `docs/` copies and the pushed repo copies) to the contract address so the website mint button goes live.

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

## Update 2026-11-05 ~01:16 +06 — website LIVE (case solved)

The Pages 404 mystery is solved: the repository name is `Apple-Art` with capital A's, and GitHub Pages addresses are case-sensitive. The site is LIVE at **https://mrmxblack.github.io/Apple-Art/** (HTTP 200, correct title, and the served `app.js` contains the live contract address — the mint button is live). The lowercase `apple-art` address returns 404 and always will. All public links must use the capital form.

## Update 2026-11-05 — full details published

`DETAILS.md` (all public details in one place), `MINT-PROMPT.md` (agent mint prompt), and `PROMO-PACK.md` (launch posts) were added, and `README.md` was updated with the deployed contract address, the live website link, and the live mint status. Live state re-checked on two RPCs at update time: saleActive true, totalMinted 33 (reserves only), public remaining 3,300, priceWei 139,613,371,761,076 wei.
