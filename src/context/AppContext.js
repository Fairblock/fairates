import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { timelockEncrypt } from "ts-ibe";
import { sendTx, deployWithGas, safeSendTx } from "../utils/deploy.js";
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
  ARBITRUM_SEPOLIA,
} from "../styles.js";

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) public returns (bool)"
];

function hexToUint8Array(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return arr;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState([]);

  async function ensureArbitrumSepolia() {
    const { chainId } = ARBITRUM_SEPOLIA;
    const eth = window.ethereum;
    if (!eth) return;

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [ARBITRUM_SEPOLIA],
        });
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
      } else {
        throw switchErr;
      }
    }
  }

  async function getTokenDecimals(tokenAddress) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals();
    return decimals;
  }

  const [myAuctions, setMyAuctions] = useState([]);
  const [deployedAuctions, setDeployedAuctions] = useState([]);
  const [collateralManagerAddress, setCollateralManagerAddress] = useState("");
  const [auctionEngineAddress, setAuctionEngineAddress] = useState("");
  const [lendingVaultAddress, setLendingVaultAddress] = useState("");
  const [bidManagerAddress, setBidManagerAddress] = useState("");
  const [offerManagerAddress, setOfferManagerAddress] = useState("");

  const refreshAuctions = useCallback(
    async (addr = walletAddress) => {
      try {
        const res = await fetch("https://auction-db.fairblock.network:9092/contracts");
        const { auctions = [] } = await res.json();
  
        setDeployedAuctions(auctions);
  
        if (!addr) { setMyAuctions([]); return; }
  
        const provider = signer?.provider ??
                         ethers.getDefaultProvider(ARBITRUM_SEPOLIA.rpcUrls[0]);
        const iface    = new ethers.utils.Interface(["function owner() view returns (address)"]);
  
        const mine = await Promise.all(
          auctions.map(async a => {
            try {
              const data   = await provider.call({
                to:   a.auctionEngineAddress,
                data: iface.encodeFunctionData("owner"),
              });
              const [owner] = iface.decodeFunctionResult("owner", data);
              return owner.toLowerCase() === addr.toLowerCase() ? a : null;
            } catch { return null; }
          })
        );
  
        setMyAuctions(mine.filter(Boolean));
      } catch (err) {
        console.error("refreshAuctions:", err);
      }
    },
    [signer]
  );

  const [currentAuction, setCurrentAuction] = useState(null);
  const [availableCollaterals, setAvailableCollaterals] = useState([]);
  const [newCollateralAddress, setNewCollateralAddress] = useState("");
  const [newCollateralRatio, setNewCollateralRatio] = useState("");
  const [registeredCollaterals, setRegisteredCollaterals] = useState([]);

  const [bidAmount, setBidAmount] = useState("");
  const [bidRate, setBidRate] = useState("");
  const [bidCollateralSelections, setBidCollateralSelections] = useState([]);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerRate, setOfferRate] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [owedAmount, setOwedAmount] = useState("");
  const [liquidationBorrower, setLiquidationBorrower] = useState("");
  const [liquidationCollateralSelections, setLiquidationCollateralSelections] = useState([]);
  const [cancelReason, setCancelReason] = useState("test");
  const [unlockCollateralSelections, setUnlockCollateralSelections] = useState([]);
  const [decryptingAuctionAddress, setDecryptingAuctionAddress] = useState(null);
  const [auctionIdNumber, setAuctionIdNumber] = useState(null);

  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [extraCollateralSelections, setExtraCollateralSelections] = useState([]);
  const [removeCollateralSelections, setRemoveCollateralSelections] = useState([]);

  // Custom deployment parameters
  const [customPriceOracle, setCustomPriceOracle] = useState("");
  const [customBidDuration, setCustomBidDuration] = useState("");
  const [customRevealDuration, setCustomRevealDuration] = useState("");
  const [customRepaymentDuration, setCustomRepaymentDuration] = useState("");
  const [customFee, setCustomFee] = useState("");
  const [customAuctionTokenAmount, setCustomAuctionTokenAmount] = useState("");
  const [customDecrypter, setCustomDecrypter] = useState("");
  const [customPurchaseToken, setCustomPurchaseToken] = useState("");
  const [customMaxNumBids, setCustomMaxNumBids] = useState("");
  const [customMaxNumOffers, setCustomMaxNumOffers] = useState("");
  const [customMinBid, setCustomMinBid] = useState("");
  const [customMinOffer, setCustomMinOffer] = useState("");
  const [customProtocolLiquidationFee, setCustomProtocolLiquidationFee] = useState("");
  const [customLiquidationFee, setCustomLiquidationFee] = useState("");
  const [customMaxBid, setCustomMaxBid] = useState("");
  const [customMaxOffer, setCustomMaxOffer] = useState("");
  const [customCollateralToken, setCustomCollateralToken] = useState("");
  const [customCollateralRatio, setCustomCollateralRatio] = useState("");

  const [serverLoaded, setServerLoaded] = useState(false);

  // run once on mount
  useEffect(() => { refreshAuctions(); }, []);

  // run every time the active wallet or signer really changes
  useEffect(() => {
    if (walletAddress && signer) {
      refreshAuctions(walletAddress);
    }
  }, [walletAddress, signer, refreshAuctions]);

  useEffect(() => {
    async function updateCollateralSelections() {
      if (!collateralManagerAddress || !signer) {
        setAvailableCollaterals([{ address: DEFAULT_COLLATERAL, ratio: "1 (default)" }]);
        setBidCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
        setLiquidationCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
        setUnlockCollateralSelections([{ address: DEFAULT_COLLATERAL, unlock: false }]);
        return;
      }
      const cm = getCollateralManagerContract();
      if (cm) {
        try {
          const tokens = await cm.getAcceptedCollateralTokens();
          const tokensWithDefaults = tokens.map(token => ({
            address: token,
            ratio: "1 (default)"
          }));
          setAvailableCollaterals(tokensWithDefaults);
          setBidCollateralSelections(tokens.map(token => ({ address: token, amount: "" })));
          setLiquidationCollateralSelections(tokens.map(token => ({ address: token, amount: "" })));
          setUnlockCollateralSelections(tokens.map(token => ({ address: token, unlock: false })));
        } catch (error) {
          console.error("Error fetching accepted collateral tokens:", error);
          setAvailableCollaterals([{ address: DEFAULT_COLLATERAL, ratio: "1 (default)" }]);
          setBidCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
          setLiquidationCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
          setUnlockCollateralSelections([{ address: DEFAULT_COLLATERAL, unlock: false }]);
        }
      }
    }
    updateCollateralSelections();
  }, [collateralManagerAddress, signer]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", async () => {
        try {
          await ensureArbitrumSepolia();
        } catch (err) {
          console.error("Network switch failed", err);
        }
      });
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setAvailableAccounts(accounts);
          const newAddr = accounts[0];
          setWalletAddress(newAddr);
          refreshAuctions(newAddr);
          const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
          const tempSigner = tempProvider.getSigner(0);
          setSigner(tempSigner);
        } else {
          setWalletAddress("");
          setSigner(null);
          setAvailableAccounts([]);
        }
      });
    }
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("No Ethereum wallet found. Please install MetaMask.");
      return;
    }
    try {
      await ensureArbitrumSepolia();

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAvailableAccounts(accounts);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newSigner = provider.getSigner();
      setSigner(newSigner);
      setWalletAddress(accounts[0]);
      refreshAuctions(accounts[0]);
    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet: " + error.message);
    }
  }

  function disconnectWallet() {
    setSigner(null);
    setWalletAddress("");
    setAvailableAccounts([]);
    refreshAuctions([]);
  }

  function switchAccount(account) {
    if (!window.ethereum) {
      alert("No Ethereum wallet found.");
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const index = availableAccounts.indexOf(account);
    if (index === -1) return;
    const newSigner = provider.getSigner(index);
    setSigner(newSigner);
    setWalletAddress(account);
    refreshAuctions(account); 
  }

  async function approveToken(tokenAddress, spenderAddress) {
    if (!signer) {
      alert("No signer. Please connect your wallet first.");
      return;
    }
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      await sendTx(tokenContract, "approve", [spenderAddress, ethers.constants.MaxUint256]);
    } catch (error) {
      console.error("Approval failed:", error);
      throw new Error("Approval failed: " + error.message);
    }
  }

  function getCollateralManagerContract() {
    if (!signer || !collateralManagerAddress) return null;
    return new ethers.Contract(collateralManagerAddress, CollateralManagerArtifact.abi, signer);
  }

  function getAuctionEngineContract() {
    if (!signer || !auctionEngineAddress) return null;
    return new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
  }

  function getLendingVaultContract() {
    if (!signer || !lendingVaultAddress) return null;
    return new ethers.Contract(lendingVaultAddress, LendingVaultArtifact.abi, signer);
  }

  function getBidManagerContract() {
    if (!signer || !bidManagerAddress) return null;
    return new ethers.Contract(bidManagerAddress, BidManagerArtifact.abi, signer);
  }

  function getOfferManagerContract() {
    if (!signer || !offerManagerAddress) return null;
    return new ethers.Contract(offerManagerAddress, OfferManagerArtifact.abi, signer);
  }

  function getAuctionTokenContract() {
    if (!signer || !currentAuction || !currentAuction.auctionTokenAddress) return null;
    return new ethers.Contract(currentAuction.auctionTokenAddress, AuctionTokenArtifact.abi, signer);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    setAuctionIdNumber(auctionIdNum);

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
      await sleep(intervalMs);
    }

    throw new Error(`fids(${userAddr}, ${auctionIdNum}) stayed zero after ${maxAttempts} retries`);
  }

  function selectAuction(auctionObj) {
    setCurrentAuction(auctionObj);
    setCollateralManagerAddress(auctionObj.collateralManagerAddress);
    setAuctionEngineAddress(auctionObj.auctionEngineAddress);
    setLendingVaultAddress(auctionObj.lendingVaultAddress);
    setBidManagerAddress(auctionObj.bidManagerAddress);
    setOfferManagerAddress(auctionObj.offerManagerAddress);
  }

  // Contract deployment functions
  async function deployContracts() {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const userAddr = await signer.getAddress();
      const ID = await generateAuctionID(signer, userAddr);
      console.log("Generated ID:", ID);
      const priceOracle = "0x2fE2885Ee7c2e43B3219cD63629dbE736bDF8206";
      
      const CollateralManagerFactory = new ethers.ContractFactory(
        CollateralManagerArtifact.abi,
        CollateralManagerArtifact.bytecode,
        signer
      );
      const cmContract = await deployWithGas(CollateralManagerFactory, [priceOracle]);
      await cmContract.deployed();
      setCollateralManagerAddress(cmContract.address);

      let tx = await sendTx(cmContract, "addAcceptedCollateralToken", [DEFAULT_COLLATERAL, 1]);
      tx = await sendTx(cmContract, "setMaintenanceRatio", [DEFAULT_COLLATERAL, 1]);

      const AuctionTokenFactory = new ethers.ContractFactory(
        AuctionTokenArtifact.abi,
        AuctionTokenArtifact.bytecode,
        signer
      );
      const tokenName = `${ID}-TOKEN`;
      const tokenSymbol = `${ID}-TOKEN`;
      const atContract = await deployWithGas(AuctionTokenFactory, [tokenName, tokenSymbol]);
      await atContract.deployed();
      const auctionTokenAddress = atContract.address;

      const BID_DURATION = 6000000;
      const REVEAL_DURATION = 31104000;
      const LOAN_DURATION = 1;
      const FEE = 0;
      const AUCTION_TOKEN_AMOUNT = 1;
      const DECRYPTER = "0xF760B0F08897CbE3bca53b7840774883Cbc4bF12";
      
      const AuctionEngineFactory = new ethers.ContractFactory(
        AuctionEngineArtifact.abi,
        AuctionEngineArtifact.bytecode,
        signer
      );
      const aeContract = await deployWithGas(AuctionEngineFactory, [DECRYPTER,
        BID_DURATION,
        REVEAL_DURATION,
        LOAN_DURATION,
        ID,
        USDC_ADDRESS,
        FEE,
        FEE,
        FEE,
        auctionTokenAddress,
        AUCTION_TOKEN_AMOUNT]);
      await aeContract.deployed();
      setAuctionEngineAddress(aeContract.address);

      tx = await sendTx(atContract, "setAuctionContract", [aeContract.address]);
      
      const LendingVaultFactory = new ethers.ContractFactory(
        LendingVaultArtifact.abi,
        LendingVaultArtifact.bytecode,
        signer
      );
      const lvContract = await deployWithGas(LendingVaultFactory, [USDC_ADDRESS]);
      await lvContract.deployed();
      setLendingVaultAddress(lvContract.address);

      const BidManagerFactory = new ethers.ContractFactory(
        BidManagerArtifact.abi,
        BidManagerArtifact.bytecode,
        signer
      );
      const maxBid = ethers.utils.parseUnits("15000", 18);
      const minBid = ethers.utils.parseUnits("10", 18);
      const bmContract = await deployWithGas(BidManagerFactory, [cmContract.address,
        aeContract.address,
        maxBid,
        USDC_ADDRESS,
        minBid,
        50]);
      await bmContract.deployed();
      setBidManagerAddress(bmContract.address);

      tx = await sendTx(cmContract, "setManager", [bmContract.address]);
      
      const OfferManagerFactory = new ethers.ContractFactory(
        OfferManagerArtifact.abi,
        OfferManagerArtifact.bytecode,
        signer
      );
      const maxOffer = ethers.utils.parseUnits("10000", 18);
      const minOffer = ethers.utils.parseUnits("10", 18);
      const omContract = await deployWithGas(OfferManagerFactory, [lvContract.address, aeContract.address, maxOffer, minOffer, 50]);
      await omContract.deployed();
      setOfferManagerAddress(omContract.address);

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

      alert("All contracts deployed successfully. Auction address: " + auctionContracts.auctionEngineAddress);
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed: " + error.message + ". Check console for details.");
    }
  }

  // Add missing functions from auctionFunctions.js
  async function deployContractsCustom() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function registerNewCollateral() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function placeBid() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function placeOffer() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function finalizeAuction() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function repay() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function checkOwed() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function liquidate() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function cancelAuction() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function redeemToken() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function externalLockCollateral() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function externalUnlockCollateral() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function removeBid() {
    // This will be implemented by importing from auctionFunctions.js
  }

  async function removeOffer() {
    // This will be implemented by importing from auctionFunctions.js
  }

  function handleUnlockCollateralToggle(index) {
    setUnlockCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unlock: !updated[index].unlock };
      return updated;
    });
  }

  useEffect(() => {
    fetch("https://auction-db.fairblock.network:9092/contracts")
      .then((response) => response.json())
      .then((data) => {
        if (data.auctions && data.auctions.length > 0) {
          const latestAuction = data.auctions[data.auctions.length - 1];
          setCollateralManagerAddress(latestAuction.collateralManagerAddress);
          setAuctionEngineAddress(latestAuction.auctionEngineAddress);
          setLendingVaultAddress(latestAuction.lendingVaultAddress);
          setBidManagerAddress(latestAuction.bidManagerAddress);
          setOfferManagerAddress(latestAuction.offerManagerAddress);
          setDeployedAuctions(data.auctions);
        }
        setServerLoaded(true);
      })
      .catch((error) => console.error("Error fetching contracts from server:", error));
  }, []);

  const contextValue = {
    signer,
    walletAddress,
    connectWallet,
    disconnectWallet,
    availableAccounts,
    switchAccount,
    deployedAuctions,
    myAuctions,
    currentAuction,
    selectAuction,
    collateralManagerAddress,
    setCollateralManagerAddress,
    auctionEngineAddress,
    setAuctionEngineAddress,
    lendingVaultAddress,
    setLendingVaultAddress,
    bidManagerAddress,
    setBidManagerAddress,
    offerManagerAddress,
    setOfferManagerAddress,
    availableCollaterals,
    setAvailableCollaterals,
    newCollateralAddress,
    setNewCollateralAddress,
    newCollateralRatio,
    setNewCollateralRatio,
    registeredCollaterals,
    bidAmount,
    setBidAmount,
    bidRate,
    setBidRate,
    bidCollateralSelections,
    setBidCollateralSelections,
    offerAmount,
    setOfferAmount,
    offerRate,
    setOfferRate,
    secretKey,
    setSecretKey,
    decryptingAuctionAddress,
    auctionIdNumber,
    repayAmount,
    setRepayAmount,
    owedAmount,
    setOwedAmount,
    liquidationBorrower,
    setLiquidationBorrower,
    liquidationCollateralSelections,
    setLiquidationCollateralSelections,
    cancelReason,
    setCancelReason,
    unlockCollateralSelections,
    setUnlockCollateralSelections,
    redemptionAmount,
    setRedemptionAmount,
    extraCollateralSelections,
    setExtraCollateralSelections,
    removeCollateralSelections,
    setRemoveCollateralSelections,
    customPriceOracle,
    setCustomPriceOracle,
    customBidDuration,
    setCustomBidDuration,
    customRevealDuration,
    setCustomRevealDuration,
    customRepaymentDuration,
    setCustomRepaymentDuration,
    customFee,
    setCustomFee,
    setCustomLiquidationFee,
    customLiquidationFee,
    setCustomProtocolLiquidationFee,
    customProtocolLiquidationFee,
    customAuctionTokenAmount,
    setCustomAuctionTokenAmount,
    customDecrypter,
    setCustomDecrypter,
    customPurchaseToken,
    setCustomPurchaseToken,
    customMaxBid,
    setCustomMaxBid,
    customMaxOffer,
    setCustomMaxOffer,
    setCustomMinBid,
    customMinOffer,
    setCustomMinOffer,
    customMinBid,
    setCustomMaxNumBids,
    setCustomMaxNumOffers,
    customMaxNumBids,
    customMaxNumOffers,
    customCollateralToken,
    setCustomCollateralToken,
    customCollateralRatio,
    setCustomCollateralRatio,
    deployContracts,
    getCollateralManagerContract,
    getAuctionEngineContract,
    getLendingVaultContract,
    getBidManagerContract,
    getOfferManagerContract,
    getAuctionTokenContract,
    approveToken,
    getTokenDecimals,
    registerNewCollateral,
    placeBid,
    placeOffer,
    finalizeAuction,
    repay,
    checkOwed,
    liquidate,
    cancelAuction,
    redeemToken,
    externalLockCollateral,
    externalUnlockCollateral,
    removeBid,
    removeOffer,
    handleUnlockCollateralToggle,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
} 