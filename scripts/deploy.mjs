import { readFileSync } from "node:fs";
import { ethers } from "ethers";

const rpcUrl = process.env.MALLOC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const privateKey = process.env.MALLOC_DEPLOYER_KEY;
const baseURI = process.env.MALLOC_BASE_URI || "https://api.malloc.life/metadata/";

if (!privateKey) {
  throw new Error("Set MALLOC_DEPLOYER_KEY before deploying. Never commit this key.");
}

const abi = JSON.parse(
  readFileSync("build/contracts_MallocCompanion_sol_MallocCompanion.abi", "utf8")
);
const bytecode = "0x" + readFileSync(
  "build/contracts_MallocCompanion_sol_MallocCompanion.bin",
  "utf8"
).trim();

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
const network = await provider.getNetwork();

if (Number(network.chainId) !== 4663) {
  throw new Error("Refusing to deploy: expected Robinhood Chain ID 4663.");
}

console.log("Deploying malloc from", signer.address);
const factory = new ethers.ContractFactory(abi, bytecode, signer);
const contract = await factory.deploy(baseURI);
await contract.waitForDeployment();
const address = await contract.getAddress();

console.log("MallocCompanion deployed:", address);
console.log("Add this address to config.js as contractAddress.");
