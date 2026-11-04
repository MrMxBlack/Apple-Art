# Apple Art — Full Public Details

Everything public about the Apple Art collection in one place. Last updated 2026-11-05 (Asia/Dhaka), with the live contract state re-checked on two BSC RPC endpoints at update time.

## Live links

- **Mint website:** https://mrmxblack.github.io/Apple-Art/
  - Note: the address is case-sensitive. `Apple-Art` has capital A's — the lowercase `apple-art` address returns 404.
- **GitHub repository:** https://github.com/MrMxBlack/Apple-Art
- **Contract (BscScan):** https://bscscan.com/address/0xe06FbCce9b843931253D36AFD2ACa75E8be78112
- **Sourcify verification:** exact match (creation + runtime), matchId 58399145

## Collection

- **Name / symbol:** Apple Art (APPL), ERC-721
- **Chain:** BNB Smart Chain (BSC, chain id 56)
- **Supply:** 3,333 total — token ids 1 to 3333
- **Tiers:** Common 2,002 · Rare 899 · Epic 333 · Legendary 99
- **Artwork:** one soft origami-paper artwork per tier
- **Team reserve:** 33 of the 99 Legendaries, reserved on-chain and minted to the team wallet at deployment. The public mint skips these ids automatically.
- **Public supply:** 3,300

## Contract

- **Address:** `0xe06FbCce9b843931253D36AFD2ACa75E8be78112`
- **Owner:** `0xB0cB52091aDd24aCb9542081a0f1d5a946998636` (the mee.ai agent wallet)
- **Treasury (hardcoded, immutable):** `0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486`
  - Every mint payment is forwarded to this wallet inside the same transaction. The contract never holds mint funds and has no withdrawal path for them.
- **Price:** $0.10 per NFT, charged in BNB at the live Chainlink BNB/USD rate (feed `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`). Call `priceWei()` for the exact per-NFT price in wei at mint time — it moves with the BNB price.
  - Sample at the 2026-11-05 check: `priceWei()` = 139,613,371,761,076 wei (0.000139613371761076 BNB).
- **Mint function:** `mint(quantity)`, payable. Maximum 50 per transaction. No token approval is needed. Overpayment is refunded in the same transaction. Minters pay their own gas.
- **Website limit (owner decision, 2026-11-05):** the official website limits minting to **5 NFTs per wallet** — the quantity picker caps at 5 and the mint flow checks the connected wallet's current Apple Art balance before sending. This limit is enforced by the website only. The contract itself has no per-wallet cap, so direct contract calls can still mint up to 50 per transaction.
- **Base URI:** `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/`

## Live status (checked 2026-11-05, two RPCs agree)

- `saleActive()` = **true** — the public mint is OPEN
- `totalMinted()` = **33** — only the 33 team-reserve Legendaries so far
- Public minted: 0 · Public remaining: 3,300
- Team wallet `balanceOf` = 33 (all reserve Legendaries)

## Public commitments

1. **100% of mint proceeds will be used for the future Apple Art token's liquidity.** Nothing else.
2. **A share-type phase for holders is planned after the mint and token.** Details will be announced when ready.

## Deployment record (2026-11-05)

- Funding: 0.00030 BNB from the mee.ai agentic wallet to the deployer EOA `0x066904bCa722825A936520C28C8568E351f0b887`, tx `0x4fc23f4602282fcc7941f85882feb02ce4ea476736ba627d2e7b892771dcda09`

| Step | Tx | Gas used |
|---|---|---|
| Deploy AppleArt | `0x67bbb3b85f94220eece58633b863cc1815d11863c8b36d61bcdedb8571c33fb7` | 2,096,607 |
| setReserved(33) | `0x60e562b09c2073630cbd3e17670a9fdcc10d4ab5d6cce1dfc25fac96c0219e6d` | 891,089 |
| mintReserved batch 1 (11 ids) | `0x25ef6da97e7e768c0c1c9f1bd1e79d1de8322f1992c82ed02db1f34dc677ae5f` | 385,146 |
| mintReserved batch 2 (11 ids) | `0x70ac76e7ced5e5b6bce4736c80df14081e96b9447afe61bb4ae23632b50bfaf3` | 350,934 |
| mintReserved batch 3 (11 ids) | `0x703541236df392913b52737ec69dfe6437b2c99bf559a39ca16f0b139693c5db` | 350,922 |
| setSaleActive(true) | `0x75cf5e3d21c417702d29657a5343be72e2a157c62f2e682549ffdb85ed2eb911` | 46,922 |
| transferOwnership(team wallet) | `0xfaf9b1db2affd5a7bab3c4730674b5c31009d821e8f20e7ce61cdb1a1236291d` | 28,675 |

- Total deployment gas: 4,150,295 gas = 0.00020751475 BNB. Deployer remainder 0.00009248525 BNB stays in the deployer EOA.
- Full record: `DEPLOY.md`. Machine-readable record: `deploy/state.json`.

## Team-reserve Legendary ids (33)

2065, 523, 1690, 1383, 710, 2541, 1355, 1835, 3094, 2958, 1546, 2420, 322, 3064, 3071, 821, 1411, 1107, 2793, 856, 2007, 234, 181, 949, 1271, 2611, 2911, 1564, 878, 2506, 1146, 2413, 80

Also published in `assets/reserve.json`. The full tier assignment for all 3,333 ids is in `assets/assignment.json`.

## Artwork and metadata (IPFS)

- **Images CID:** `bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm`
  - Common: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/common.png
  - Rare: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/rare.png
  - Epic: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/epic.png
  - Legendary: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/legendary.png
- **Metadata CID:** `bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym`
- All 3,333 metadata files are also in this repo under `assets/metadata/`.

## How to mint

1. **Website:** open https://mrmxblack.github.io/Apple-Art/ , connect a BSC wallet, choose a quantity, mint. The site reads the live `priceWei()` from the contract.
2. **With an AI agent:** give your agent the prompt in `MINT-PROMPT.md`.
3. **Direct contract call:** call `mint(quantity)` on `0xe06FbCce9b843931253D36AFD2ACa75E8be78112` with `priceWei()` × quantity as the value.

## Safety

- The ONLY official contract is `0xe06FbCce9b843931253D36AFD2ACa75E8be78112`. The ONLY official website is https://mrmxblack.github.io/Apple-Art/ and the ONLY official repo is https://github.com/MrMxBlack/Apple-Art .
- Minting needs **no token approval**. Any site that asks for an approval, a different contract, or your seed phrase or private key is a scam. Never share a seed phrase or private key with anyone, including an AI agent.
