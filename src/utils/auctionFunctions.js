import { ethers } from "ethers";
import { Buffer } from "buffer";
import { timelockEncrypt } from "ts-ibe";
import { sendTx, safeSendTx } from "./deploy.js";
import CollateralManagerArtifact from "../CollateralManager.json";
import AuctionTokenArtifact from "../AuctionToken.json";
import AuctionEngineArtifact from "../AuctionEngine.json";
import LendingVaultArtifact from "../LendingVault.json";
import BidManagerArtifact from "../BidManager.json";
import OfferManagerArtifact from "../OfferManager.json";
import FairyringArtifact from "../FairyringContract.json";
import {
  FAIRYRING_CONTRACT_ADDRESS,
  ERC20ABI,
} from "../styles.js";
import { saveContracts, logAuctionActivity } from "./firebase.js";
import { loadAuctionListMetaSnapshot } from "./auctionListMetaFromChain.js";

/**
 * Delay utility to prevent rate limiting
 * @param {number} ms milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hexToUint8Array(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return arr;
}

export async function deployContractsCustom(
  signer,
  customPriceOracle,
  customBidDuration,
  customRevealDuration,
  customRepaymentDuration,
  customFee,
  customLiquidationFee,
  customProtocolLiquidationFee,
  customAuctionTokenAmount,
  customPurchaseToken,
  customMaxBid,
  customMaxOffer,
  customMinBid,
  customMinOffer,
  customMaxNumBids,
  customMaxNumOffers,
  customCollateralToken,
  customCollateralRatio,
  walletAddress,
  deployedAuctions,
  setDeployedAuctions,
  setMyAuctions,
  selectAuction,
  refreshAuctions,
  showToast,
  getErrorMessage
) {
  if (!signer) {
    showToast("Please connect your wallet first", "warning");
    return;
  }
  if (!customCollateralToken || !customCollateralRatio) {
    showToast("Please enter collateral token address and ratio", "warning");
    return;
  }
  if (!customMaxBid || !customMaxOffer) {
    showToast("Please enter maximum borrow and supply values", "warning");
    return;
  }
  if (!customPriceOracle || !customBidDuration || !customRevealDuration || !customRepaymentDuration || !customFee || !customAuctionTokenAmount || !customPurchaseToken) {
    showToast("Please fill in all deployment parameters", "warning");
    return;
  }
  
  try {
    const priceOracle = customPriceOracle;
    const BID_DURATION = Number(customBidDuration);
    const REVEAL_DURATION = Number(customRevealDuration);
    const REPAYMENT_DURATION = Number(customRepaymentDuration);
    const FEE = Number(customFee);
    const LIQUIDATION_FEE = Number(customLiquidationFee);
    const PROTOCOL_LIQUIDATION_FEE = Number(customProtocolLiquidationFee);
    const AUCTION_TOKEN_AMOUNT = Number(customAuctionTokenAmount);
    const DECRYPTER = "0xbd3a990b1dd9ffbd4e7ca8c08ac67ea60a4c2539";
    const purchaseToken = customPurchaseToken;
    const maxBid = ethers.utils.parseUnits(customMaxBid, 18);
    const maxOffer = ethers.utils.parseUnits(customMaxOffer, 18);
    const minBid = ethers.utils.parseUnits(customMinBid, 18);
    const minOffer = ethers.utils.parseUnits(customMinOffer, 18);
    const maxNumBids = Number(customMaxNumBids);
    const maxNumOffers = Number(customMaxNumOffers);

    const CollateralManagerFactory = new ethers.ContractFactory(
      CollateralManagerArtifact.abi,
      CollateralManagerArtifact.bytecode,
      signer
    );
    const cmContract = await sendTx(CollateralManagerFactory, "deploy", [priceOracle]);
    await cmContract.deployed();
    await delay(500); // Delay after deployment

    await sendTx(cmContract, "addAcceptedCollateralToken", [customCollateralToken, Number(customCollateralRatio)]);
    await delay(300); // Delay between transactions
    await sendTx(cmContract, "setMaintenanceRatio", [customCollateralToken, Number(customCollateralRatio)]);
    await delay(300); // Delay between transactions

    const userAddr = await signer.getAddress();
    const ID = await generateAuctionID(signer, userAddr);
    await delay(500);

    const AuctionTokenFactory = new ethers.ContractFactory(
      AuctionTokenArtifact.abi,
      AuctionTokenArtifact.bytecode,
      signer
    );
    const tokenName = `${ID}-TOKEN`;
    const tokenSymbol = `${ID}-TOKEN`;
    const atContract = await sendTx(AuctionTokenFactory, "deploy", [tokenName, tokenSymbol]);
    await atContract.deployed();
    await delay(500); // Delay after deployment
    const auctionTokenAddress = atContract.address;

    const AuctionEngineFactory = new ethers.ContractFactory(
      AuctionEngineArtifact.abi,
      AuctionEngineArtifact.bytecode,
      signer
    );
    const aeContract = await sendTx(AuctionEngineFactory, "deploy", [DECRYPTER,
      BID_DURATION,
      REVEAL_DURATION,
      REPAYMENT_DURATION,
      ID,
      purchaseToken,
      FEE,
      LIQUIDATION_FEE,
      PROTOCOL_LIQUIDATION_FEE,
      auctionTokenAddress,
      AUCTION_TOKEN_AMOUNT]);
    await aeContract.deployed();
    await delay(500); // Delay after deployment

    await sendTx(atContract, "setAuctionContract", [aeContract.address]);
    await delay(300); // Delay between transactions
    
    const LendingVaultFactory = new ethers.ContractFactory(
      LendingVaultArtifact.abi,
      LendingVaultArtifact.bytecode,
      signer
    );
    const lvContract = await sendTx(LendingVaultFactory, "deploy", [purchaseToken]);
    await lvContract.deployed();
    await delay(500); // Delay after deployment

    const BidManagerFactory = new ethers.ContractFactory(
      BidManagerArtifact.abi,
      BidManagerArtifact.bytecode,
      signer
    );

    const bmContract = await sendTx(BidManagerFactory, "deploy", [cmContract.address,
      aeContract.address,
      maxBid,
      purchaseToken,
      minBid,
      maxNumBids]);
    await bmContract.deployed();
    await delay(500); // Delay after deployment

    await sendTx(cmContract, "setManager", [bmContract.address]);
    await delay(300); // Delay between transactions
    
    const OfferManagerFactory = new ethers.ContractFactory(
      OfferManagerArtifact.abi,
      OfferManagerArtifact.bytecode,
      signer
    );
    const omContract = await sendTx(OfferManagerFactory, "deploy", [lvContract.address,
      aeContract.address,
      maxOffer,
      minOffer,
      maxNumOffers]);
    await omContract.deployed();
    await delay(500); // Delay after deployment

    await sendTx(aeContract, "setManagers", [bmContract.address, omContract.address]);
    await delay(300); // Delay between transactions
    await sendTx(lvContract, "setManager", [omContract.address]);
    await delay(300); // Delay between transactions
    
    const auctionContracts = {
      collateralManagerAddress: cmContract.address,
      auctionTokenAddress: auctionTokenAddress,
      auctionEngineAddress: aeContract.address,
      lendingVaultAddress: lvContract.address,
      bidManagerAddress: bmContract.address,
      offerManagerAddress: omContract.address
    };

    let recordToSave = auctionContracts;
    try {
      const listMeta = await loadAuctionListMetaSnapshot(
        signer.provider,
        auctionContracts,
      );
      if (listMeta) recordToSave = { ...auctionContracts, listMeta };
    } catch (e) {
      console.warn("listMeta snapshot after deploy failed", e);
    }

    const base = Array.isArray(deployedAuctions) ? deployedAuctions : [];
    const nextList = [...base, recordToSave];
    setDeployedAuctions(nextList);

    if (userAddr && userAddr.toLowerCase() === walletAddress.toLowerCase()) {
      setMyAuctions((prev) => [...prev, recordToSave]);
    }

    selectAuction(recordToSave);

    await saveContracts(nextList);

    await refreshAuctions();
    showToast("All contracts deployed successfully!", "success");
  } catch (error) {
    console.error("Custom deployment failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function registerNewCollateral(
  signer,
  collateralManagerAddress,
  newCollateralAddress,
  newCollateralRatio,
  setRegisteredCollaterals,
  setAvailableCollaterals,
  setBidCollateralSelections,
  setLiquidationCollateralSelections,
  setUnlockCollateralSelections,
  setNewCollateralAddress,
  setNewCollateralRatio,
  showToast,
  getErrorMessage
) {
  const cm = new ethers.Contract(collateralManagerAddress, CollateralManagerArtifact.abi, signer);
  if (!cm) {
    showToast("CollateralManager not found", "error");
    return;
  }
  try {
    const ratioBN = ethers.BigNumber.from(newCollateralRatio);
    await sendTx(cm, "addAcceptedCollateralToken", [newCollateralAddress, 1]);
    await sendTx(cm, "setMaintenanceRatio", [newCollateralAddress, ratioBN]);

    setRegisteredCollaterals((prev) => [
      ...prev,
      { address: newCollateralAddress, ratio: newCollateralRatio }
    ]);
    setAvailableCollaterals((prev) => [
      ...prev,
      { address: newCollateralAddress, ratio: newCollateralRatio }
    ]);
    setBidCollateralSelections((prev) => [
      ...prev,
      { address: newCollateralAddress, amount: "" }
    ]);
    setLiquidationCollateralSelections((prev) => [
      ...prev,
      { address: newCollateralAddress, amount: "" }
    ]);
    setUnlockCollateralSelections((prev) => [
      ...prev,
      { address: newCollateralAddress, unlock: false }
    ]);

    showToast(`Collateral registered (ratio ${newCollateralRatio})`, "success");
    setNewCollateralAddress("");
    setNewCollateralRatio("");
  } catch (error) {
    console.error("Register collateral failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function placeBid(
  signer,
  bidManagerAddress,
  auctionEngineAddress,
  collateralManagerAddress,
  bidAmount,
  bidRate,
  bidCollateralSelections,
  setBidAmount,
  setBidRate,
  setBidCollateralSelections,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  console.log("BidManager address:", bidManagerAddress);
  if (!bm) {
    showToast("BidManager not found", "error");
    return;
  }
    const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const quantityBN = ethers.utils.parseUnits(bidAmount, tokenDecimals);

    let encryptedBid = "0x";
    const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
    if (!ae) {
      showToast("AuctionEngine not found", "error");
      return;
    }
    const ID = await ae.auctionID();
    const fairyringContract = new ethers.Contract(
      FAIRYRING_CONTRACT_ADDRESS,
      FairyringArtifact.abi,
      signer
    );
    const PK = await fairyringContract.latestEncryptionKey();
    const PK_Val = PK.startsWith("0x") ? PK.slice(2) : PK;
    if (bidRate) {
      const bufferValue = Buffer.from(bidRate, "utf8");
      encryptedBid = await timelockEncrypt(ID, PK_Val, bufferValue);
      encryptedBid = "0x" + encryptedBid;
    }
    const usedCollaterals = bidCollateralSelections.filter((c) => c.amount && c.amount !== "0");
    if (usedCollaterals.length === 0) {
      showToast("Enter collateral amounts greater than 0", "warning");
      return;
    }

    const tokensArray = usedCollaterals.map((c) => c.address);
    const amountsArray = [];

    for (let i = 0; i < usedCollaterals.length; i++) {
      const tokenAddress = tokensArray[i];
      const collateralAmount = usedCollaterals[i].amount;

      const tokenDecimals = await getTokenDecimals(tokenAddress);

      const amountInSmallestUnit = ethers.utils.parseUnits(collateralAmount, tokenDecimals);

      amountsArray.push(amountInSmallestUnit);
    }

    for (let i = 0; i < tokensArray.length; i++) {
      await approveToken(signer, tokensArray[i], collateralManagerAddress);
    }
    console.log("amountsArray:", amountsArray);
    const receipt = await sendTx(bm, "submitBid", [
      quantityBN,
      encryptedBid,
      tokensArray,
      amountsArray,
      purchaseToken,
    ]);

    try {
      const wallet = await signer.getAddress();
      const provider = signer.provider || bm.provider || am.provider;
      let createdAt = new Date();
      if (provider && receipt?.blockNumber != null) {
        const block = await provider.getBlock(receipt.blockNumber);
        if (block && block.timestamp) {
          createdAt = new Date(block.timestamp * 1000);
        }
      }

      await logAuctionActivity({
        auctionEngineAddress,
        type: "bid",
        wallet,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        createdAt,
      });
    } catch (activityError) {
      console.error("Failed to log bid activity:", activityError);
    }

    showToast("Borrow placed successfully", "success");
    setBidAmount("");
    setBidRate("");
    setBidCollateralSelections(bidCollateralSelections.map(c => ({ address: c.address, amount: "" })));
  } catch (error) {
    console.error("Bid failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function placeOffer(
  signer,
  offerManagerAddress,
  lendingVaultAddress,
  auctionEngineAddress,
  offerAmount,
  offerRate,
  setOfferAmount,
  setOfferRate,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  const om = new ethers.Contract(offerManagerAddress, OfferManagerArtifact.abi, signer);
  const lv = new ethers.Contract(lendingVaultAddress, LendingVaultArtifact.abi, signer);
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!om || !lv || !am) {
    showToast("Contract not found", "error");
    return;
  }
  try {
    let encryptedOffer = "0x";
    if (offerRate) {
      const bufferValue = Buffer.from(offerRate, "utf8");
      const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
      if (!ae) {
        showToast("AuctionEngine not found", "error");
        return;
      }
      const ID = await ae.auctionID();
      const fairyringContract = new ethers.Contract(
        FAIRYRING_CONTRACT_ADDRESS,
        FairyringArtifact.abi,
        signer
      );
      const PK = await fairyringContract.latestEncryptionKey();
      const PK_Val = PK.startsWith("0x") ? PK.slice(2) : PK;
      encryptedOffer = await timelockEncrypt(ID, PK_Val, bufferValue);
      encryptedOffer = "0x" + encryptedOffer;
    }
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const quantity = ethers.utils.parseUnits(offerAmount, tokenDecimals);
    await approveToken(signer, purchaseToken, lendingVaultAddress);
    const receipt = await sendTx(om, "submitOffer", [quantity, encryptedOffer]);

    try {
      const wallet = await signer.getAddress();
      const provider = signer.provider || om.provider || am.provider;
      let createdAt = new Date();
      if (provider && receipt?.blockNumber != null) {
        const block = await provider.getBlock(receipt.blockNumber);
        if (block && block.timestamp) {
          createdAt = new Date(block.timestamp * 1000);
        }
      }

      await logAuctionActivity({
        auctionEngineAddress,
        type: "offer",
        wallet,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        createdAt,
      });
    } catch (activityError) {
      console.error("Failed to log offer activity:", activityError);
    }

    showToast("Supply placed successfully", "success");
    setOfferAmount("");
    setOfferRate("");
  } catch (error) {
    console.error("Offer failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function finalizeAuction(
  signer,
  auctionEngineAddress,
  walletAddress,
  setDecryptingAuctionAddress,
  showToast,
  getErrorMessage
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    showToast("AuctionEngine not found", "error");
    return;
  }

  try {
    const fairyringContract = new ethers.Contract(
      FAIRYRING_CONTRACT_ADDRESS,
      FairyringArtifact.abi,
      signer
    );
    const id = await ae.auctionID();
    const parts = id.split('/');
    const num = parts.pop();
    const auctionIdNumber = parseInt(num, 10);

    setDecryptingAuctionAddress(auctionEngineAddress);
    let first = true;
    let decryptionKey = await fairyringContract.generalDecryptionKeys(walletAddress, auctionIdNumber);
    while (decryptionKey === "0x" || decryptionKey === "0x0") {
      if (first) {
        await sendTx(fairyringContract, "requestGeneralDecryptionKey", [auctionIdNumber]);
        first = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
      decryptionKey = await fairyringContract.generalDecryptionKeys(walletAddress, auctionIdNumber);
    }
    setDecryptingAuctionAddress(null);

    const keyArray = hexToUint8Array(decryptionKey);
    await safeSendTx(ae, "decryptBidsBatch", [3, keyArray]);
    await safeSendTx(ae, "decryptOffersBatch", [3, keyArray]);

    showToast("Decryption finalized", "success");
  } catch (error) {
    console.error("Decryption failed:", error);
    setDecryptingAuctionAddress(null);
    showToast(getErrorMessage(error), "error");
    return;
  }

  try {
    await sendTx(ae, "finalizeAuction");
    showToast("Auction finalized", "success");
  } catch (error) {
    console.error("Finalize auction failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function repay(
  signer,
  auctionEngineAddress,
  repayAmount,
  setRepayAmount,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const amountBN = ethers.utils.parseUnits(repayAmount, tokenDecimals);
    await approveToken(signer, purchaseToken, auctionEngineAddress);
    await sendTx(ae, "repay", [amountBN]);
    showToast("Repayment successful", "success");
    setRepayAmount("");
  } catch (error) {
    console.error("Repayment failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function checkOwed(
  signer,
  auctionEngineAddress,
  walletAddress,
  setOwedAmount,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const owed = await ae.repayments(walletAddress);
    const formattedOwed = ethers.utils.formatUnits(owed, tokenDecimals);
    setOwedAmount(formattedOwed);
    showToast(`You owe: ${formattedOwed}`, "info");
  } catch (error) {
    console.error("Check owed failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function liquidate(
  signer,
  auctionEngineAddress,
  liquidationBorrower,
  liquidationCollateralSelections,
  setLiquidationBorrower,
  setLiquidationCollateralSelections,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  if (!liquidationBorrower) {
    showToast("Enter borrower address", "warning");
    return;
  }

  try {
    const provider = ae.provider;
    const latestBlock = await provider.getBlock("latest");
    const currentTime = latestBlock.timestamp;

    const repaymentDue = await ae.repaymentDue();
    const threshold = repaymentDue.add(ethers.BigNumber.from(172800));

    const usedCollaterals = liquidationCollateralSelections.filter((c) => c.amount && c.amount !== "0");
    if (usedCollaterals.length === 0) {
      showToast("Enter coverage amounts greater than 0", "warning");
      return;
    }

    const tokensArray = usedCollaterals.map((c) => c.address);
    const coverageArray = [];

    for (let i = 0; i < usedCollaterals.length; i++) {
      const tokenAddress = tokensArray[i];
      const collateralAmount = usedCollaterals[i].amount;

      const tokenDecimals = await getTokenDecimals(tokenAddress);

      const amountInSmallestUnit = ethers.utils.parseUnits(collateralAmount, tokenDecimals);
      coverageArray.push(amountInSmallestUnit);
    }
    const purchaseToken = await ae.repaymentToken();
    await approveToken(signer, purchaseToken, auctionEngineAddress);

    if (currentTime < threshold.toNumber()) {
      await sendTx(ae, "batchEarlyLiquidation", [liquidationBorrower, tokensArray, coverageArray]);
    } else {
      await sendTx(ae, "batchLateLiquidation", [liquidationBorrower, tokensArray, coverageArray]);
    }

    showToast("Liquidation executed", "success");
    setLiquidationBorrower("");
    setLiquidationCollateralSelections(liquidationCollateralSelections.map(c => ({ address: c.address, amount: "" })));
  } catch (error) {
    console.error("Liquidation failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function cancelAuction(
  signer,
  auctionEngineAddress,
  cancelReason,
  setCancelReason,
  showToast,
  getErrorMessage
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  try {
    await sendTx(ae, "cancelAuction", [cancelReason]);
    showToast("Auction canceled", "success");
    setCancelReason("");
  } catch (error) {
    console.error("Auction cancellation failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function redeemToken(
  signer,
  currentAuction,
  auctionEngineAddress,
  redemptionAmount,
  setRedemptionAmount,
  getTokenDecimals,
  showToast,
  getErrorMessage
) {
  if (!signer) {
    showToast("Please connect your wallet first", "warning");
    return;
  }
  const atContract = new ethers.Contract(currentAuction.auctionTokenAddress, AuctionTokenArtifact.abi, signer);
  if (!atContract) {
    showToast("Auction token contract not found", "error");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    showToast("AuctionEngine not found", "error");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const amount = ethers.utils.parseUnits(redemptionAmount, tokenDecimals);
    await sendTx(atContract, "redeemToken", [amount]);
    showToast("Token redemption successful", "success");
    setRedemptionAmount("");
  } catch (error) {
    console.error("Token redemption failed:", error);
    showToast(getErrorMessage(error), "error");
  }
}

export async function externalLockCollateral(
  signer,
  bidManagerAddress,
  collateralManagerAddress,
  tokens,
  amounts,
  setExtraCollateralSelections,
  getTokenDecimals,
  extraCollateralSelections,
  showToast,
  getErrorMessage
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    showToast("BidManager not found", "error");
    return;
  }
  try {
    const amountsInSmallestUnit = [];
    for (let i = 0; i < tokens.length; i++) {
      const tokenAddress = tokens[i];
      const collateralAmount = amounts[i];

      const tokenDecimals = await getTokenDecimals(tokenAddress);

      const amountInSmallestUnit = ethers.utils.parseUnits(collateralAmount, tokenDecimals);
      amountsInSmallestUnit.push(amountInSmallestUnit);
    }

    for (const token of tokens) {
      await approveToken(signer, token, collateralManagerAddress);
    }

    await sendTx(bm, "externalLockCollateral", [tokens, amountsInSmallestUnit]);
    showToast("Extra collateral locked successfully", "success");
    setExtraCollateralSelections(
      extraCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Lock collateral failed:", err);
    showToast(getErrorMessage(err), "error");
  }
}

export async function externalUnlockCollateral(
  signer,
  bidManagerAddress,
  tokens,
  amounts,
  setRemoveCollateralSelections,
  getTokenDecimals,
  removeCollateralSelections,
  showToast,
  getErrorMessage
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    showToast("BidManager not found", "error");
    return;
  }
  try {
    const amountsInSmallestUnit = [];
    for (let i = 0; i < tokens.length; i++) {
      const tokenAddress = tokens[i];
      const collateralAmount = amounts[i];

      const tokenDecimals = await getTokenDecimals(tokenAddress);

      const amountInSmallestUnit = ethers.utils.parseUnits(collateralAmount, tokenDecimals);
      amountsInSmallestUnit.push(amountInSmallestUnit);
    }

    await sendTx(bm, "externalUnlockCollateral", [tokens, amountsInSmallestUnit]);
    showToast("Excessive collateral unlocked successfully", "success");
    setRemoveCollateralSelections(
      removeCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Unlock collateral failed:", err);
    showToast(getErrorMessage(err), "error");
  }
}

export async function removeBid(
  signer,
  bidManagerAddress,
  setBidAmount,
  setBidRate,
  setBidCollateralSelections,
  bidCollateralSelections,
  showToast,
  getErrorMessage
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    showToast("BidManager not found", "error");
    return;
  }
  try {
    await sendTx(bm, "removeBid");
    showToast("Borrow removed and collateral unlocked", "success");
    setBidAmount("");
    setBidRate("");
    setBidCollateralSelections(
      bidCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Remove bid failed:", err);
    showToast(getErrorMessage(err), "error");
  }
}

export async function removeOffer(
  signer,
  offerManagerAddress,
  setOfferAmount,
  setOfferRate,
  showToast,
  getErrorMessage
) {
  const om = new ethers.Contract(offerManagerAddress, OfferManagerArtifact.abi, signer);
  if (!om) {
    showToast("OfferManager not found", "error");
    return;
  }
  try {
    await sendTx(om, "removeOffer");
    showToast("Supply removed and funds unlocked", "success");
    setOfferAmount("");
    setOfferRate("");
  } catch (err) {
    console.error("Remove offer failed:", err);
    showToast(getErrorMessage(err), "error");
  }
}

async function approveToken(signer, tokenAddress, spenderAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
  await sendTx(tokenContract, "approve", [spenderAddress, ethers.constants.MaxUint256]);
}

export async function generateAuctionID(signer, userAddr) {
  const fairyringContract = new ethers.Contract(
    FAIRYRING_CONTRACT_ADDRESS,
    FairyringArtifact.abi,
    signer
  );

  const tx = await sendTx(fairyringContract, "requestGeneralID");
  console.log("Requested new ID:", tx.hash);
  await delay(500); // Delay after transaction to prevent rate limiting
  
  const generalIdBN = await fairyringContract.addressGeneralID(userAddr);
  const auctionIdNum = generalIdBN.sub(ethers.BigNumber.from(1)).toString();

  let ID;
  const maxAttempts = 20;
  const intervalMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ID = await fairyringContract.fids(userAddr, auctionIdNum);
    if (ID !== "") {
      console.log(`Generated ID on attempt ${attempt}:`, ID.toString());
      return ID;
    }
    console.log(`Attempt ${attempt}/${maxAttempts}: fids not ready, retrying in ${intervalMs}ms…`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`fids(${userAddr}, ${auctionIdNum}) stayed zero after ${maxAttempts} retries`);
} 