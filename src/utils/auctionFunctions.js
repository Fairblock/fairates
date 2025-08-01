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
  USDC_ADDRESS,
  DEFAULT_COLLATERAL,
} from "../styles.js";

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
  refreshAuctions
) {
  if (!signer) {
    alert("Please connect your wallet first.");
    return;
  }
  if (!customCollateralToken || !customCollateralRatio) {
    alert("Please enter the initial collateral token address and its ratio.");
    return;
  }
  if (!customMaxBid || !customMaxOffer) {
    alert("Please enter both the maximum bid and maximum offer values.");
    return;
  }
  if (!customPriceOracle || !customBidDuration || !customRevealDuration || !customRepaymentDuration || !customFee || !customAuctionTokenAmount || !customPurchaseToken) {
    alert("Please fill in all custom deployment parameters.");
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
    const DECRYPTER = "0xF760B0F08897CbE3bca53b7840774883Cbc4bF12";
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

    let tx = await sendTx(cmContract, "addAcceptedCollateralToken", [customCollateralToken, Number(customCollateralRatio)]);
    tx = await sendTx(cmContract, "setMaintenanceRatio", [customCollateralToken, Number(customCollateralRatio)]);

    const userAddr = await signer.getAddress();
    const ID = await generateAuctionID(signer, userAddr);

    const AuctionTokenFactory = new ethers.ContractFactory(
      AuctionTokenArtifact.abi,
      AuctionTokenArtifact.bytecode,
      signer
    );
    const tokenName = `${ID}-TOKEN`;
    const tokenSymbol = `${ID}-TOKEN`;
    const atContract = await sendTx(AuctionTokenFactory, "deploy", [tokenName, tokenSymbol]);
    await atContract.deployed();
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

    tx = await sendTx(atContract, "setAuctionContract", [aeContract.address]);
    
    const LendingVaultFactory = new ethers.ContractFactory(
      LendingVaultArtifact.abi,
      LendingVaultArtifact.bytecode,
      signer
    );
    const lvContract = await sendTx(LendingVaultFactory, "deploy", [purchaseToken]);
    await lvContract.deployed();

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

    tx = await sendTx(cmContract, "setManager", [bmContract.address]);
    
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

    tx = await sendTx(aeContract, "setManagers", [bmContract.address, omContract.address]);
    tx = await sendTx(lvContract, "setManager", [omContract.address]);
    
    const auctionContracts = {
      collateralManagerAddress: cmContract.address,
      auctionTokenAddress: auctionTokenAddress,
      auctionEngineAddress: aeContract.address,
      lendingVaultAddress: lvContract.address,
      bidManagerAddress: bmContract.address,
      offerManagerAddress: omContract.address
    };

    setDeployedAuctions((prev) => [...prev, auctionContracts]);

    if (userAddr && userAddr.toLowerCase() === walletAddress.toLowerCase()) {
      setMyAuctions(prev => [...prev, auctionContracts]);
    }
    
    const newList = [...deployedAuctions, auctionContracts];
    setDeployedAuctions(newList);
    selectAuction(auctionContracts);

    await fetch("https://auction-db.fairblock.network:9092/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctions: newList })
    });

    await refreshAuctions();
    alert("All contracts deployed successfully!");

    alert("All contracts deployed successfully with custom parameters.");
  } catch (error) {
    console.error("Custom deployment failed:", error);
    alert("Custom deployment failed: " + error.message);
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
  setNewCollateralRatio
) {
  const cm = new ethers.Contract(collateralManagerAddress, CollateralManagerArtifact.abi, signer);
  if (!cm) {
    alert("CollateralManager not found. Deploy or connect your wallet.");
    return;
  }
  try {
    const ratioBN = ethers.BigNumber.from(newCollateralRatio);
    let tx = await sendTx(cm, "addAcceptedCollateralToken", [newCollateralAddress, 1]);
    tx = await sendTx(cm, "setMaintenanceRatio", [newCollateralAddress, ratioBN]);

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

    alert(`Collateral ${newCollateralAddress} registered (ratio ${newCollateralRatio}).`);
    setNewCollateralAddress("");
    setNewCollateralRatio("");
  } catch (error) {
    console.error("Register collateral failed:", error);
    alert("Register collateral failed: " + error.message);
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
  getTokenDecimals
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  console.log("BidManager address:", bidManagerAddress);
  if (!bm) {
    alert("BidManager not found. Deploy or connect your wallet.");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    alert("AuctionManager not found. Deploy or connect your wallet.");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const quantityBN = ethers.utils.parseUnits(bidAmount, tokenDecimals);

    let encryptedBid = "0x";
    const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
    if (!ae) {
      alert("AuctionEngine not found. Deploy first.");
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
      alert("Enter some collateral amounts > 0.");
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
    const tx = await sendTx(bm, "submitBid", [quantityBN, encryptedBid, tokensArray, amountsArray, purchaseToken]);
    alert("Bid placed successfully.");
    setBidAmount("");
    setBidRate("");
    setBidCollateralSelections(bidCollateralSelections.map(c => ({ address: c.address, amount: "" })));
  } catch (error) {
    console.error("Bid failed:", error);
    alert("Bid failed: " + error.message);
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
  getTokenDecimals
) {
  const om = new ethers.Contract(offerManagerAddress, OfferManagerArtifact.abi, signer);
  const lv = new ethers.Contract(lendingVaultAddress, LendingVaultArtifact.abi, signer);
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!om || !lv || !am) {
    alert("OfferManager or LendingVault not found. Deploy or connect your wallet.");
    return;
  }
  try {
    let encryptedOffer = "0x";
    if (offerRate) {
      const bufferValue = Buffer.from(offerRate, "utf8");
      const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
      if (!ae) {
        alert("AuctionEngine not found. Deploy first.");
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
    await approveToken(purchaseToken, lendingVaultAddress);
    const tx = await sendTx(om, "submitOffer", [quantity, encryptedOffer]);
    alert("Offer placed successfully.");
    setOfferAmount("");
    setOfferRate("");
  } catch (error) {
    console.error("Offer failed:", error);
    alert("Offer failed: " + error.message);
  }
}

export async function finalizeAuction(
  signer,
  auctionEngineAddress,
  walletAddress,
  setDecryptingAuctionAddress
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    alert("AuctionEngine not found.");
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
        const requestTx = await sendTx(fairyringContract, "requestGeneralDecryptionKey", [auctionIdNumber]);
        first = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
      decryptionKey = await fairyringContract.generalDecryptionKeys(walletAddress, auctionIdNumber);
    }
    setDecryptingAuctionAddress(null);

    const keyArray = hexToUint8Array(decryptionKey);
    const tx = await safeSendTx(ae, "decryptBidsBatch", [3, keyArray]);
    const tx2 = await safeSendTx(ae, "decryptOffersBatch", [3, keyArray]);

    alert("Decryption finalized.");
  } catch (error) {
    console.error("Decryption failed:", error);
    setDecryptingAuctionAddress(null);
    alert("Decryption finalization failed: " + error.message);
    return;
  }

  try {
    const tx = await sendTx(ae, "finalizeAuction");
    alert("Auction finalized.");
  } catch (error) {
    console.error("Finalize auction failed:", error);
    alert("Auction finalization failed: " + error.message);
  }
}

export async function repay(
  signer,
  auctionEngineAddress,
  repayAmount,
  setRepayAmount,
  getTokenDecimals
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    alert("LendingVault not found.");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    alert("AuctionManager not found.");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const amountBN = ethers.utils.parseUnits(repayAmount, tokenDecimals);
    await approveToken(purchaseToken, auctionEngineAddress);
    const tx = await sendTx(ae, "repay", [amountBN]);
    alert("Repayment successful.");
    setRepayAmount("");
  } catch (error) {
    console.error("Repayment failed:", error);
    alert("Repayment failed: " + error.message);
  }
}

export async function checkOwed(
  signer,
  auctionEngineAddress,
  walletAddress,
  setOwedAmount,
  getTokenDecimals
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    alert("AuctionEngine not found.");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    alert("AuctionManager not found.");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const owed = await ae.repayments(walletAddress);
    const formattedOwed = ethers.utils.formatUnits(owed, tokenDecimals);
    setOwedAmount(formattedOwed);
    alert(`You owe: ${formattedOwed}`);
  } catch (error) {
    console.error("Check owed failed:", error);
    alert("Failed to check owed amount: " + error.message);
  }
}

export async function liquidate(
  signer,
  auctionEngineAddress,
  liquidationBorrower,
  liquidationCollateralSelections,
  setLiquidationBorrower,
  setLiquidationCollateralSelections,
  getTokenDecimals
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    alert("AuctionEngine not found.");
    return;
  }
  if (!liquidationBorrower) {
    alert("Enter borrower address.");
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
      alert("Enter coverage amounts > 0.");
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
    await approveToken(purchaseToken, auctionEngineAddress);

    let tx;
    if (currentTime < threshold.toNumber()) {
      tx = await sendTx(ae, "batchEarlyLiquidation", [liquidationBorrower, tokensArray, coverageArray]);
    } else {
      tx = await sendTx(ae, "batchLateLiquidation", [liquidationBorrower, tokensArray, coverageArray]);
    }

    alert("Liquidation executed.");
    setLiquidationBorrower("");
    setLiquidationCollateralSelections(liquidationCollateralSelections.map(c => ({ address: c.address, amount: "" })));
  } catch (error) {
    console.error("Liquidation failed:", error);
    alert("Liquidation failed: " + error.message);
  }
}

export async function cancelAuction(
  signer,
  auctionEngineAddress,
  cancelReason,
  setCancelReason
) {
  const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!ae) {
    alert("AuctionEngine not found.");
    return;
  }
  try {
    const tx = await sendTx(ae, "cancelAuction", [cancelReason]);
    alert("Auction canceled.");
    setCancelReason("");
  } catch (error) {
    console.error("Auction cancellation failed:", error);
    alert("Auction cancellation failed: " + error.message);
  }
}

export async function redeemToken(
  signer,
  currentAuction,
  auctionEngineAddress,
  redemptionAmount,
  setRedemptionAmount,
  getTokenDecimals
) {
  if (!signer) {
    alert("Please connect your wallet first.");
    return;
  }
  const atContract = new ethers.Contract(currentAuction.auctionTokenAddress, AuctionTokenArtifact.abi, signer);
  if (!atContract) {
    alert("Auction token contract not found.");
    return;
  }
  const am = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  if (!am) {
    alert("AuctionManager not found.");
    return;
  }
  try {
    const purchaseToken = await am.repaymentToken();
    const tokenDecimals = await getTokenDecimals(purchaseToken);
    const amount = ethers.utils.parseUnits(redemptionAmount, tokenDecimals);
    const tx = await sendTx(atContract, "redeemToken", [amount]);
    alert("Token redemption successful.");
    setRedemptionAmount("");
  } catch (error) {
    console.error("Token redemption failed:", error);
    alert("Token redemption failed: " + error.message);
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
  extraCollateralSelections
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    alert("BidManager not found. Deploy or connect your wallet.");
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

    const tx = await sendTx(bm, "externalLockCollateral", [tokens, amountsInSmallestUnit]);
    alert("Extra collateral locked successfully.");
    setExtraCollateralSelections(
      extraCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Lock collateral failed:", err);
    alert("Lock collateral failed: " + err.message);
  }
}

export async function externalUnlockCollateral(
  signer,
  bidManagerAddress,
  tokens,
  amounts,
  setRemoveCollateralSelections,
  getTokenDecimals,
  removeCollateralSelections
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    alert("BidManager not found. Deploy or connect your wallet.");
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

    const tx = await sendTx(bm, "externalUnlockCollateral", [tokens, amountsInSmallestUnit]);
    alert("Excessive collateral unlocked successfully.");
    setRemoveCollateralSelections(
      removeCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Unlock collateral failed:", err);
    alert("Unlock collateral failed: " + err.message);
  }
}

export async function removeBid(
  signer,
  bidManagerAddress,
  setBidAmount,
  setBidRate,
  setBidCollateralSelections,
  bidCollateralSelections
) {
  const bm = new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  if (!bm) {
    alert("BidManager not found. Deploy or connect your wallet.");
    return;
  }
  try {
    const tx = await sendTx(bm, "removeBid");
    alert("Your bid was removed and collateral unlocked.");
    setBidAmount("");
    setBidRate("");
    setBidCollateralSelections(
      bidCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
    );
  } catch (err) {
    console.error("Remove bid failed:", err);
    alert("Remove bid failed: " + err.message);
  }
}

export async function removeOffer(
  signer,
  offerManagerAddress,
  setOfferAmount,
  setOfferRate
) {
  const om = new ethers.Contract(offerManagerAddress, OfferManagerArtifact.abi, signer);
  if (!om) {
    alert("OfferManager not found. Deploy or connect your wallet.");
    return;
  }
  try {
    const tx = await sendTx(om, "removeOffer");
    alert("Your offer was removed and funds unlocked.");
    setOfferAmount("");
    setOfferRate("");
  } catch (err) {
    console.error("Remove offer failed:", err);
    alert("Remove offer failed: " + err.message);
  }
}

async function approveToken(signer, tokenAddress, spenderAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
  await sendTx(tokenContract, "approve", [spenderAddress, ethers.constants.MaxUint256]);
}

async function generateAuctionID(signer, userAddr) {
  const fairyringContract = new ethers.Contract(
    FAIRYRING_CONTRACT_ADDRESS,
    FairyringArtifact.abi,
    signer
  );

  const tx = await sendTx(fairyringContract, "requestGeneralID");
  console.log("Requested new ID:", tx.hash);
  
  const generalIdBN = await fairyringContract.addressGeneralID(userAddr);
  const auctionIdNum = generalIdBN.sub(ethers.BigNumber.from(1)).toString();

  let ID;
  const maxAttempts = 20;
  const intervalMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ID = await fairyringContract.fids(userAddr, auctionIdNum);
    if (ID != "") {
      console.log(`Generated ID on attempt ${attempt}:`, ID.toString());
      return ID;
    }
    console.log(`Attempt ${attempt}/${maxAttempts}: fids not ready, retrying in ${intervalMs}ms…`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`fids(${userAddr}, ${auctionIdNum}) stayed zero after ${maxAttempts} retries`);
} 