import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { timelockEncrypt } from "ts-ibe";

// Contract Artifacts
import CollateralManagerArtifact from "./CollateralManager.json";
import AuctionTokenArtifact from "./AuctionToken.json";
import AuctionEngineArtifact from "./AuctionEngine.json";
import LendingVaultArtifact from "./LendingVault.json";
import BidManagerArtifact from "./BidManager.json";
import OfferManagerArtifact from "./OfferManager.json";
import FairyringArtifact from "./FairyringContract.json";

// Constants
const FAIRYRING_CONTRACT_ADDRESS = "0xcBD4E181561fF26e9Cf20C4B1250fA7D0049BA95";
const ERC20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];
const T1_ADDRESS = "0xDB1E18f9eb609FD8027DF1fCcc06315f019C0dA0";
const DEFAULT_COLLATERAL = "0x2367dDf156601b411479A3745B20f0618055270E";

// Utility function: convert hex string to Uint8Array
function hexToUint8Array(hex) {
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return arr;
}

// Create the app context
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");

  // Initialize from localStorage first, in case the server is empty
  const [deployedAuctions, setDeployedAuctions] = useState(() => {
    const saved = localStorage.getItem("deployedAuctions");
    return saved ? JSON.parse(saved) : [];
  });
  const [collateralManagerAddress, setCollateralManagerAddress] = useState(() => {
    return localStorage.getItem("collateralManagerAddress") || "";
  });
  const [auctionEngineAddress, setAuctionEngineAddress] = useState(() => {
    return localStorage.getItem("auctionEngineAddress") || "";
  });
  const [lendingVaultAddress, setLendingVaultAddress] = useState(() => {
    return localStorage.getItem("lendingVaultAddress") || "";
  });
  const [bidManagerAddress, setBidManagerAddress] = useState(() => {
    return localStorage.getItem("bidManagerAddress") || "";
  });
  const [offerManagerAddress, setOfferManagerAddress] = useState(() => {
    return localStorage.getItem("offerManagerAddress") || "";
  });

  // Other states (non-persisted)
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
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [auctionIdNumber, setAuctionIdNumber] = useState(null);

  // Flag to indicate that data from server has been loaded
  const [serverLoaded, setServerLoaded] = useState(false);

  // Initialize arrays
  useEffect(() => {
    setAvailableCollaterals([{ address: DEFAULT_COLLATERAL, ratio: "1 (default)" }]);
    setBidCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
    setLiquidationCollateralSelections([{ address: DEFAULT_COLLATERAL, amount: "" }]);
    setUnlockCollateralSelections([{ address: DEFAULT_COLLATERAL, unlock: false }]);
  }, []);

  // Save changes to localStorage as well
  useEffect(() => {
    localStorage.setItem("deployedAuctions", JSON.stringify(deployedAuctions));
  }, [deployedAuctions]);
  useEffect(() => {
    localStorage.setItem("collateralManagerAddress", collateralManagerAddress);
  }, [collateralManagerAddress]);
  useEffect(() => {
    localStorage.setItem("auctionEngineAddress", auctionEngineAddress);
  }, [auctionEngineAddress]);
  useEffect(() => {
    localStorage.setItem("lendingVaultAddress", lendingVaultAddress);
  }, [lendingVaultAddress]);
  useEffect(() => {
    localStorage.setItem("bidManagerAddress", bidManagerAddress);
  }, [bidManagerAddress]);
  useEffect(() => {
    localStorage.setItem("offerManagerAddress", offerManagerAddress);
  }, [offerManagerAddress]);

  // Listen for account changes via MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          const newAddr = accounts[0];
          setWalletAddress(newAddr);
          const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
          const tempSigner = tempProvider.getSigner();
          setSigner(tempSigner);
        } else {
          setWalletAddress("");
          setSigner(null);
        }
      });
    }
  }, []);

  // Wallet connection function
  async function connectWallet() {
    if (!window.ethereum) {
      alert("No Ethereum wallet found. Please install MetaMask.");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newSigner = provider.getSigner();
      const address = await newSigner.getAddress();
      setSigner(newSigner);
      setWalletAddress(address);
    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet.");
    }
  }

  // Approve token function
  async function approveToken(tokenAddress, spenderAddress) {
    if (!signer) {
      alert("No signer. Please connect your wallet first.");
      return;
    }
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
      await tx.wait();
    } catch (error) {
      console.error("Approval failed:", error);
      throw new Error("Approval failed");
    }
  }

  // Contract getters
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

  // Auction ID generation via Fairyring
  async function generateAuctionID(signer, userAddr) {
    const fairyringContract = new ethers.Contract(
      FAIRYRING_CONTRACT_ADDRESS,
      FairyringArtifact.abi,
      signer
    );
    const tx = await fairyringContract.requestGeneralID();
    await tx.wait();
    const generalIdBN = await fairyringContract.addressGeneralID(userAddr);
    const auctionIdNum = generalIdBN.sub(ethers.BigNumber.from(1)).toString();
    setAuctionIdNumber(auctionIdNum);
    const ID = `fairy1m9l358xunhhwds0568za49mzhvuxx9uxdra8sq/${userAddr}/${auctionIdNum}`;
    return ID;
  }

  // Deploy contracts (Developer functionality)
  async function deployContracts() {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const priceOracle = "0x0cE2ae8BC8c40F341d950d2Fbf7B3180d5783ce4";
      // 1) CollateralManager
      const CollateralManagerFactory = new ethers.ContractFactory(
        CollateralManagerArtifact.abi,
        CollateralManagerArtifact.bytecode,
        signer
      );
      const cmContract = await CollateralManagerFactory.deploy(priceOracle);
      await cmContract.deployed();
      setCollateralManagerAddress(cmContract.address);
      console.log("CollateralManager deployed at:", cmContract.address);

      let tx = await cmContract.addAcceptedCollateralToken(DEFAULT_COLLATERAL, 1);
      await tx.wait();
      tx = await cmContract.setMaintenanceRatio(DEFAULT_COLLATERAL, 1);
      await tx.wait();

      // Auction ID
      const userAddr = await signer.getAddress();
      const ID = await generateAuctionID(signer, userAddr);

      // 2) AuctionToken
      const AuctionTokenFactory = new ethers.ContractFactory(
        AuctionTokenArtifact.abi,
        AuctionTokenArtifact.bytecode,
        signer
      );
      const tokenName = `${ID}-TOKEN`;
      const tokenSymbol = `${ID}-TOKEN`;
      const atContract = await AuctionTokenFactory.deploy(tokenName, tokenSymbol);
      await atContract.deployed();
      const auctionTokenAddress = atContract.address;
      console.log("AuctionToken deployed at:", auctionTokenAddress);

      // 3) AuctionEngine
      const BID_DURATION = 6000;
      const REVEAL_DURATION = 31104000;
      const REPAYMENT_DURATION = 1;
      const FEE = 0;
      const AUCTION_TOKEN_AMOUNT = 1;
      const DECRYPTER = "0xF760B0F08897CbE3bca53b7840774883Cbc4bF12";
      const AuctionEngineFactory = new ethers.ContractFactory(
        AuctionEngineArtifact.abi,
        AuctionEngineArtifact.bytecode,
        signer
      );
      const aeContract = await AuctionEngineFactory.deploy(
        DECRYPTER,
        BID_DURATION,
        REVEAL_DURATION,
        REPAYMENT_DURATION,
        ID,
        T1_ADDRESS,
        FEE,
        auctionTokenAddress,
        AUCTION_TOKEN_AMOUNT
      );
      await aeContract.deployed();
      setAuctionEngineAddress(aeContract.address);
      console.log("AuctionEngine deployed at:", aeContract.address);

      tx = await atContract.setAuctionContract(aeContract.address);
      await tx.wait();

      // Add deployed AuctionEngine address to our array
      setDeployedAuctions((prev) => {
        const newArray = [...prev, aeContract.address];
        console.log("New deployedAuctions array:", newArray);
        return newArray;
      });

      // 4) LendingVault
      const LendingVaultFactory = new ethers.ContractFactory(
        LendingVaultArtifact.abi,
        LendingVaultArtifact.bytecode,
        signer
      );
      const lvContract = await LendingVaultFactory.deploy(T1_ADDRESS);
      await lvContract.deployed();
      setLendingVaultAddress(lvContract.address);
      console.log("LendingVault deployed at:", lvContract.address);

      // 5) BidManager
      const BidManagerFactory = new ethers.ContractFactory(
        BidManagerArtifact.abi,
        BidManagerArtifact.bytecode,
        signer
      );
      const bmContract = await BidManagerFactory.deploy(
        cmContract.address,
        aeContract.address,
        15000,
        T1_ADDRESS
      );
      await bmContract.deployed();
      setBidManagerAddress(bmContract.address);
      console.log("BidManager deployed at:", bmContract.address);

      tx = await cmContract.setController(bmContract.address);
      await tx.wait();
      console.log("CollateralManager controller updated to BidManager.");

      // 6) OfferManager
      const OfferManagerFactory = new ethers.ContractFactory(
        OfferManagerArtifact.abi,
        OfferManagerArtifact.bytecode,
        signer
      );
      const omContract = await OfferManagerFactory.deploy(
        lvContract.address,
        aeContract.address,
        10000
      );
      await omContract.deployed();
      setOfferManagerAddress(omContract.address);
      console.log("OfferManager deployed at:", omContract.address);

      tx = await aeContract.setManagers(bmContract.address, omContract.address);
      await tx.wait();
      tx = await lvContract.setManager(omContract.address);
      await tx.wait();
      console.log("Managers set in AuctionEngine and LendingVault.");

      alert("All contracts deployed. Addresses saved to localStorage & server.");
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed. Check console for details.");
    }
  }

  // registerNewCollateral function
  async function registerNewCollateral() {
    const cm = getCollateralManagerContract();
    if (!cm) {
      alert("CollateralManager not found. Deploy or connect your wallet.");
      return;
    }
    try {
      const ratioBN = ethers.BigNumber.from(newCollateralRatio);
      let tx = await cm.addAcceptedCollateralToken(newCollateralAddress, 1);
      await tx.wait();
      tx = await cm.setMaintenanceRatio(newCollateralAddress, ratioBN);
      await tx.wait();

      setRegisteredCollaterals((prev) => [...prev, { address: newCollateralAddress, ratio: newCollateralRatio }]);
      setAvailableCollaterals((prev) => [...prev, { address: newCollateralAddress, ratio: newCollateralRatio }]);
      setBidCollateralSelections((prev) => [...prev, { address: newCollateralAddress, amount: "" }]);
      setLiquidationCollateralSelections((prev) => [...prev, { address: newCollateralAddress, amount: "" }]);
      setUnlockCollateralSelections((prev) => [...prev, { address: newCollateralAddress, unlock: false }]);

      alert(`Collateral ${newCollateralAddress} registered (ratio ${newCollateralRatio}).`);
    } catch (error) {
      console.error("Register collateral failed:", error);
      alert("Register collateral failed.");
    }
  }

  // placeBid function
  async function placeBid() {
    const bm = getBidManagerContract();
    if (!bm) {
      alert("BidManager not found. Deploy or connect your wallet.");
      return;
    }
    try {
      const quantityBN = ethers.BigNumber.from(bidAmount);
      let encryptedBid = "0x";
      const ae = getAuctionEngineContract();
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
      const amountsArray = usedCollaterals.map((c) => c.amount);
      for (let i = 0; i < tokensArray.length; i++) {
        await approveToken(tokensArray[i], collateralManagerAddress);
      }
      const tx = await bm.submitBid(quantityBN, encryptedBid, tokensArray, amountsArray, T1_ADDRESS);
      await tx.wait();
      alert("Bid placed successfully.");
    } catch (error) {
      console.error("Bid failed:", error);
      alert("Bid failed.");
    }
  }

  // placeOffer function
  async function placeOffer() {
    const om = getOfferManagerContract();
    const lv = getLendingVaultContract();
    if (!om || !lv) {
      alert("OfferManager or LendingVault not found. Deploy or connect your wallet.");
      return;
    }
    try {
      let encryptedOffer = "0x";
      if (offerRate) {
        const bufferValue = Buffer.from(offerRate, "utf8");
        const ae = getAuctionEngineContract();
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
      await approveToken(T1_ADDRESS, lendingVaultAddress);
      const tx = await om.submitOffer(offerAmount, encryptedOffer);
      await tx.wait();
      alert("Offer placed successfully.");
    } catch (error) {
      console.error("Offer failed:", error);
      alert("Offer failed.");
    }
  }

  // finalizeAuction function
  async function finalizeAuction() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("AuctionEngine not found.");
      return;
    }
    try {
      const tx = await ae.finalizeAuction();
      await tx.wait();
      alert("Auction finalized.");
    } catch (error) {
      console.error("Finalize auction failed:", error);
      alert("Auction finalization failed.");
    }
  }

  // finalizeDecryption function
  async function finalizeDecryption() {
    const ae = getAuctionEngineContract();
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
      if (!auctionIdNumber) {
        alert("Auction ID not available. Deploy or generate an ID first.");
        return;
      }
      const requestTx = await fairyringContract.requestGeneralDecryptionKey(auctionIdNumber);
      await requestTx.wait();
      setIsDecrypting(true);
      let decryptionKey = await fairyringContract.generalDecryptionKeys(walletAddress, auctionIdNumber);
      while (decryptionKey === "0x" || decryptionKey === "0x0") {
        console.log("Decryption key not found, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 4000));
        decryptionKey = await fairyringContract.generalDecryptionKeys(walletAddress, auctionIdNumber);
      }
      setIsDecrypting(false);
      const keyArray = hexToUint8Array(decryptionKey);
      let tx = await ae.decryptBidsBatch(3, keyArray);
      await tx.wait();
      tx = await ae.decryptOffersBatch(3, keyArray);
      await tx.wait();
      alert("Decryption finalized.");
    } catch (error) {
      console.error("Decryption failed:", error);
      setIsDecrypting(false);
      alert("Decryption finalization failed.");
    }
  }

  // repay function
  async function repay() {
    // This uses the LendingVault to repay
    const lv = getLendingVaultContract();
    if (!lv) {
      alert("LendingVault not found.");
      return;
    }
    try {
      // We still need to approve the AuctionEngine to pull T1
      await approveToken(T1_ADDRESS, auctionEngineAddress);
      const tx = await lv.repay(repayAmount);
      await tx.wait();
      alert("Repayment successful.");
    } catch (error) {
      console.error("Repayment failed:", error);
      alert("Repayment failed.");
    }
  }

  // checkOwed function
  async function checkOwed() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("AuctionEngine not found.");
      return;
    }
    try {
      const owed = await ae.repayments(walletAddress);
      setOwedAmount(owed.toString());
      alert(`You owe: ${owed.toString()}`);
    } catch (error) {
      console.error("Check owed failed:", error);
      alert("Failed to check owed amount.");
    }
  }

  // liquidate function
  async function liquidate() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("AuctionEngine not found.");
      return;
    }
    if (!liquidationBorrower) {
      alert("Enter borrower address.");
      return;
    }
    try {
      const usedCollaterals = liquidationCollateralSelections.filter((c) => c.amount && c.amount !== "0");
      if (usedCollaterals.length === 0) {
        alert("Enter coverage amounts > 0.");
        return;
      }
      const tokensArray = usedCollaterals.map((c) => c.address);
      const coverageArray = usedCollaterals.map((c) => ethers.BigNumber.from(c.amount));
      await approveToken(T1_ADDRESS, auctionEngineAddress);
      const tx = await ae.batchEarlyLiquidation(liquidationBorrower, tokensArray, coverageArray);
      await tx.wait();
      alert("Liquidation executed.");
    } catch (error) {
      console.error("Liquidation failed:", error);
      alert("Liquidation failed.");
    }
  }

  // cancelAuction function
  async function cancelAuction() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("AuctionEngine not found.");
      return;
    }
    try {
      const tx = await ae.cancelAuction(cancelReason);
      await tx.wait();
      alert("Auction canceled.");
    } catch (error) {
      console.error("Auction cancellation failed:", error);
      alert("Auction cancellation failed.");
    }
  }

  // handleUnlockCollateralToggle function
  function handleUnlockCollateralToggle(index) {
    setUnlockCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unlock: !updated[index].unlock };
      return updated;
    });
  }

  // unlockMyCollateral function
  async function unlockMyCollateral() {
    const bm = getBidManagerContract();
    if (!bm) {
      alert("BidManager not found.");
      return;
    }
    try {
      const toUnlock = unlockCollateralSelections.filter((c) => c.unlock).map((c) => c.address);
      if (toUnlock.length === 0) {
        alert("Select at least one collateral to unlock.");
        return;
      }
      const tx = await bm.unlockMyCollateral(toUnlock);
      await tx.wait();
      alert("Collateral unlocked successfully.");
    } catch (error) {
      console.error("Unlock collateral failed:", error);
      alert("Collateral unlock failed.");
    }
  }

  // unlockMyOfferFunds function
  async function unlockMyOfferFunds() {
    const om = getOfferManagerContract();
    if (!om) {
      alert("OfferManager not found.");
      return;
    }
    try {
      const tx = await om.unlockMyFunds();
      await tx.wait();
      alert("Offer funds unlocked successfully.");
    } catch (error) {
      console.error("Unlock offer funds failed:", error);
      alert("Unlock offer funds failed.");
    }
  }

  // -----------------------------------------------------------
  // Synchronize contract addresses with the local server
  // GET from server on mount
  useEffect(() => {
    fetch("http://localhost:3001/contracts")
      .then((response) => response.json())
      .then((data) => {
        // Only overwrite local state if there's meaningful data
        if (data.collateralManagerAddress) setCollateralManagerAddress(data.collateralManagerAddress);
        if (data.auctionEngineAddress) setAuctionEngineAddress(data.auctionEngineAddress);
        if (data.lendingVaultAddress) setLendingVaultAddress(data.lendingVaultAddress);
        if (data.bidManagerAddress) setBidManagerAddress(data.bidManagerAddress);
        if (data.offerManagerAddress) setOfferManagerAddress(data.offerManagerAddress);
        if (data.deployedAuctions && data.deployedAuctions.length > 0) {
          setDeployedAuctions(data.deployedAuctions);
        }
        setServerLoaded(true);
      })
      .catch((error) => console.error("Error fetching contracts from server:", error));
  }, []);

  // POST updated data to server whenever addresses or auctions change
  useEffect(() => {
    if (!serverLoaded) return; // wait until we've loaded from server once
    const contractData = {
      collateralManagerAddress,
      auctionEngineAddress,
      lendingVaultAddress,
      bidManagerAddress,
      offerManagerAddress,
      deployedAuctions
    };
    // If everything is empty, skip
    const allEmpty =
      !collateralManagerAddress &&
      !auctionEngineAddress &&
      !lendingVaultAddress &&
      !bidManagerAddress &&
      !offerManagerAddress &&
      deployedAuctions.length === 0;
    if (allEmpty) return;

    fetch("http://localhost:3001/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contractData)
    })
      .then((response) => response.json())
      .then((data) => console.log("Server updated with contract data:", data))
      .catch((error) => console.error("Error updating server:", error));
  }, [
    serverLoaded,
    collateralManagerAddress,
    auctionEngineAddress,
    lendingVaultAddress,
    bidManagerAddress,
    offerManagerAddress,
    deployedAuctions
  ]);
  // -----------------------------------------------------------

  // The context includes all these states and functions
  const contextValue = {
    signer,
    walletAddress,
    connectWallet,
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
    deployedAuctions,
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
    isDecrypting,
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
    handleUnlockCollateralToggle,
    deployContracts,
    registerNewCollateral,
    placeBid,
    placeOffer,
    finalizeAuction,
    finalizeDecryption,
    repay,
    checkOwed,
    liquidate,
    cancelAuction,
    unlockMyCollateral,
    unlockMyOfferFunds
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

function useAppContext() {
  return useContext(AppContext);
}

/* ----------------------------------
   Reusable Styles
---------------------------------- */
const buttonStyle = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "0.6rem 1.2rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  fontFamily: "EB Garabond"
};

const inputStyle = {
  width: "100%",
  marginBottom: "0.5rem",
  padding: "0.5rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "0.95rem",
  color: "#333",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  transition: "border-color 0.2s ease-in-out",
  fontFamily: "EB Garabond"
  
};

// Minimal “card” style
const cardStyle = {
  backgroundColor: "#fff",
  color: "#2f2f2f",
  padding: "1rem",
  marginTop: "1rem",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  fontFamily: "EB Garabond"
};

/* ----------------------------------
   WalletConnect component for header
---------------------------------- */
function WalletConnect() {
  const { signer, walletAddress, connectWallet } = useAppContext();
  return (
    <div style={{ marginLeft: "auto", color: "#2f2f2f", fontWeight: 500 }}>
      {signer ? (
        <span>
          Wallet:&nbsp;
          {walletAddress.substring(0, 6)}...
          {walletAddress.substring(walletAddress.length - 4)}
        </span>
      ) : (
        <button style={buttonStyle} onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

/* ----------------------------------
   Landing Page
---------------------------------- */
function LandingPage() {
  const navigate = useNavigate();

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#F5EDE0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "EB Garabond",
    textAlign: "center",
    padding: "2rem"

  };

  // We’ll wrap text in a content container
  const contentStyle = {
    maxWidth: "700px",
    margin: "1rem auto",
    textAlign: "center",
    fontFamily: "EB Garabond"
  };

  // Larger heading for "Fixed rates..."
  const mainHeadingStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1rem",
    lineHeight: 1.3,
    fontFamily: "EB Garabond"
  };

  // A style for the bullet list container
  const listStyle = {
    listStyleType: "disc",
    paddingLeft: "1.5rem",
    textAlign: "left",
    margin: "0 auto",
    maxWidth: "700px",
    fontFamily: "EB Garabond"
  };

  // Style for each bullet item
  const listItemStyle = {
    fontSize: "1.2rem",
    color: "#555",
    lineHeight: 1.6,
    marginBottom: "1rem",
    fontFamily: "EB Garabond"
  };

  const navButtonStyle = {
    backgroundColor: "#2f2f2f",
    color: "#fff",
    border: "none",
    padding: "1rem 3rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    margin: "0 1rem",
    width: "300px",        // Ensures both buttons have the same width
    textAlign: "center",
    fontFamily: "EB Garamond",   // Corrected spelling from "Garabond"
    fontSize: "1rem"     // Increase text size here
  };
  

  return (
    <div style={containerStyle}>
      {/* Logo */}
      <img
        src="/fairates-logo.png"
        alt="Fairates"
        style={{ width: "600px", marginBottom: "0rem" }}
      />
  
      <div style={contentStyle}>
        {/* Main heading */}
        <h2 style={mainHeadingStyle}>Fixed rates, not fixed games.</h2>
  
        {/* Description blocks without bullet points */}
        <div style={listStyle}>
          <div style={listItemStyle}>
            <strong>One rate:</strong> Everyone gets the same rate, discovered simply and 
            transparently through a sealed-bid auction.
          </div>
          <div style={listItemStyle}>
            <strong>Zero games:</strong> We leverage high-performance confidential 
            computing to ensure fair price discovery without relying on centralized 
            auctioneers or opaque backroom mechanisms.
          </div>
        </div>
      </div>
  
      {/* Buttons */}
      <div style={{ marginTop: "2rem" }}>
      <button onClick={() => navigate("/user")} style={navButtonStyle}>
          <strong>Bid or Supply</strong>
        </button>
        <button onClick={() => navigate("/developer")} style={navButtonStyle}>
          <strong>Deploy Auction</strong>
        </button>
       
      </div>
    </div>
  );
  
}


/* ----------------------------------
   Developer Wrapper with logo & Home Link
---------------------------------- */
function DeveloperWrapper() {
  const navStyle = {
    display: "flex",
    gap: "1rem",
    backgroundColor: "#F0E9DA",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #ddd",
    alignItems: "center",
    fontFamily: "EB Garabond"
  };
  const linkStyle = {
    color: "#2f2f2f",
    textDecoration: "none",
    fontWeight: 500,
    fontFamily: "EB Garabond"
  };
  const logoStyle = {
    height: "30px"
  };

  return (
    <div style={{ backgroundColor: "#F0E9DA", minHeight: "100vh" }}>
      <nav style={navStyle}>
        {/* Developer page uses the same logo in nav */}
        <img
          src="/fairates-logo.png"
          alt="Fairates"
          style={logoStyle}
        />
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/developer/deploy" style={linkStyle}>Deploy</Link>
        <Link to="/developer/collateral" style={linkStyle}>Collateral</Link>
        <Link to="/developer/borrower" style={linkStyle}>Borrower</Link>
        <Link to="/developer/lender" style={linkStyle}>Lender</Link>
        <Link to="/developer/auction" style={linkStyle}>Auction</Link>
        <Link to="/developer/liquidation" style={linkStyle}>Owe &amp; Liquidate</Link>
        <Link to="/developer/cancel" style={linkStyle}>Cancel &amp; Refund</Link>
        <WalletConnect />
      </nav>
      <div style={{ padding: "1rem" }}>
        <Routes>
          <Route path="deploy" element={<DeployPage />} />
          <Route path="collateral" element={<CollateralPage />} />
          <Route path="borrower" element={<BorrowerPage />} />
          <Route path="lender" element={<LenderPage />} />
          <Route path="auction" element={<AuctionPage />} />
          <Route path="liquidation" element={<OweLiquidatePage />} />
          <Route path="cancel" element={<CancelRefundPage />} />
          <Route path="*" element={<DeployPage />} />
        </Routes>
      </div>
    </div>
  );
}

/* ----------------------------------
   User Wrapper with logo
---------------------------------- */
function UserWrapper() {
  const navStyle = {
    display: "flex",
    gap: "1rem",
    backgroundColor: "#F0E9DA",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #ddd",
    alignItems: "center",
    fontFamily: "EB Garabond"
  };
  const linkStyle = {
    color: "#2f2f2f",
    textDecoration: "none",
    fontWeight: 500,
    fontFamily: "EB Garabond"
  };
  const logoStyle = {
    height: "30px"
  };

  return (
    <div style={{ backgroundColor: "#F0E9DA", minHeight: "100vh" }}>
      <nav style={navStyle}>
        {/* Same logo in user nav */}
        <img
          src="/fairates-logo.png"
          alt="Fairates"
          style={logoStyle}
        />
        <Link to="/" style={linkStyle}>Home</Link>
        <WalletConnect />
      </nav>
      <div style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="auction/:auctionAddress" element={<UserAuctionPage />} />
          <Route path="*" element={<UserDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

/* ----------------------------------
   User Dashboard
---------------------------------- */
function UserDashboard() {
  const { deployedAuctions } = useAppContext();
  const navigate = useNavigate();

  console.log("UserDashboard sees deployedAuctions:", deployedAuctions);

  return (
    <div style={cardStyle}>
      <h2>Available Auctions</h2>
      {deployedAuctions.length === 0 ? (
        <p>No auctions deployed yet.</p>
      ) : (
        <ul style={{ marginTop: "1rem", lineHeight: "1.6" }}>
          {deployedAuctions.map((addr, idx) => (
            <li key={idx} style={{ margin: "0.5rem 0" }}>
              Auction at <strong>{addr}</strong>
              <button
                onClick={() => navigate(`/user/auction/${addr}`)}
                style={{ ...buttonStyle, marginLeft: "1rem", fontSize: "0.9rem" }}
              >
                View &amp; Participate
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------
   User Auction Page
---------------------------------- */
function UserAuctionPage() {
  const { auctionAddress } = useParams();
  const { signer } = useAppContext();
  const [bidAmount, setBidAmount] = useState("");
  const [bidRate, setBidRate] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerRate, setOfferRate] = useState("");
  // Minimal collateral logic for user mode (just one entry)
  const [bidCollateralSelections, setBidCollateralSelections] = useState([
    { address: DEFAULT_COLLATERAL, amount: "" }
  ]);

  const auctionContract = signer
    ? new ethers.Contract(auctionAddress, AuctionEngineArtifact.abi, signer)
    : null;

  async function handlePlaceBid() {
    if (!auctionContract) {
      alert("Auction contract not available (missing signer?).");
      return;
    }
    try {
      const quantityBN = ethers.BigNumber.from(bidAmount);
      let encryptedBid = "0x";

      // Timelock encrypt for rate
      const fairyringContract = new ethers.Contract(
        FAIRYRING_CONTRACT_ADDRESS,
        FairyringArtifact.abi,
        signer
      );
      const ID = await auctionContract.auctionID();
      const PK = await fairyringContract.latestEncryptionKey();
      const PK_Val = PK.startsWith("0x") ? PK.slice(2) : PK;
      if (bidRate) {
        const bufferValue = Buffer.from(bidRate, "utf8");
        encryptedBid = await timelockEncrypt(ID, PK_Val, bufferValue);
        encryptedBid = "0x" + encryptedBid;
      }

      // For user simplicity, just do one collateral
      const collAmount = bidCollateralSelections[0].amount || "1";
      const tx = await auctionContract.submitBid(
        quantityBN,
        encryptedBid,
        [DEFAULT_COLLATERAL],
        [collAmount],
        T1_ADDRESS
      );
      await tx.wait();
      alert("Bid placed successfully (user mode).");
    } catch (error) {
      console.error("Place bid error:", error);
      alert("Bid failed (user mode).");
    }
  }

  async function handlePlaceOffer() {
    if (!auctionContract) {
      alert("Auction contract not available (missing signer?).");
      return;
    }
    try {
      let encryptedOffer = "0x";
      if (offerRate) {
        const bufferValue = Buffer.from(offerRate, "utf8");
        const ID = await auctionContract.auctionID();
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

      const tx = await auctionContract.submitOffer(offerAmount, encryptedOffer);
      await tx.wait();
      alert("Offer placed successfully (user mode).");
    } catch (error) {
      console.error("Place offer error:", error);
      alert("Offer failed (user mode).");
    }
  }

  return (
    <div style={cardStyle}>
      <h2>Still in development... (Kindly use the developer page for deploying auctions and placing bids and offers)</h2>
      <h2>Auction: {auctionAddress}</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Place a Bid</h3>
        <label>Bid Amount:</label>
        <input
          type="text"
          placeholder="Enter bid amount"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          style={inputStyle}
        />
        <label>Bid Rate:</label>
        <input
          type="text"
          placeholder="Enter bid rate"
          value={bidRate}
          onChange={(e) => setBidRate(e.target.value)}
          style={inputStyle}
        />
        <button style={buttonStyle} onClick={handlePlaceBid}>
          Place Bid
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Place an Offer</h3>
        <label>Offer Amount:</label>
        <input
          type="text"
          placeholder="Enter offer amount"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          style={inputStyle}
        />
        <label>Offer Rate:</label>
        <input
          type="text"
          placeholder="Enter offer rate"
          value={offerRate}
          onChange={(e) => setOfferRate(e.target.value)}
          style={inputStyle}
        />
        <button style={buttonStyle} onClick={handlePlaceOffer}>
          Place Offer
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------
   Developer Pages
---------------------------------- */
function DeployPage() {
  const { deployContracts } = useAppContext();
  return (
    <div style={cardStyle}>
      <h2>Deploy Contracts</h2>
      <p>Deploy all contracts.</p>
      <button style={buttonStyle} onClick={deployContracts}>
        Deploy All
      </button>
    </div>
  );
}

function CollateralPage() {
  const {
    newCollateralAddress,
    setNewCollateralAddress,
    newCollateralRatio,
    setNewCollateralRatio,
    registerNewCollateral,
    registeredCollaterals
  } = useAppContext();
  return (
    <div style={cardStyle}>
      <h2>Collateral Management</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Register Additional Collateral</h3>
        <label>Token:</label>
        <input
          type="text"
          placeholder="0x..."
          style={inputStyle}
          value={newCollateralAddress}
          onChange={(e) => setNewCollateralAddress(e.target.value)}
        />
        <label>Maintenance Ratio:</label>
        <input
          type="text"
          placeholder="1"
          style={inputStyle}
          value={newCollateralRatio}
          onChange={(e) => setNewCollateralRatio(e.target.value)}
        />
        <button style={buttonStyle} onClick={registerNewCollateral}>
          Register
        </button>
        {registeredCollaterals.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Registered Collaterals:</strong>
            <ul style={{ lineHeight: "1.6" }}>
              {registeredCollaterals.map((rc, idx) => (
                <li key={idx}>
                  {rc.address} (ratio {rc.ratio})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function BorrowerPage() {
  const {
    bidAmount,
    setBidAmount,
    bidRate,
    setBidRate,
    bidCollateralSelections,
    setBidCollateralSelections,
    placeBid,
    repayAmount,
    setRepayAmount,
    repay
  } = useAppContext();

  const handleBidCollateralAmountChange = (index, newVal) => {
    setBidCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index].amount = newVal;
      return updated;
    });
  };

  return (
    <div style={cardStyle}>
      <h2>Borrower Tools</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Place a Bid</h3>
        <label>Bid Amount (Loan Requested):</label>
        <input
          type="text"
          placeholder="1000"
          style={inputStyle}
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
        />
        <label>Bid Rate:</label>
        <input
          type="text"
          placeholder="7"
          style={inputStyle}
          value={bidRate}
          onChange={(e) => setBidRate(e.target.value)}
        />
        <p style={{ margin: "0.5rem 0" }}>Collateral for Bid:</p>
        <table style={{ width: "100%", border: "1px solid #ddd", marginBottom: "0.5rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <th style={{ padding: "0.5rem" }}>Token</th>
              <th style={{ padding: "0.5rem" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bidCollateralSelections.map((coll, idx) => (
              <tr key={idx}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  {coll.address}
                </td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  <input
                    type="text"
                    placeholder="0"
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={coll.amount}
                    onChange={(e) => handleBidCollateralAmountChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={buttonStyle} onClick={placeBid}>
          Place Bid
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Repay Loan</h3>
        <label>Repay Amount:</label>
        <input
          type="text"
          placeholder="1000"
          style={inputStyle}
          value={repayAmount}
          onChange={(e) => setRepayAmount(e.target.value)}
        />
        <button style={buttonStyle} onClick={repay}>
          Repay
        </button>
      </div>
    </div>
  );
}

function LenderPage() {
  const {
    offerAmount,
    setOfferAmount,
    offerRate,
    setOfferRate,
    placeOffer
  } = useAppContext();
  return (
    <div style={cardStyle}>
      <h2>Lender Tools</h2>
      <h3>Place an Offer</h3>
      <label>Offer Quantity:</label>
      <input
        type="text"
        placeholder="1500"
        style={inputStyle}
        value={offerAmount}
        onChange={(e) => setOfferAmount(e.target.value)}
      />
      <label>Offer Rate:</label>
      <input
        type="text"
        placeholder="3"
        style={inputStyle}
        value={offerRate}
        onChange={(e) => setOfferRate(e.target.value)}
      />
      <button style={buttonStyle} onClick={placeOffer}>
        Place Offer
      </button>
    </div>
  );
}

function AuctionPage() {
  const { finalizeAuction, finalizeDecryption, auctionEngineAddress, signer, isDecrypting } =
    useAppContext();
  const [clearingRate, setClearingRate] = useState("");

  async function checkClearingRate() {
    if (!signer || !auctionEngineAddress) {
      alert("AuctionEngine not set or wallet not connected.");
      return;
    }
    try {
      const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
      const rate = await ae.auctionClearingRate();
      setClearingRate(rate.toString());
      alert(`Clearing Rate: ${rate.toString()}`);
    } catch (error) {
      console.error("Clearing rate error:", error);
      alert("Failed to fetch clearing rate.");
    }
  }

  return (
    <div style={cardStyle}>
      <h2>Auction Controls</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Finalize Auction</h3>
        <button style={buttonStyle} onClick={finalizeAuction}>
          Finalize Auction
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Decrypt Bids &amp; Offers</h3>
        <button style={buttonStyle} onClick={finalizeDecryption}>
          Finalize Decryption
        </button>
        {isDecrypting && <p>Decryption in progress, please wait...</p>}
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Check Clearing Rate</h3>
        <button style={buttonStyle} onClick={checkClearingRate}>
          Get Clearing Rate
        </button>
        {clearingRate && (
          <p style={{ marginTop: "0.5rem" }}>
            Current Clearing Rate: <strong>{clearingRate}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

function OweLiquidatePage() {
  const {
    owedAmount,
    checkOwed,
    liquidationBorrower,
    setLiquidationBorrower,
    liquidationCollateralSelections,
    setLiquidationCollateralSelections,
    liquidate
  } = useAppContext();

  const handleLiquidationCollateralAmountChange = (index, newVal) => {
    setLiquidationCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index].amount = newVal;
      return updated;
    });
  };

  return (
    <div style={cardStyle}>
      <h2>Check Owed &amp; Liquidate</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Check How Much You Owe</h3>
        <button style={buttonStyle} onClick={checkOwed}>
          Check Owed
        </button>
        {owedAmount && (
          <p style={{ marginTop: "0.5rem" }}>
            You owe: <strong>{owedAmount}</strong>
          </p>
        )}
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Liquidate Borrower</h3>
        <label>Borrower Address:</label>
        <input
          type="text"
          placeholder="0x..."
          style={inputStyle}
          value={liquidationBorrower}
          onChange={(e) => setLiquidationBorrower(e.target.value)}
        />
        <p style={{ margin: "0.5rem 0" }}>Coverage amounts for each collateral:</p>
        <table style={{ width: "100%", border: "1px solid #ddd", marginBottom: "0.5rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <th style={{ padding: "0.5rem" }}>Collateral Token</th>
              <th style={{ padding: "0.5rem" }}>Coverage Amount</th>
            </tr>
          </thead>
          <tbody>
            {liquidationCollateralSelections.map((coll, idx) => (
              <tr key={idx}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{coll.address}</td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  <input
                    type="text"
                    placeholder="0"
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={coll.amount}
                    onChange={(e) => handleLiquidationCollateralAmountChange(idx, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={buttonStyle} onClick={liquidate}>
          Liquidate
        </button>
      </div>
    </div>
  );
}

function CancelRefundPage() {
  const {
    cancelReason,
    setCancelReason,
    cancelAuction,
    unlockCollateralSelections,
    handleUnlockCollateralToggle,
    unlockMyCollateral,
    unlockMyOfferFunds
  } = useAppContext();

  return (
    <div style={cardStyle}>
      <h2>Cancel Auction &amp; Refunds</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3>Cancel Auction</h3>
        <label>Reason:</label>
        <input
          type="text"
          style={inputStyle}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <button style={buttonStyle} onClick={cancelAuction}>
          Cancel Auction
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Unlock My Collateral</h3>
        <p>Select which collaterals to unlock:</p>
        <table style={{ width: "100%", border: "1px solid #ddd", marginBottom: "0.5rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <th style={{ padding: "0.5rem" }}>Token</th>
              <th style={{ padding: "0.5rem" }}>Unlock?</th>
            </tr>
          </thead>
          <tbody>
            {unlockCollateralSelections.map((coll, idx) => (
              <tr key={idx}>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{coll.address}</td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                  <input
                    type="checkbox"
                    checked={coll.unlock}
                    onChange={() => handleUnlockCollateralToggle(idx)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button style={buttonStyle} onClick={unlockMyCollateral}>
          Unlock Collateral
        </button>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Unlock My Offer Funds</h3>
        <button style={buttonStyle} onClick={unlockMyOfferFunds}>
          Unlock Offer Funds
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------
   Main App Component
---------------------------------- */
function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/developer/*" element={<DeveloperWrapper />} />
          <Route path="/user/*" element={<UserWrapper />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
