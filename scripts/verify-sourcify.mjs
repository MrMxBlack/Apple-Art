// Verify Genesis1999 contracts on Sourcify (v2 API, chain 56).
// Usage: node scripts/verify-sourcify.mjs <address> <SourceFile.sol:ContractName> <creationTxHash>
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [address, identifier, creationTx] = process.argv.slice(2);
if (!address || !identifier || !creationTx) {
  console.error("usage: verify-sourcify.mjs <address> <File.sol:Contract> <creationTxHash>");
  process.exit(1);
}

// Collect the full import graph into a standard-JSON input, keyed by the
// exact import strings (root files by bare name, OZ by @openzeppelin/...).
const sources = {};
function resolvePath(importerKey, imp) {
  if (imp.startsWith("@openzeppelin/")) return imp;
  if (imp.startsWith("./") || imp.startsWith("../")) {
    const base = importerKey.includes("/") ? importerKey.slice(0, importerKey.lastIndexOf("/")) : "";
    const parts = (base ? base + "/" + imp : imp).split("/");
    const out = [];
    for (const p of parts) { if (p === ".") continue; if (p === "..") out.pop(); else out.push(p); }
    return out.join("/");
  }
  return imp;
}
function readSource(key) {
  const full = key.startsWith("@openzeppelin/") ? join(root, "node_modules", key) : join(root, "contracts", key);
  return readFileSync(full, "utf8");
}
function addSource(key) {
  if (sources[key]) return;
  const content = readSource(key);
  sources[key] = { content };
  const re = /import\s+(?:[^"']*?from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content))) addSource(resolvePath(key, m[1]));
}
addSource("AppleArt.sol"); addSource("MockFeed.sol");
console.log("sources collected:", Object.keys(sources).length);

const input = {
  language: "Solidity",
  sources,
  settings: {
    evmVersion: "shanghai",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"] } },
  },
};

// Sanity: local compile must reproduce the on-disk artifact bytecode.
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: (p) => {
  try { return { contents: readSource(p.startsWith("@openzeppelin/") ? p : p) }; }
  catch { return { error: "not found: " + p }; }
} }));
for (const e of out.errors ?? []) if (e.severity === "error") { console.error(e.formattedMessage); process.exit(1); }
const [fileKey, contractName] = identifier.split(":");
const local = JSON.parse(readFileSync(join(root, "build", contractName + ".json"), "utf8"));
const compiled = out.contracts[fileKey][contractName].evm.bytecode.object;
if (compiled.toLowerCase() !== local.bytecode.replace(/^0x/, "").toLowerCase()) {
  console.error("BYTECODE MISMATCH vs build artifact — aborting");
  process.exit(1);
}
console.log("bytecode reproduces build artifact ✓");

const version = "v" + solc.version().replace(/\.Emscripten\.clang$/, "");
console.log("compiler:", version);
const res = await fetch("https://sourcify.dev/server/v2/verify/56/" + address, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ stdJsonInput: input, compilerVersion: version, contractIdentifier: identifier, creationTransactionHash: creationTx }),
});
const body = await res.json().catch(() => ({}));
console.log("submit status:", res.status, JSON.stringify(body).slice(0, 400));
const vid = body.verificationId;
if (!vid) process.exit(1);
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 3000));
  const st = await (await fetch("https://sourcify.dev/server/v2/verify/" + vid)).json().catch(() => ({}));
  console.log("poll:", JSON.stringify(st).slice(0, 300));
  if (st.status === "success" || st.status === "error") break;
}
