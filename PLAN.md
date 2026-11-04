# Apple Art — NFT Collection Plan

Created 2026-11-04 (Asia/Dhaka). Owner: Rohan. Status: ART + METADATA SET BUILT 2026-11-04 (see BUILD-RESULT.md) — images pinned to IPFS via Pinata, metadata pinned to IPFS via Filebase. Contract/deploy still pending.

## IPFS

- **Images CID:** `bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm` (Pinata)
- **Metadata CID:** `bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym` (Filebase, CAR import) — contract base URI `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/`

## Final spec (user-decided 2026-11-04)

- **Name:** Apple Art
- **Chain:** BSC (BNB Chain, 56)
- **Total supply:** 3,333
- **Mint price:** $0.10 per NFT (BNB at live rate at launch; max gross ~$333)
- **Tiers:**
  - Common: 2,002
  - Rare: 899
  - Epic: 333
  - Legendary: 99
- **Team reserve:** 33 of the 99 Legendaries stay in team hands (reserve-minted to the team wallet). Public Legendaries: 66.
- **Proceeds:** 100% of mint payments auto-forward to the user's Binance wallet W2 (0x36ab2cb68475cfdb4b7da0c33e20b4c1a1837486), hardcoded in the contract. The contract itself holds no funds.
- **Minters pay their own gas** (same as Genesis1999).

## Purpose

Fund collection (~$333 max) with a low $0.10 entry so the full supply can realistically sell out.

## Public commitments (user, 2026-11-04 ~21:58 — must appear in the GitHub README and launch copy)

- **100% of mint proceeds will be used later for the token's liquidity.** Every $0.10 that comes in goes to future token liquidity — nothing else.
- **A share-type phase is coming later** (teaser only; details not yet defined).

## Build steps (pattern proven with Genesis1999)

1. Art: apple-themed characters, tier-differentiated (accessories/backgrounds/special effects for Epic & Legendary). Generate samples → user approval → full set.
2. Metadata + IPFS upload (Pinata/Filebase/Lighthouse connectors available).
3. Contract: ERC-721, tier-aware mint, USD price via Chainlink BNB/USD live rate (like G1999 presale) — DECIDED 2026-11-04: the buyer pays "$0.10 worth of BNB" at the live rate at mint time, NOT a fixed BNB amount; treasury = W2 hardcoded, per-mint forward; owner = mee.ai wallet; reserve mint function for the 33 Legendaries.
4. Deploy via temporary deployer EOA (baw cannot deploy), transfer ownership to mee.ai, verify on Sourcify.
5. Mint page (GitHub Pages, like genesis1999 site) + launch posts for X (@MrKqyre / project account), short ≤280 chars, one by one with images.

## Open items

- Art direction approval (samples first).
- Price mechanics: DECIDED 2026-11-04 — Chainlink USD-pegged live rate ("$0.10 worth of BNB"); no fixed-BNB pricing anywhere.
- Whether G1999 holders get any perk (not decided; user has not asked).
- Project X account: reuse @Genesis1999G or new account (user's Genesis1999 X password is forgotten; reset pending user's decision).
