
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

export async function safeSendTx(
  contract,
  fnName,
  args = [],
  ignoreReasons = ["all bids decrypted", "all offers decrypted"],
  skipOnUnpredictable = true          // ← set false if you want to surface others
) {
  const wantsSkip = (msg = "") => {
    const lower = msg.toLowerCase();
    return ignoreReasons.some((r) => lower.includes(r.toLowerCase()));
  };

  const extractReason = (e) => {
    // bytes in error.data → utf‑8 revert string
    if (typeof e?.error?.data === "string" && e.error.data.length >= 10) {
      try {
        return utils.toUtf8String("0x" + e.error.data.slice(10));
      } catch (_) {}
    }
    return (
      e?.error?.message ||
      e?.reason ||
      e?.message ||
      ""
    );
  };

  /* ── 1. estimateGas probe ─────────────────────────────────────────── */
  try {
    await contract.estimateGas[fnName](...args);
  } catch (estErr) {
    if (
      estErr.code === "UNPREDICTABLE_GAS_LIMIT" &&
      (skipOnUnpredictable || wantsSkip(extractReason(estErr)))
    ) {
      console.log(`⤵  Skipping ${fnName}: ${extractReason(estErr)}`);
      return null;
    }
    throw estErr;
  }

  /* ── 2. real transaction ──────────────────────────────────────────── */
  try {
    const { sendTx } = await import("./deploy.js"); // avoids circular import
    return await sendTx(contract, fnName, args);
  } catch (err) {
    if (wantsSkip(extractReason(err))) {
      console.log(`⤵  Ignoring revert in ${fnName}: ${extractReason(err)}`);
      return null;
    }
    throw err;
  }
}