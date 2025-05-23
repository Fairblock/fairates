
import { BigNumber, utils } from "ethers";

/**
 * Build EIP‑1559 overrides that stay valid for ~2 blocks
 * @param {import("ethers").ContractRunner} signer
 * @param {() => Promise<BigNumber>} [estimateFn] optional gas estimator
 */
export async function eip1559Overrides(signer, estimateFn) {
  const fee = await signer.provider.getFeeData();

  const tip  = fee.maxPriorityFeePerGas ?? utils.parseUnits("0.1", "gwei");
  const base = fee.lastBaseFeePerGas  ?? utils.parseUnits("0.1", "gwei");

  const feeCap = base.mul(2).add(tip);

  let gasLimit;
  if (estimateFn) {
    const est = await estimateFn();
    gasLimit = est.mul(12).div(10);
  }

  return { maxPriorityFeePerGas: tip, maxFeePerGas: feeCap, gasLimit };
}

/**
 * Send a contract method with dynamic gas
 * @param {import("ethers").Contract} contract     ethers v5 or v6 contract
 * @param {string} fnName                          function name to call
 * @param {any[]}  args=[]                         positional arguments
 * @returns {Promise<import("ethers").ContractReceipt>}
 */
export async function sendTx(contract, fnName, args = []) {
  const signer   = contract.runner ?? contract.signer;
  const estimate = () => contract.estimateGas[fnName](...args);

  const ov = await eip1559Overrides(signer, estimate);
  const tx = await contract[fnName](...args, ov);
  return tx.wait();
}

/**
 * Deploy a ContractFactory with dynamic gas
 * @param {import("ethers").ContractFactory} factory
 * @param {any[]} ctorArgs=[]
 * @returns {Promise<import("ethers").Contract>}
 */
export async function deployWithGas(factory, ctorArgs = []) {
  const signer   = factory.runner ?? factory.signer;
  const unsigned = await factory.getDeployTransaction(...ctorArgs);
  const est      = await signer.estimateGas(unsigned);

  const ov = await eip1559Overrides(signer, () => Promise.resolve(est));
  const contract = await factory.deploy(...ctorArgs, ov);
  await contract.deployed();
  return contract;
}

// deploy.js  ── add / replace safeSendTx
export async function safeSendTx(
  contract,
  fnName,
  args = [],
  ignoreReasons = []
) {
  const signer = contract.runner ?? contract.signer;

  // helper that tests a message against the ignore list
  const shouldIgnore = (msg = "") =>
    ignoreReasons.some((r) => msg.includes(r));

  // 1️⃣ try a manual gas estimate first — because sendTx() will do the same
  try {
    await contract.estimateGas[fnName](...args);
  } catch (estErr) {
    const msg =
      estErr?.error?.error?.message ||
      estErr?.error?.message ||
      estErr?.reason ||
      estErr?.message ||
      "";

    // “All bids decrypted” usually shows up here
    if (shouldIgnore(msg)) {
      console.log(`⤵  Skipping call ${fnName}: ${msg}`);
      return null;
    }
    throw estErr; // other errors bubble up
  }

  // 2️⃣ run the normal send path (may still revert inside the tx)
  try {
    return await sendTx(contract, fnName, args);
  } catch (err) {
    const msg =
      err?.error?.error?.message ||
      err?.error?.message ||
      err?.reason ||
      err?.message ||
      "";
    if (shouldIgnore(msg)) {
      console.log(`⤵  Ignoring revert in ${fnName}: ${msg}`);
      return null;
    }
    throw err;
  }
}
