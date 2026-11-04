/* ============================================================
   APPLE ART — site logic
   ============================================================
   >>> CONFIG — EDIT THIS ONE PLACE AFTER DEPLOYMENT <<<
   Paste the deployed AppleArt contract address below.
   While it is empty, the site runs in "opening soon" mode:
   the mint button stays disabled and prices are estimates.
   Once set, the site reads the exact on-chain price from the
   contract (priceWei) and the mint button goes live.
   ============================================================ */
const CONFIG = {
  contractAddress: "", // <-- AppleArt contract address goes here after deploy
  chainId: 56,         // BNB Chain (BSC)
  rpcUrl: "https://bsc-dataseed.bnbchain.org",
  priceUsdPerNft: 0.10,
  maxPerTx: 50,
  totalSupply: 3333,
  publicSupply: 3300,
  fallbackBnbUsd: 700  // used only if the live price fetch fails
};

/* Function selectors from the compiled AppleArt contract (build/AppleArt.json) */
const SEL = {
  mint: "0xa0712d68",           // mint(uint256)
  priceWei: "0xb7ec2086",       // priceWei()
  totalMinted: "0xa2309ff8",    // totalMinted()
  publicRemaining: "0x869c66da" // publicRemaining()
};

const IPFS_PRIMARY = "gateway.pinata.cloud";
const IPFS_FALLBACK = "ipfs.io";

/* ---------- image gateway fallback ---------- */
document.querySelectorAll("img").forEach(function (img) {
  img.addEventListener("error", function () {
    if (img.src.indexOf(IPFS_PRIMARY) !== -1) {
      img.src = img.src.replace(IPFS_PRIMARY, IPFS_FALLBACK);
    }
  });
});

/* ---------- helpers ---------- */
function $(id) { return document.getElementById(id); }
function toHexQuantity(bn) { return "0x" + bn.toString(16); }
function encodeUint(n) { return BigInt(n).toString(16).padStart(64, "0"); }

async function rpcCall(data) {
  const res = await fetch(CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: CONFIG.contractAddress, data: data }, "latest"] })
  });
  const json = await res.json();
  if (!json.result) throw new Error("RPC error");
  return BigInt(json.result);
}

/* ---------- state ---------- */
let bnbUsd = null;        // live BNB/USD
let bnbUsdLive = false;   // true when fetched live
let onchainPriceWei = null; // exact per-NFT price from the contract, when live

const qtyInput = $("qty");
const usdTotalEl = $("usdTotal");
const bnbTotalEl = $("bnbTotal");
const bnbPriceEl = $("bnbPrice");
const mintBtn = $("mintBtn");
const mintNote = $("mintNote");

function getQty() {
  let q = parseInt(qtyInput.value, 10);
  if (isNaN(q) || q < 1) q = 1;
  if (q > CONFIG.maxPerTx) q = CONFIG.maxPerTx;
  return q;
}

function renderPrices() {
  const q = getQty();
  const usd = q * CONFIG.priceUsdPerNft;
  usdTotalEl.textContent = "$" + usd.toFixed(2);
  if (onchainPriceWei !== null) {
    const totalWei = onchainPriceWei * BigInt(q);
    const bnb = Number(totalWei) / 1e18;
    bnbTotalEl.textContent = bnb.toFixed(6) + " BNB (exact on-chain price)";
  } else if (bnbUsd) {
    const bnb = usd / bnbUsd;
    bnbTotalEl.textContent = "≈ " + bnb.toFixed(6) + " BNB";
  } else {
    bnbTotalEl.textContent = "…";
  }
  if (bnbUsd) {
    bnbPriceEl.textContent = "$" + bnbUsd.toLocaleString("en-US", { maximumFractionDigits: 2 }) +
      (bnbUsdLive ? " (live)" : " (estimate, live feed unavailable)");
  }
}

$("qtyMinus").addEventListener("click", function () { qtyInput.value = getQty() - 1; qtyInput.value = getQty(); renderPrices(); });
$("qtyPlus").addEventListener("click", function () { qtyInput.value = getQty() + 1; qtyInput.value = getQty(); renderPrices(); });
qtyInput.addEventListener("input", renderPrices);
qtyInput.addEventListener("change", function () { qtyInput.value = getQty(); renderPrices(); });

/* ---------- live BNB/USD price (public CoinGecko endpoint) ---------- */
async function fetchBnbPrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd");
    const json = await res.json();
    if (json && json.binancecoin && json.binancecoin.usd > 0) {
      bnbUsd = json.binancecoin.usd;
      bnbUsdLive = true;
    } else { throw new Error("bad price"); }
  } catch (e) {
    bnbUsd = CONFIG.fallbackBnbUsd;
    bnbUsdLive = false;
  }
  renderPrices();
}

/* ---------- contract wiring (active only when CONFIG.contractAddress is set) ---------- */
async function initContract() {
  if (!CONFIG.contractAddress) return;
  mintBtn.disabled = false;
  mintBtn.textContent = "Mint Now";
  mintNote.textContent = "The mint is live. Connect a BNB Chain wallet to mint at the exact on-chain price.";
  const cs = $("contractStatus");
  if (cs) {
    cs.innerHTML = "Live on BNB Chain: <span class='mono'>" + CONFIG.contractAddress + "</span>";
  }
  try {
    onchainPriceWei = await rpcCall(SEL.priceWei);
    const minted = await rpcCall(SEL.totalMinted);
    const remaining = await rpcCall(SEL.publicRemaining);
    const ms = $("mintedStatus");
    if (ms) {
      ms.textContent = minted.toString() + " of " + CONFIG.totalSupply.toLocaleString("en-US") +
        " minted · " + remaining.toString() + " still available to the public";
    }
  } catch (e) {
    /* RPC unavailable: keep the USD estimate display, mint tx re-reads price at click time */
  }
  renderPrices();
}

async function mint() {
  const note = function (msg, cls) {
    mintNote.textContent = msg;
    mintNote.className = "mint-note" + (cls ? " " + cls : "");
  };
  if (!window.ethereum) {
    note("No wallet found. Open this page inside a BNB Chain wallet browser (for example MetaMask or Binance Wallet) to mint.", "err");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const from = accounts[0];
    const chain = await window.ethereum.request({ method: "eth_chainId" });
    if (parseInt(chain, 16) !== CONFIG.chainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + CONFIG.chainId.toString(16) }]
      });
    }
    const q = getQty();
    const priceWei = await rpcCall(SEL.priceWei); // exact price, read fresh
    const value = priceWei * BigInt(q);
    note("Confirm the transaction in your wallet…");
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from: from,
        to: CONFIG.contractAddress,
        value: toHexQuantity(value),
        data: SEL.mint + encodeUint(q)
      }]
    });
    note("Mint sent. Transaction: " + txHash, "ok");
  } catch (e) {
    note("Mint cancelled or failed: " + (e && e.message ? e.message : e), "err");
  }
}
mintBtn.addEventListener("click", mint);

/* ---------- go ---------- */
fetchBnbPrice();
initContract();
renderPrices();
