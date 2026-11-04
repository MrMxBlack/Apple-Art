// Apple Art build: compile contracts/*.sol with solc 0.8.26 (Shanghai),
// following the Genesis1999 nft-launch toolchain pattern.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["AppleArt.sol", "MockFeed.sol"];
const sources = {};
for (const f of files) {
  sources[f] = { content: readFileSync(join(root, "contracts", f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    evmVersion: "shanghai",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

function findImports(path) {
  try {
    const full = path.startsWith("@openzeppelin/")
      ? join(root, "node_modules", path)
      : join(root, "contracts", path);
    return { contents: readFileSync(full, "utf8") };
  } catch {
    return { error: `File not found: ${path}` };
  }
}

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
let failed = false;
for (const e of out.errors ?? []) {
  const tag = e.severity === "error" ? "ERROR" : "warn";
  if (e.severity === "error") failed = true;
  console.log(`${tag}: ${e.formattedMessage.split("\n")[0]}`);
}
if (failed) process.exit(1);

mkdirSync(join(root, "build"), { recursive: true });
for (const f of files) {
  for (const [name, c] of Object.entries(out.contracts[f])) {
    writeFileSync(
      join(root, "build", `${name}.json`),
      JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2),
    );
    console.log(`built ${name}: bytecode ${c.evm.bytecode.object.length / 2} bytes`);
  }
}
console.log("COMPILE OK");
