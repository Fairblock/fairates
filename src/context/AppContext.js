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
import {
  deployContractsCustom as deployContractsCustomUtil,
  registerNewCollateral as registerNewCollateralUtil,
  placeBid as placeBidUtil,
  placeOffer as placeOfferUtil,
  finalizeAuction as finalizeAuctionUtil,
  repay as repayUtil,
  checkOwed as checkOwedUtil,
  liquidate as liquidateUtil,
  cancelAuction as cancelAuctionUtil,
  redeemToken as redeemTokenUtil,
  externalLockCollateral as externalLockCollateralUtil,
  externalUnlockCollateral as externalUnlockCollateralUtil,
  removeBid as removeBidUtil,
  removeOffer as removeOfferUtil,
} from "../utils/auctionFunctions.js";
import { getContracts, saveContracts } from "../utils/firebase.js";

// Helper function to extract user-friendly error messages
export function getErrorMessage(error) {
  if (!error) return "An unknown error occurred";
  
  const errorMessage = error.message || error.toString() || "";
  const lowerMessage = errorMessage.toLowerCase();
  
  // User rejected transaction
  if (lowerMessage.includes("user rejected") || 
      lowerMessage.includes("user denied") ||
      lowerMessage.includes("action_cancelled") ||
      error.code === 4001) {
    return "Transaction cancelled";
  }
  
  // Network errors
  if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    return "Network error. Please check your connection";
  }
  
  // Contract not found
  if (lowerMessage.includes("not found") || lowerMessage.includes("does not exist")) {
    return "Contract not found";
  }
  
  // Wallet not connected
  if (lowerMessage.includes("wallet") && lowerMessage.includes("connect")) {
    return "Please connect your wallet";
  }
  
  // Revert reasons (extract from error data) - CHECK THIS FIRST before generic gas errors
  if (error.reason) {
    return error.reason;
  }
  
  // Try to extract revert reason from error data
  if (error.error?.data) {
    try {
      const data = error.error.data;
      if (typeof data === "string" && data.length > 10) {
        const reason = ethers.utils.toUtf8String("0x" + data.slice(10));
        if (reason && reason.length < 100) {
          return reason;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Gas errors - check AFTER revert reasons, and be more specific
  // Only match actual gas-related errors, not just any message containing "gas"
  if (lowerMessage.includes("insufficient funds for gas") ||
      lowerMessage.includes("insufficient balance for gas") ||
      (lowerMessage.includes("gas price") && lowerMessage.includes("insufficient")) ||
      (lowerMessage.includes("gas") && (lowerMessage.includes("too low") || lowerMessage.includes("below")))) {
    return "Insufficient funds for gas";
  }
  
  // Generic error messages - keep them short
  if (lowerMessage.includes("deployment failed")) {
    return "Deployment failed";
  }
  if (lowerMessage.includes("transaction failed")) {
    return "Transaction failed";
  }
  if (lowerMessage.includes("execution reverted")) {
    return "Transaction reverted";
  }
  
  // If message is too long, truncate it
  if (errorMessage.length > 80) {
    return errorMessage.substring(0, 77) + "...";
  }
  
  return errorMessage || "An error occurred";
}

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

// Helper function to check if a provider is MetaMask (not OKX)
function isMetaMaskProvider(provider) {
  if (!provider) return false;
  
  // Explicitly exclude OKX wallets
  if (provider.isOKExWallet || provider.isOkxWallet || provider.isOKX) {
    return false;
  }
  
  // Check for MetaMask-specific internal property (most reliable)
  if (provider._metamask) {
    return true;
  }
  
  // Check for MetaMask flag AND ensure it's not OKX
  if (provider.isMetaMask) {
    // Additional verification: check for MetaMask-specific properties
    // MetaMask has _state property, OKX might not
    if (provider._state !== undefined) {
      return true;
    }
    // Check if it has MetaMask's request method signature
    if (typeof provider.request === 'function') {
      // MetaMask typically has these properties
      if (provider.selectedAddress !== undefined || provider.networkVersion !== undefined) {
        return true;
      }
    }
  }
  
  // Check provider name/identifier
  const providerName = provider.providerName || provider.name || '';
  if (providerName.toLowerCase().includes('metamask')) {
    return true;
  }
  
  // Check constructor name
  if (provider.constructor && provider.constructor.name === 'MetaMaskInpageProvider') {
    return true;
  }
  
  return false;
}

// Store detected MetaMask provider from EIP-6963
let detectedMetaMaskProvider = null;

// Helper function to get MetaMask provider specifically
function getMetaMaskProvider() {
  // First check if we've detected MetaMask via EIP-6963
  if (detectedMetaMaskProvider && isMetaMaskProvider(detectedMetaMaskProvider)) {
    return detectedMetaMaskProvider;
  }
  
  if (!window.ethereum) {
    return null;
  }
  
  // First, check if window.ethereum itself is MetaMask
  if (isMetaMaskProvider(window.ethereum)) {
    return window.ethereum;
  }
  
  // Check if there's a providers array (EIP-6963 or multiple wallets)
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    // Find MetaMask provider in the array
    const metamaskProvider = window.ethereum.providers.find(isMetaMaskProvider);
    if (metamaskProvider) {
      detectedMetaMaskProvider = metamaskProvider;
      return metamaskProvider;
    }
  }
  
  // If we still can't find MetaMask, return null
  // Don't fallback to window.ethereum as it might be OKX
  return null;
}

// Initialize EIP-6963 provider detection
function initializeEIP6963Detection() {
  // Listen for EIP-6963 provider announcements
  window.addEventListener('eip6963:announceProvider', (event) => {
    const { info, provider } = event.detail;
    // Check if this is MetaMask
    if (info.name && info.name.toLowerCase().includes('metamask')) {
      detectedMetaMaskProvider = provider;
      console.log('MetaMask detected via EIP-6963');
    }
  });
  
  // Request provider announcements
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function AppProvider({ children }) {
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState([]);

  async function ensureArbitrumSepolia() {
    const { chainId } = ARBITRUM_SEPOLIA;
    const eth = getMetaMaskProvider();
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
        const auctions = await getContracts();
  
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

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

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
    // Initialize EIP-6963 detection
    initializeEIP6963Detection();
    
    const eth = getMetaMaskProvider();
    if (eth) {
      eth.on("chainChanged", async () => {
        try {
          await ensureArbitrumSepolia();
        } catch (err) {
          console.error("Network switch failed", err);
        }
      });
    }

    if (eth) {
      eth.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setAvailableAccounts(accounts);
          const newAddr = accounts[0];
          setWalletAddress(newAddr);
          refreshAuctions(newAddr);
          const tempProvider = new ethers.providers.Web3Provider(eth);
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
    // Try to get MetaMask provider
    let eth = getMetaMaskProvider();
    
    // If not found immediately, wait a bit and try again (in case MetaMask loads after OKX)
    if (!eth && window.ethereum) {
      // Wait for potential provider array to populate
      await new Promise(resolve => setTimeout(resolve, 100));
      eth = getMetaMaskProvider();
    }
    
    if (!eth) {
      // Check if any wallet is available
      if (!window.ethereum) {
        showToast("No Ethereum wallet found. Please install MetaMask.", "error");
      } else {
        // Provide helpful debugging info
        console.log("Available providers:", {
          hasEthereum: !!window.ethereum,
          isMetaMask: window.ethereum?.isMetaMask,
          isOKX: window.ethereum?.isOKExWallet || window.ethereum?.isOkxWallet,
          hasProviders: !!window.ethereum?.providers,
          providersCount: window.ethereum?.providers?.length || 0
        });
        showToast("MetaMask wallet not detected. Please ensure MetaMask is installed.", "error");
      }
      return;
    }
    
    // Verify we have the right provider before connecting
    if (!isMetaMaskProvider(eth)) {
      console.error("Provider verification failed - not MetaMask");
      showToast("Failed to connect to MetaMask. Please try again.", "error");
      return;
    }
    
    try {
      await ensureArbitrumSepolia();

      const accounts = await eth.request({
        method: "eth_requestAccounts",
      });
      
      // Verify the provider is still MetaMask after connection
      const currentProvider = getMetaMaskProvider();
      if (!currentProvider || currentProvider !== eth) {
        console.warn("Provider changed after connection request");
      }
      
      setAvailableAccounts(accounts);

      const provider = new ethers.providers.Web3Provider(eth);
      const newSigner = provider.getSigner();
      setSigner(newSigner);
      setWalletAddress(accounts[0]);
      refreshAuctions(accounts[0]);
    } catch (error) {
      console.error("Wallet connection error:", error);
      // Check if error is because user rejected
      if (error.code === 4001) {
        showToast("Connection rejected", "warning");
      } else {
        showToast(getErrorMessage(error), "error");
      }
    }
  }

  function disconnectWallet() {
    setSigner(null);
    setWalletAddress("");
    setAvailableAccounts([]);
    refreshAuctions([]);
  }

  function switchAccount(account) {
    const eth = getMetaMaskProvider();
    if (!eth) {
      showToast("MetaMask wallet not found", "error");
      return;
    }
    const provider = new ethers.providers.Web3Provider(eth);
    const index = availableAccounts.indexOf(account);
    if (index === -1) return;
    const newSigner = provider.getSigner(index);
    setSigner(newSigner);
    setWalletAddress(account);
    refreshAuctions(account); 
  }

  async function approveToken(tokenAddress, spenderAddress) {
    if (!signer) {
      showToast("Please connect your wallet first", "warning");
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
      showToast("Please connect your wallet first", "warning");
      return;
    }
    try {
      const userAddr = await signer.getAddress();
      //const ID = await generateAuctionID(signer, userAddr);
      const ID = "test";
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
      await sleep(500); // Delay after deployment

      let tx = await sendTx(cmContract, "addAcceptedCollateralToken", [DEFAULT_COLLATERAL, 1]);
      await sleep(300); // Delay between transactions
      tx = await sendTx(cmContract, "setMaintenanceRatio", [DEFAULT_COLLATERAL, 1]);
      await sleep(300); // Delay between transactions

      const AuctionTokenFactory = new ethers.ContractFactory(
        AuctionTokenArtifact.abi,
        AuctionTokenArtifact.bytecode,
        signer
      );
      const tokenName = `${ID}-TOKEN`;
      const tokenSymbol = `${ID}-TOKEN`;
      const atContract = await deployWithGas(AuctionTokenFactory, [tokenName, tokenSymbol]);
      await atContract.deployed();
      await sleep(500); // Delay after deployment
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
      await sleep(500); // Delay after deployment

      tx = await sendTx(atContract, "setAuctionContract", [aeContract.address]);
      await sleep(300); // Delay between transactions
      
      const LendingVaultFactory = new ethers.ContractFactory(
        LendingVaultArtifact.abi,
        LendingVaultArtifact.bytecode,
        signer
      );
      const lvContract = await deployWithGas(LendingVaultFactory, [USDC_ADDRESS]);
      await lvContract.deployed();
      setLendingVaultAddress(lvContract.address);
      await sleep(500); // Delay after deployment

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
      await sleep(500); // Delay after deployment

      tx = await sendTx(cmContract, "setManager", [bmContract.address]);
      await sleep(300); // Delay between transactions
      
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
      await sleep(500); // Delay after deployment

      tx = await sendTx(aeContract, "setManagers", [bmContract.address, omContract.address]);
      await sleep(300); // Delay between transactions
      tx = await sendTx(lvContract, "setManager", [omContract.address]);
      await sleep(300); // Delay between transactions
      
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

      await saveContracts(newList);

      await refreshAuctions();

      showToast("All contracts deployed successfully!", "success");
    } catch (error) {
      console.error("Deployment failed:", error);
      showToast(getErrorMessage(error), "error");
    }
  }

  // Wrapper functions that call the utility functions with proper context
  async function deployContractsCustom() {
    return deployContractsCustomUtil(
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
    );
  }

  async function registerNewCollateral() {
    return registerNewCollateralUtil(
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
    );
  }

  async function placeBid() {
    return placeBidUtil(
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
    );
  }

  async function placeOffer() {
    return placeOfferUtil(
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
    );
  }

  async function finalizeAuction() {
    return finalizeAuctionUtil(
      signer,
      auctionEngineAddress,
      walletAddress,
      setDecryptingAuctionAddress,
      showToast,
      getErrorMessage
    );
  }

  async function repay() {
    return repayUtil(
      signer,
      auctionEngineAddress,
      repayAmount,
      setRepayAmount,
      getTokenDecimals,
      showToast,
      getErrorMessage
    );
  }

  async function checkOwed() {
    return checkOwedUtil(
      signer,
      auctionEngineAddress,
      walletAddress,
      setOwedAmount,
      getTokenDecimals,
      showToast,
      getErrorMessage
    );
  }

  async function liquidate() {
    return liquidateUtil(
      signer,
      auctionEngineAddress,
      liquidationBorrower,
      liquidationCollateralSelections,
      setLiquidationBorrower,
      setLiquidationCollateralSelections,
      getTokenDecimals,
      showToast,
      getErrorMessage
    );
  }

  async function cancelAuction() {
    return cancelAuctionUtil(
      signer,
      auctionEngineAddress,
      cancelReason,
      setCancelReason,
      showToast,
      getErrorMessage
    );
  }

  async function redeemToken() {
    return redeemTokenUtil(
      signer,
      currentAuction,
      auctionEngineAddress,
      redemptionAmount,
      setRedemptionAmount,
      getTokenDecimals,
      showToast,
      getErrorMessage
    );
  }

  async function externalLockCollateral() {
    return externalLockCollateralUtil(
      signer,
      bidManagerAddress,
      collateralManagerAddress,
      extraCollateralSelections.map(c => c.address),
      extraCollateralSelections.map(c => c.amount),
      setExtraCollateralSelections,
      getTokenDecimals,
      extraCollateralSelections,
      showToast,
      getErrorMessage
    );
  }

  async function externalUnlockCollateral() {
    return externalUnlockCollateralUtil(
      signer,
      bidManagerAddress,
      removeCollateralSelections.map(c => c.address),
      removeCollateralSelections.map(c => c.amount),
      setRemoveCollateralSelections,
      getTokenDecimals,
      removeCollateralSelections,
      showToast,
      getErrorMessage
    );
  }

  async function removeBid() {
    return removeBidUtil(
      signer,
      bidManagerAddress,
      setBidAmount,
      setBidRate,
      setBidCollateralSelections,
      bidCollateralSelections,
      showToast,
      getErrorMessage
    );
  }

  async function removeOffer() {
    return removeOfferUtil(
      signer,
      offerManagerAddress,
      setOfferAmount,
      setOfferRate,
      showToast,
      getErrorMessage
    );
  }

  function handleUnlockCollateralToggle(index) {
    setUnlockCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unlock: !updated[index].unlock };
      return updated;
    });
  }

  useEffect(() => {
    getContracts()
      .then((auctions) => {
        if (auctions && auctions.length > 0) {
          const latestAuction = auctions[auctions.length - 1];
          setCollateralManagerAddress(latestAuction.collateralManagerAddress);
          setAuctionEngineAddress(latestAuction.auctionEngineAddress);
          setLendingVaultAddress(latestAuction.lendingVaultAddress);
          setBidManagerAddress(latestAuction.bidManagerAddress);
          setOfferManagerAddress(latestAuction.offerManagerAddress);
          setDeployedAuctions(auctions);
        }
        setServerLoaded(true);
      })
      .catch((error) => console.error("Error fetching contracts from Firestore:", error));
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
    showToast,
    hideToast,
    toast,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
} 