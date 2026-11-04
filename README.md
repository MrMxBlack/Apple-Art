# 🍎 Apple Art

**Apple Art** is a 3,333-piece origami apple NFT collection on BNB Chain (BSC).
One artwork per tier, soft origami-paper mascots — and a simple, public promise about where the money goes.

- **Supply:** 3,333 (token ids 1–3333)
- **Mint price:** $0.10 per NFT, paid in BNB at the live Chainlink BNB/USD rate
- **Tiers:** Common 2,002 · Rare 899 · Epic 333 · Legendary 99
- **Team reserve:** 33 of the 99 Legendaries are reserved on-chain for the team; the public mint can never reach them. Public supply: 3,300.
- **Contract:** `0xe06FbCce9b843931253D36AFD2ACa75E8be78112` — deployed 2026-11-05, Sourcify exact match
- **Chain:** BNB Chain (BSC, chain id 56)
- **Mint website:** https://mrmxblack.github.io/Apple-Art/ (case-sensitive — capital A's; the lowercase address returns 404)
- **Status: MINT IS LIVE.** Sale open; at the last check (2026-11-05) 33 minted (the team reserves), 3,300 public remaining. Full details: `DETAILS.md`. Agent mint prompt: `MINT-PROMPT.md`.

## 💧 Where the mint money goes — our public commitment

**100% of mint proceeds will be used for the future token's liquidity.**

Every $0.10 mint is forwarded by the contract, in the same transaction, to the
project treasury wallet — the contract itself never holds funds, and there is
no withdrawal path for mint proceeds. When the Apple Art token launches, the
full amount collected from this mint goes into its liquidity pool. Nothing
else. You can verify every forward on-chain.

- **Treasury wallet (hardcoded in the contract):** `0x36aB2cB68475CfDb4B7da0c33e20b4C1a1837486`

## 🔜 Coming later: a share-type phase

After the mint and the token, a **share-type phase** is planned for Apple Art
holders. Details will be announced when it is ready — minting and holding an
Apple Art NFT is how you take part from the start.

## Artwork & metadata (IPFS)

- **Images CID:** `bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm`
  - Common: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/common.png
  - Rare: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/rare.png
  - Epic: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/epic.png
  - Legendary: https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/legendary.png
- **Metadata CID:** `bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym`
- **Contract base URI:** `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/`

Tier assignment is deterministic and published in this repo
(`assets/assignment.json`); the 33 team-reserved Legendary ids are in
`assets/reserve.json`.

## How the mint works

- `mint(quantity)` — pay $0.10 worth of BNB per NFT at the live Chainlink
  BNB/USD rate. The charge is forwarded to the treasury in the same
  transaction; any overpayment is refunded in the same transaction. If the
  treasury forward fails, the mint reverts.
- The public mint hands out token ids in order, automatically skipping the
  33 reserved ids.
- `mintReserved(...)` — owner-only; mints reserved ids to the team wallet.
- The sale was opened by the owner on 2026-11-05 after the reserve set was
  minted, and is open now. Minters pay their own gas. No per-wallet cap
  in the contract (50 per transaction maximum). The official website
  limits minting to 5 per wallet (website-enforced only, since
  2026-11-05).

## Repository contents

- `contracts/` — `AppleArt.sol` (the collection contract) and `MockFeed.sol` (test-only)
- `scripts/` — build, local tests, deploy, Sourcify verification
- `assets/` — the 4 tier artworks (PNG), `assignment.json`, `reserve.json`, and the full 3,333-file `metadata/` folder
- `PLAN.md`, `BUILD-RESULT.md`, `DEPLOY.md` — plan, build record, deployment record
- `DETAILS.md` — every public detail in one place (live links, contract, deployment record, live status)
- `MINT-PROMPT.md` — the prompt to give an AI agent so it can mint for you
- `PROMO-PACK.md` — launch posts and promo material

## License

MIT
