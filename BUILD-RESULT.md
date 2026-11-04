# Apple Art — Build Result

Built 2026-11-04 (Asia/Dhaka). Art + metadata set complete. Contract/deploy NOT started (separate step).

## Artwork

- One approved design per tier, converted from the approved WebP samples to PNG at full original resolution (1600×1600, no upscaling).
- Files: `~/workspace/apple-art/assets/images/common.png`, `rare.png`, `epic.png`, `legendary.png`

## Tier assignment

- tokenIds 1..3333, deterministically shuffled with Python `random.seed(1999)`, tiers assigned in order Legendary 99, Epic 333, Rare 899, Common 2002.
- Full map: `~/workspace/apple-art/assets/assignment.json`
- Verified counts (assignment.json AND all 3,333 metadata files agree):
  - Common: 2,002
  - Rare: 899
  - Epic: 333
  - Legendary: 99
  - Total: 3,333 ✓

## Team reserve (33 Legendaries)

First 33 Legendary ids in assignment order, saved to `~/workspace/apple-art/assets/reserve.json`:

2065, 523, 1690, 1383, 710, 2541, 1355, 1835, 3094, 2958, 1546, 2420, 322, 3064, 3071, 821, 1411, 1107, 2793, 856, 2007, 234, 181, 949, 1271, 2611, 2911, 1564, 878, 2506, 1146, 2413, 80

(Public Legendaries: the other 66.)

## Metadata

- 3,333 files `~/workspace/apple-art/assets/metadata/1.json` .. `3333.json`, each pointing at `ipfs://<IMAGES_CID>/<tier>.png` with Tier + Edition attributes. Verified programmatically against assignment.json.

## IPFS

- **Images CID: `bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm`** — pinned via the Pinata connector (pin name "Apple Art images", 4 files, 8,723,146 bytes). Verified live: `https://gateway.pinata.cloud/ipfs/bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm/common.png` returns 200 image/png, so files sit at the CID root exactly as the metadata expects.
- **Metadata CID: `bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym`** — pinned via **Filebase** on 2026-11-04 (the Genesis1999 route). Contract base URI: `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/`.
  - History: the metadata folder upload to Pinata failed with HTTP 400 ("The number of files being added would exceed your account's pin limit" — free plan, 500 pinned-file cap). Lighthouse was tried next and failed: `node.lighthouse.storage` drops the connection from this machine (RemoteDisconnected, same as documented 2026-10-31). A direct Filebase folder add (`/api/v0/add`) also failed with HTTP 403: "Free accounts are limited to 500 IPFS pins" (it pins every file individually).
  - What worked: built a CAR locally with Kubo (`ipfs add -r --cid-version=1` on the metadata folder → root CID above; `ipfs dag export` → `~/workspace/apple-art/metadata.car`, 1,462,300 bytes) and imported it via Filebase `/api/v0/dag/import?pin-roots=true` (script `~/workspace/nft-launch/scripts/filebase-car-import.py`). Import response: root pinned, no PinErrorMsg; Filebase pin count went 7 → 8 (exactly one new root pin).
  - Verified live: `https://ipfs.filebase.io/ipfs/bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/1.json` returns 200 and parses (Apple Art #1, Tier Common, image → images CID `common.png`); `/2065.json` (Legendary, first reserve id) returns 200 and parses (Tier Legendary, image → `legendary.png`); `/3333.json` returns 200 via the Pinata gateway, so the folder also resolves on the public network.

## Scripts

- `~/workspace/apple-art/build_set.py` — images, assignment, reserve, metadata generation.
- `~/workspace/apple-art/verify_set.py` — independent verification (recomputes the seed-1999 shuffle; all checks passed).
- `~/workspace/apple-art/upload_ipfs.py` — Pinata upload driver.

## Next steps (not done here)

1. ~~Pin the metadata folder~~ DONE 2026-11-04 — metadata CID `bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym` (Filebase), contract base URI `ipfs://bafybeigxo2xdalldu73esficzhnu62q5knc6v2bh4xdxn6bu52dk6cz2ym/`.
2. Contract + deploy (treasury W2 hardcoded, $0.10 mint, reserve mint of the 33 Legendary ids above).
