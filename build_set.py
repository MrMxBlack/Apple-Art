#!/usr/bin/env python3
"""Apple Art full-set build: images -> PNG, tier assignment (seed 1999),
reserve selection, metadata generation with CID placeholder."""
import json, os, random, sys
from PIL import Image

BASE = os.path.expanduser("~/workspace/apple-art")
SAMPLES = os.path.join(BASE, "samples")
ASSETS = os.path.join(BASE, "assets")
IMG_DIR = os.path.join(ASSETS, "images")
META_DIR = os.path.join(ASSETS, "metadata")

SRC = {
    "common": "media-generation-apple-art-sample-common-0-96903636-48f8-41ed-a96f-70c1c23c70b4.webp",
    "rare": "media-generation-apple-art-sample-rare-0-1d55473d-8dc5-4b45-830d-ca9480486715.webp",
    "epic": "media-generation-apple-art-sample-epic-0-43447bb1-fc1f-4a40-a3a7-d71cc3d1f0df.webp",
    "legendary": "media-generation-apple-art-sample-legendary-0-0bc9578e-bc03-4a58-acad-8d9fbeed8340.webp",
}

TOTAL = 3333
TIER_COUNTS = [("Legendary", 99), ("Epic", 333), ("Rare", 899), ("Common", 2002)]
assert sum(c for _, c in TIER_COUNTS) == TOTAL

os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

# 1. Convert images to PNG at full original resolution
for tier_lower, fname in SRC.items():
    src = os.path.join(SAMPLES, fname)
    dst = os.path.join(IMG_DIR, tier_lower + ".png")
    im = Image.open(src)
    orig_size = im.size
    im.save(dst, "PNG")
    chk = Image.open(dst)
    assert chk.size == orig_size, (tier_lower, chk.size, orig_size)
    print(f"image {tier_lower}.png size={chk.size} mode={chk.mode}")

# 2. Deterministic tier assignment, seed 1999
ids = list(range(1, TOTAL + 1))
random.seed(1999)
random.shuffle(ids)
assignment = {}
pos = 0
legendary_order = []
for tier, count in TIER_COUNTS:
    for tid in ids[pos:pos + count]:
        assignment[str(tid)] = tier
        if tier == "Legendary":
            legendary_order.append(tid)
    pos += count
assert len(assignment) == TOTAL
with open(os.path.join(ASSETS, "assignment.json"), "w") as f:
    json.dump(assignment, f, indent=1, sort_keys=True)

# Reserve: first 33 Legendary ids in assignment order
reserve = legendary_order[:33]
assert len(reserve) == 33 and len(legendary_order) == 99
with open(os.path.join(ASSETS, "reserve.json"), "w") as f:
    json.dump({"reserveTokenIds": reserve}, f, indent=1)
print("reserve ids:", reserve)

# 3. Metadata files with placeholder CID
DESC = "Apple Art — a 3,333-piece origami apple collection on BNB Chain."
for tid in range(1, TOTAL + 1):
    tier = assignment[str(tid)]
    meta = {
        "name": f"Apple Art #{tid}",
        "description": DESC,
        "image": f"ipfs://__IMAGES_CID__/{tier.lower()}.png",
        "attributes": [
            {"trait_type": "Tier", "value": tier},
            {"trait_type": "Edition", "value": f"{tid} of 3333"},
        ],
    }
    with open(os.path.join(META_DIR, f"{tid}.json"), "w") as f:
        json.dump(meta, f, indent=1)
print("metadata files written")
