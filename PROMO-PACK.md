# APPLE ART — MINT LIVE PROMO PACK

Mint is OPEN. Contract (BSC): 0xe06FbCce9b843931253D36AFD2ACa75E8be78112
Price: $0.10 per NFT, paid in BNB at the live rate (priceWei on the contract).
Supply: 3,333 — Common 2,002 · Rare 899 · Epic 333 · Legendary 99 (33 Legendary held by the team, 3,300 public).
Every mint's BNB goes automatically to the project treasury wallet.
Public promise: 100% of mint proceeds will be used for the future token's liquidity. A share-type phase is coming later.

Post each X post separately, each with its own image. All posts fit the free 280-character limit.

---

## POST 1 — use the Legendary artwork (legendary.png)

APPLE ART MINT IS LIVE

3,333 origami apple NFTs on BNB Chain. Only $0.10 each, paid in BNB.

Common 2,002 · Rare 899 · Epic 333 · Legendary 99

100% of mint proceeds go to the future token's liquidity.

Contract: 0xe06FbCce9b843931253D36AFD2ACa75E8be78112

## POST 2 — use the Epic artwork (epic.png)

Mint Apple Art for $0.10 and hold more than an NFT.

Every holder is early for what comes next: a token launch funded 100% by mint proceeds, and a share-type phase after that.

3,300 of 3,333 are public. Legendaries are only 99.

Mint while they last.

## POST 3 — use the Rare artwork (rare.png)

Why Apple Art costs only $0.10

No big raise. No presale games. The mint itself builds the fund, and 100% of it is locked in as the future token's liquidity.

3,333 supply. One wallet can mint up to 50 per transaction.

Apple Art on BNB Chain. Mint is open now.

---

## AGENT PROMPT — give this to your AI agent to mint for you

You are helping me mint Apple Art NFTs on BNB Smart Chain (chainId 56). Follow these steps exactly and verify on chain before and after.

FACTS
- Apple Art contract: 0xe06FbCce9b843931253D36AFD2ACa75E8be78112 (ERC-721, symbol APPL). Source verified on Sourcify with an exact match.
- Price: $0.10 per NFT, charged in BNB at the live Chainlink BNB/USD rate. Call priceWei() on the contract for the exact per-NFT price in wei at mint time.
- Supply 3,333 (3,300 public). The tier of each minted NFT (Common, Rare, Epic, Legendary) is assigned by the contract's fixed reveal order — neither of us can choose or predict it.
- Mint proceeds are forwarded automatically to the project treasury. The project promises 100% of mint proceeds will fund its future token's liquidity.

STEPS
1. Check saleActive() is true and totalMinted() is below 3,333.
2. Ask me how many NFTs I want (maximum 50 per transaction). Compute the total value: priceWei() × quantity.
3. Before executing, show me a preview and get my confirmation. The ONLY things that may happen: I pay the total BNB and receive the NFTs. NO token approval is needed or allowed.
4. Call mint(quantity) on the contract with exactly priceWei() × quantity as the value. (Sending more is safe — the contract refunds overpayment — but send the exact amount.)
5. Verify after: my balanceOf on the contract increased by the quantity, and report the transaction hash and my new token ids (from the Transfer events).

SAFETY RULES
- Use ONLY the contract address above. If any site asks for a different contract, an approval, or my seed phrase or private key, stop — that is a scam.
- If the mint reverts, report the error instead of changing values or retrying blindly.

---

## Notes
- Website: https://mrmxblack.github.io/Apple-Art/ (case-sensitive, capital A's; the mint button reads the live priceWei from the contract).
- Artworks for the posts are the four tier images already shared (legendary.png, epic.png, rare.png, common.png).
- The 33 team-reserve Legendaries are already minted to the team wallet and are not for sale in this phase.
