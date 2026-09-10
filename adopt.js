const cfg = window.MALLOC_CONFIG || {};
const state = { account: null, signal: null, signalName: null, name: null };
const views = [...document.querySelectorAll(".step-view")];
const nav = [...document.querySelectorAll("[data-nav]")];
const connectLog = document.querySelector("#connectLog");
const mintLog = document.querySelector("#mintLog");
const walletLabel = document.querySelector("#connectWallet");
const networkStatus = document.querySelector("#networkStatus");
const mintButton = document.querySelector("#executeMint");
const contractDisplay = document.querySelector("#contractDisplay");
const toast = document.querySelector("#toast");

function showStep(number) {
  views.forEach(view => view.classList.toggle("active", Number(view.dataset.step) === number));
  nav.forEach(item => {
    const n = Number(item.dataset.nav);
    item.classList.toggle("active", n === Math.min(number, 4));
    item.classList.toggle("done", n < number);
  });
  window.scrollTo({ top: 120, behavior: "smooth" });
}

function line(target, text, type = "") {
  const p = document.createElement("p");
  p.textContent = text;
  p.className = type;
  target.appendChild(p);
}

function notify(message) {
  toast.textContent = "> " + message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

async function switchNetwork() {
  const current = await ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() === cfg.chainId.toLowerCase()) return;
  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: cfg.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await ethereum.request({ method: "wallet_addEthereumChain", params: [{
      chainId: cfg.chainId, chainName: cfg.chainName, rpcUrls: [cfg.rpcUrl],
      blockExplorerUrls: [cfg.explorerUrl], nativeCurrency: cfg.nativeCurrency
    }] });
  }
}

async function connect() {
  connectLog.innerHTML = "";
  if (!window.ethereum) {
    line(connectLog, "ERROR / compatible browser wallet not detected", "err");
    notify("Wallet required");
    return;
  }
  try {
    line(connectLog, "$ requesting public wallet address");
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    state.account = accounts[0];
    line(connectLog, "OK / wallet " + state.account, "ok");
    line(connectLog, "$ requesting Robinhood Chain / 4663");
    await switchNetwork();
    line(connectLog, "OK / network synchronized", "ok");
    walletLabel.textContent = state.account.slice(0, 5) + "..." + state.account.slice(-4);
    networkStatus.textContent = "ROBINHOOD CHAIN CONNECTED";
    document.querySelector("#reviewWallet").textContent = state.account;
    if (cfg.contractAddress && window.ethers) {
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(cfg.contractAddress, ["function hasAdopted(address) view returns(bool)"], provider);
      if (await contract.hasAdopted(state.account)) {
        line(connectLog, "NOTICE / wallet already has a companion", "err");
        return;
      }
      line(connectLog, "OK / address eligible for Genesis mint", "ok");
    }
    setTimeout(() => showStep(2), 500);
  } catch (error) {
    line(connectLog, "ERROR / " + (error.shortMessage || error.message || "connection rejected"), "err");
  }
}

document.querySelector("#stepConnect").addEventListener("click", connect);
walletLabel.addEventListener("click", connect);
document.querySelectorAll(".choice").forEach(choice => choice.addEventListener("click", () => {
  document.querySelectorAll(".choice").forEach(item => item.classList.remove("selected"));
  choice.classList.add("selected");
  state.signal = Number(choice.dataset.signal);
  state.signalName = choice.dataset.name;
  document.querySelector("#reviewSignal").textContent = state.signalName;
  document.querySelector("#toIdentity").disabled = false;
}));
document.querySelector("#toIdentity").addEventListener("click", () => showStep(3));
document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => showStep(Number(button.dataset.back))));

const nameInput = document.querySelector("#companionName");
nameInput.addEventListener("input", () => {
  nameInput.value = nameInput.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  document.querySelector("#toMint").disabled = nameInput.value.length < 3;
});
document.querySelector("#toMint").addEventListener("click", () => {
  state.name = nameInput.value;
  showStep(4);
});

if (cfg.contractAddress) {
  contractDisplay.textContent = cfg.contractAddress;
} else {
  contractDisplay.textContent = "GENESIS MINT NOT LIVE";
  mintButton.disabled = true;
}

mintButton.addEventListener("click", async () => {
  if (!state.account || state.signal === null || !state.name || !cfg.contractAddress) return;
  try {
    line(mintLog, "$ preparing adopt(" + state.signal + ")");
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const abi = ["function adopt(uint8 temperament) returns(uint256)", "function hasAdopted(address) view returns(bool)"];
    const contract = new ethers.Contract(cfg.contractAddress, abi, signer);
    if (await contract.hasAdopted(state.account)) throw new Error("wallet already adopted");
    line(mintLog, "$ confirm the transaction in your wallet");
    const tx = await contract.adopt(state.signal);
    line(mintLog, "TX / " + tx.hash);
    line(mintLog, "$ waiting for block confirmation");
    await tx.wait();
    line(mintLog, "OK / companion minted", "ok");
    localStorage.setItem("malloc-pet", JSON.stringify({ name: state.name, signal: state.signalName, transaction: tx.hash }));
    document.querySelector("#mintedPet").textContent =
      "       /\\       /\\\n      /  \\_____/  \\\n     |   [|]   [|]   |\n     |      v        |\n +---+---------------+---+\n |   " + state.name.padEnd(12, " ") + "    |\n +-----------------------+\n\n STATUS: ONCHAIN / AWAKE_";
    document.querySelector("#explorerLink").href = cfg.explorerUrl + "/tx/" + tx.hash;
    showStep(5);
  } catch (error) {
    line(mintLog, "ERROR / " + (error.shortMessage || error.message || "transaction rejected"), "err");
    notify("Mint not completed");
  }
});
