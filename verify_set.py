#!/usr/bin/env python3
"""Independent verification of the Apple Art set."""
import json, os, random
from collections import Counter
from PIL import Image

BASE = os.path.expanduser("~/workspace/apple-art/assets")
IMAGES_CID = "bafybeiaiilulbxxqn2kuk6q6xtzroft3yggtp46efmja5wayacgzrwotxm"
SPEC = {"Legendary": 99, "Epic": 333, "Rare": 899, "Common": 2002}

assignment = json.load(open(os.path.join(BASE, "assignment.json")))
assert len(assignment) == 3333, len(assignment)
assert set(int(k) for k in assignment) == set(range(1, 3334))
counts = Counter(assignment.values())
assert counts == Counter(SPEC), counts
print("assignment tier counts:", dict(counts))

# Independently recompute the shuffle to confirm determinism + reserve order
ids = list(range(1, 3334))
random.seed(1999)
random.shuffle(ids)
order = [("Legendary", 99), ("Epic", 333), ("Rare", 899), ("Common", 2002)]
recomputed, pos, leg_order = {}, 0, []
for tier, n in order:
    for tid in ids[pos:pos + n]:
        recomputed[str(tid)] = tier
        if tier == "Legendary":
            leg_order.append(tid)
    pos += n
assert recomputed == assignment, "assignment does not match seed-1999 recomputation"
reserve = json.load(open(os.path.join(BASE, "reserve.json")))["reserveTokenIds"]
assert reserve == leg_order[:33], "reserve mismatch"
assert all(assignment[str(t)] == "Legendary" for t in reserve)
print("reserve (33, all Legendary, first 33 in assignment order):", reserve)

# Metadata files
files = [f for f in os.listdir(os.path.join(BASE, "metadata")) if f.endswith(".json")]
assert len(files) == 3333, len(files)
meta_counts = Counter()
for tid in range(1, 3334):
    m = json.load(open(os.path.join(BASE, "metadata", f"{tid}.json")))
    tier = assignment[str(tid)]
    assert m["name"] == f"Apple Art #{tid}"
    assert m["image"] == f"ipfs://{IMAGES_CID}/{tier.lower()}.png", m["image"]
    attrs = {a["trait_type"]: a["value"] for a in m["attributes"]}
    assert attrs["Tier"] == tier and attrs["Edition"] == f"{tid} of 3333"
    meta_counts[tier] += 1
assert meta_counts == Counter(SPEC), meta_counts
print("metadata tier counts:", dict(meta_counts))
assert "__IMAGES_CID__" not in open(os.path.join(BASE, "metadata", "1.json")).read()

# Images
for t in ["common", "rare", "epic", "legendary"]:
    im = Image.open(os.path.join(BASE, "images", f"{t}.png"))
    assert im.size == (1600, 1600), (t, im.size)
print("images: 4 PNGs, all 1600x1600")
print("ALL CHECKS PASSED")
