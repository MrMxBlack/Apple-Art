#!/usr/bin/env python3
"""Upload Apple Art images + metadata folders to IPFS via the Pinata
connector helper (flat basenames, so files sit at the directory CID root)."""
import json, os, sys

sys.path.insert(0, os.path.expanduser("~/workspace/custom-connectors/custom.pinata/bin"))
import pinata  # the connector helper module

BASE = os.path.expanduser("~/workspace/apple-art/assets")

def folder_paths(d):
    names = sorted((n for n in os.listdir(d) if os.path.isfile(os.path.join(d, n))),
                   key=lambda s: (len(s), s))
    return [os.path.join(d, n) for n in names]

step = sys.argv[1]
if step == "images":
    paths = folder_paths(os.path.join(BASE, "images"))
    print(f"pinning {len(paths)} image files", file=sys.stderr)
    res = pinata.pin_files(paths, "Apple Art images")
    print(json.dumps(res))
elif step == "metadata":
    paths = folder_paths(os.path.join(BASE, "metadata"))
    print(f"pinning {len(paths)} metadata files", file=sys.stderr)
    res = pinata.pin_files(paths, "Apple Art metadata")
    print(json.dumps(res))
else:
    print("usage: upload_ipfs.py images|metadata", file=sys.stderr)
    sys.exit(2)
