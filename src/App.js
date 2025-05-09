import ReactDOM from "react-dom";
import { useLocation } from "react-router-dom";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { timelockEncrypt } from "ts-ibe";

import CollateralManagerArtifact from "./CollateralManager.json";
import AuctionTokenArtifact from "./AuctionToken.json";
import AuctionEngineArtifact from "./AuctionEngine.json";
import LendingVaultArtifact from "./LendingVault.json";
import BidManagerArtifact from "./BidManager.json";
import OfferManagerArtifact from "./OfferManager.json";
import FairyringArtifact from "./FairyringContract.json";
import {
  FAIRYRING_CONTRACT_ADDRESS,
  ERC20ABI,
  T1_ADDRESS,
  DEFAULT_COLLATERAL,
  T2_ADDRESS,
  T3_ADDRESS,
  T1_FAUCET,
  T2_FAUCET,
  T3_FAUCET,
  ARBITRUM_SEPOLIA,
  COLORS,
  FONT_FAMILY,
  globalBgCss,

  mobileCss,
  responsiveCss,
  topBarStyle,
  navLink,
  logoStyle,

  heroHeading,
  heroSub,



  walletBtnBase,

} from "./styles.js";
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

function AppProvider({ children }) {
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
  const [deployedAuctions, setDeployedAuctions] = useState(() => {
    const saved = localStorage.getItem("deployedAuctions");
    return saved ? JSON.parse(saved) : [];
  });
  const [myAuctions, setMyAuctions] = useState([]);


  const [collateralManagerAddress, setCollateralManagerAddress] = useState(
    () => localStorage.getItem("collateralManagerAddress") || ""
  );
  const [auctionEngineAddress, setAuctionEngineAddress] = useState(
    () => localStorage.getItem("auctionEngineAddress") || ""
  );
  const [lendingVaultAddress, setLendingVaultAddress] = useState(
    () => localStorage.getItem("lendingVaultAddress") || ""
  );
  const [bidManagerAddress, setBidManagerAddress] = useState(
    () => localStorage.getItem("bidManagerAddress") || ""
  );
  const [offerManagerAddress, setOfferManagerAddress] = useState(
    () => localStorage.getItem("offerManagerAddress") || ""
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
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [auctionIdNumber, setAuctionIdNumber] = useState(null);


  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [extraCollateralSelections, setExtraCollateralSelections] = useState([]);
  const [removeCollateralSelections, setRemoveCollateralSelections] = useState([]);

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

  useEffect(() => {
    if (!walletAddress) {
      setMyAuctions([]);
      return;
    }
    const key = `myAuctions_${walletAddress.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setMyAuctions(JSON.parse(stored));
    } else {
      setMyAuctions([]);
    }
  }, [walletAddress]);

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
    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet: " + error.message);
    }
  }


  function disconnectWallet() {
    setSigner(null);
    setWalletAddress("");
    setAvailableAccounts([]);
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
  }

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
    const ID = await fairyringContract.fids(userAddr, auctionIdNum);
    console.log("Generated ID:", ID);
    return ID;
  }

  function selectAuction(auctionObj) {
    setCurrentAuction(auctionObj);
    setCollateralManagerAddress(auctionObj.collateralManagerAddress);
    setAuctionEngineAddress(auctionObj.auctionEngineAddress);
    setLendingVaultAddress(auctionObj.lendingVaultAddress);
    setBidManagerAddress(auctionObj.bidManagerAddress);
    setOfferManagerAddress(auctionObj.offerManagerAddress);
  }

  async function deployContracts() {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const priceOracle = "0x2fE2885Ee7c2e43B3219cD63629dbE736bDF8206";
      const CollateralManagerFactory = new ethers.ContractFactory(
        CollateralManagerArtifact.abi,
        CollateralManagerArtifact.bytecode,
        signer
      );
      const cmContract = await CollateralManagerFactory.deploy(priceOracle);
      await cmContract.deployed();
      setCollateralManagerAddress(cmContract.address);

      let tx = await cmContract.addAcceptedCollateralToken(DEFAULT_COLLATERAL, 1);
      await tx.wait();
      tx = await cmContract.setMaintenanceRatio(DEFAULT_COLLATERAL, 1);
      await tx.wait();

      const userAddr = await signer.getAddress();
      const ID = await generateAuctionID(signer, userAddr);

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
      const aeContract = await AuctionEngineFactory.deploy(
        DECRYPTER,
        BID_DURATION,
        REVEAL_DURATION,
        LOAN_DURATION,
        ID,
        T1_ADDRESS,
        FEE,
        FEE,
        FEE,
        auctionTokenAddress,
        AUCTION_TOKEN_AMOUNT
      );
      await aeContract.deployed();
      setAuctionEngineAddress(aeContract.address);

      tx = await atContract.setAuctionContract(aeContract.address);
      await tx.wait();

      const LendingVaultFactory = new ethers.ContractFactory(
        LendingVaultArtifact.abi,
        LendingVaultArtifact.bytecode,
        signer
      );
      const lvContract = await LendingVaultFactory.deploy(T1_ADDRESS);
      await lvContract.deployed();
      setLendingVaultAddress(lvContract.address);

      const BidManagerFactory = new ethers.ContractFactory(
        BidManagerArtifact.abi,
        BidManagerArtifact.bytecode,
        signer
      );
      const maxBid = ethers.utils.parseUnits("15000", 18);
      const minBid = ethers.utils.parseUnits("10", 18);
      const bmContract = await BidManagerFactory.deploy(
        cmContract.address,
        aeContract.address,
        maxBid,
        T1_ADDRESS,
        minBid,
        50
      );
      await bmContract.deployed();
      setBidManagerAddress(bmContract.address);

      tx = await cmContract.setManager(bmContract.address);
      await tx.wait();

      const OfferManagerFactory = new ethers.ContractFactory(
        OfferManagerArtifact.abi,
        OfferManagerArtifact.bytecode,
        signer
      );
      const maxOffer = ethers.utils.parseUnits("10000", 18);
      const minOffer = ethers.utils.parseUnits("10", 18);
      const omContract = await OfferManagerFactory.deploy(
        lvContract.address,
        aeContract.address,
        maxOffer,
        minOffer,
        50
      );
      await omContract.deployed();
      setOfferManagerAddress(omContract.address);

      tx = await aeContract.setManagers(bmContract.address, omContract.address);
      await tx.wait();
      tx = await lvContract.setManager(omContract.address);
      await tx.wait();

      const auctionContracts = {
        collateralManagerAddress: cmContract.address,
        auctionTokenAddress: auctionTokenAddress,
        auctionEngineAddress: aeContract.address,
        lendingVaultAddress: lvContract.address,
        bidManagerAddress: bmContract.address,
        offerManagerAddress: omContract.address
      };

      setDeployedAuctions((prev) => [...prev, auctionContracts]);

      if (userAddr) {
        const key = `myAuctions_${userAddr.toLowerCase()}`;
        const stored = localStorage.getItem(key);
        let arr = stored ? JSON.parse(stored) : [];
        arr.push(auctionContracts);
        localStorage.setItem(key, JSON.stringify(arr));
        setMyAuctions(arr);
      }

      selectAuction(auctionContracts);

      alert("All contracts deployed successfully. Auction address: " + auctionContracts.auctionEngineAddress);
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed: " + error.message + ". Check console for details.");
    }
  }

  async function deployContractsCustom() {
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
      const maxBid = Number(customMaxBid);
      const maxOffer = Number(customMaxOffer);
      const minBid = Number(customMinBid);
      const minOffer = Number(customMinOffer);
      const maxNumBids = Number(customMaxNumBids);
      const maxNumOffers = Number(customMaxNumOffers);

      const CollateralManagerFactory = new ethers.ContractFactory(
        CollateralManagerArtifact.abi,
        CollateralManagerArtifact.bytecode,
        signer
      );
      const cmContract = await CollateralManagerFactory.deploy(priceOracle);
      await cmContract.deployed();
      setCollateralManagerAddress(cmContract.address);

      let tx = await cmContract.addAcceptedCollateralToken(customCollateralToken, Number(customCollateralRatio));
      await tx.wait();
      tx = await cmContract.setMaintenanceRatio(customCollateralToken, Number(customCollateralRatio));
      await tx.wait();

      const userAddr = await signer.getAddress();
      const ID = await generateAuctionID(signer, userAddr);

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
        purchaseToken,
        FEE,
        LIQUIDATION_FEE,
        PROTOCOL_LIQUIDATION_FEE,
        auctionTokenAddress,
        AUCTION_TOKEN_AMOUNT
      );
      await aeContract.deployed();
      setAuctionEngineAddress(aeContract.address);

      tx = await atContract.setAuctionContract(aeContract.address);
      await tx.wait();

      const LendingVaultFactory = new ethers.ContractFactory(
        LendingVaultArtifact.abi,
        LendingVaultArtifact.bytecode,
        signer
      );
      const lvContract = await LendingVaultFactory.deploy(purchaseToken);
      await lvContract.deployed();
      setLendingVaultAddress(lvContract.address);

      const BidManagerFactory = new ethers.ContractFactory(
        BidManagerArtifact.abi,
        BidManagerArtifact.bytecode,
        signer
      );

      const bmContract = await BidManagerFactory.deploy(
        cmContract.address,
        aeContract.address,
        maxBid,
        purchaseToken,
        minBid,
        maxNumBids
      );
      await bmContract.deployed();
      setBidManagerAddress(bmContract.address);

      tx = await cmContract.setManager(bmContract.address);
      await tx.wait();

      const OfferManagerFactory = new ethers.ContractFactory(
        OfferManagerArtifact.abi,
        OfferManagerArtifact.bytecode,
        signer
      );
      const omContract = await OfferManagerFactory.deploy(
        lvContract.address,
        aeContract.address,
        maxOffer,
        minOffer,
        maxNumOffers
      );
      await omContract.deployed();
      setOfferManagerAddress(omContract.address);

      tx = await aeContract.setManagers(bmContract.address, omContract.address);
      await tx.wait();
      tx = await lvContract.setManager(omContract.address);
      await tx.wait();

      const auctionContracts = {
        collateralManagerAddress: cmContract.address,
        auctionTokenAddress: auctionTokenAddress,
        auctionEngineAddress: aeContract.address,
        lendingVaultAddress: lvContract.address,
        bidManagerAddress: bmContract.address,
        offerManagerAddress: omContract.address
      };

      setDeployedAuctions((prev) => [...prev, auctionContracts]);

      if (userAddr) {
        const key = `myAuctions_${userAddr.toLowerCase()}`;
        const stored = localStorage.getItem(key);
        let arr = stored ? JSON.parse(stored) : [];
        arr.push(auctionContracts);
        localStorage.setItem(key, JSON.stringify(arr));
        setMyAuctions(arr);
      }

      selectAuction(auctionContracts);

      setCustomPriceOracle("");
      setCustomBidDuration("");
      setCustomRevealDuration("");
      setCustomRepaymentDuration("");
      setCustomFee("");
      setCustomLiquidationFee("");
      setCustomProtocolLiquidationFee("");
      setCustomMaxNumBids("");
      setCustomMaxNumOffers("");
      setCustomMinBid("");
      setCustomMinOffer("");
      setCustomAuctionTokenAmount("");
      setCustomPurchaseToken("");
      setCustomMaxBid("");
      setCustomMaxOffer("");
      setCustomCollateralToken("");
      setCustomCollateralRatio("");

      alert("All contracts deployed successfully with custom parameters.");
    } catch (error) {
      console.error("Custom deployment failed:", error);
      alert("Custom deployment failed: " + error.message);
    }
  }

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

  async function placeBid() {
    const bm = getBidManagerContract();
    console.log("BidManager address:", bidManagerAddress);
    if (!bm) {
      alert("BidManager not found. Deploy or connect your wallet.");
      return;
    }
    const am = getAuctionEngineContract();
    if (!am) {
      alert("AuctionManager not found. Deploy or connect your wallet.");
      return;
    }
    try {
      const purchaseToken = await am.repaymentToken();
      const tokenDecimals = await getTokenDecimals(purchaseToken); 
      const quantityBN = ethers.utils.parseUnits(bidAmount, tokenDecimals);
     
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
      const amountsArray = [];
      
      for (let i = 0; i < usedCollaterals.length; i++) {
        const tokenAddress = tokensArray[i];
        const collateralAmount = usedCollaterals[i].amount;
      
        const tokenDecimals = await getTokenDecimals(tokenAddress);
        
        const amountInSmallestUnit = ethers.utils.parseUnits(collateralAmount, tokenDecimals);
      
        amountsArray.push(amountInSmallestUnit);
      }
      
      for (let i = 0; i < tokensArray.length; i++) {
        await approveToken(tokensArray[i], collateralManagerAddress);
      }
      console.log("amountsArray:", amountsArray);
      const tx = await bm.submitBid(quantityBN, encryptedBid, tokensArray, amountsArray, purchaseToken);
      await tx.wait();
      alert("Bid placed successfully.");
      setBidAmount("");
      setBidRate("");
      setBidCollateralSelections(bidCollateralSelections.map(c => ({ address: c.address, amount: "" })));
    } catch (error) {
      console.error("Bid failed:", error);
      alert("Bid failed: " + error.message);
    }
  }
  async function externalLockCollateral(tokens, amounts) {
    const bm = getBidManagerContract();
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
        await approveToken(token, collateralManagerAddress);
      }
  
      const tx = await bm.externalLockCollateral(tokens, amountsInSmallestUnit);
      await tx.wait();
      alert("Extra collateral locked successfully.");
      setExtraCollateralSelections(
        extraCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
      );
    } catch (err) {
      console.error("Lock collateral failed:", err);
      alert("Lock collateral failed: " + err.message);
    }
  }
  
  async function externalUnlockCollateral(tokens, amounts) {
    const bm = getBidManagerContract();
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
  
      const tx = await bm.externalUnlockCollateral(tokens, amountsInSmallestUnit);
      await tx.wait();
      alert("Excessive collateral unlocked successfully.");
      setRemoveCollateralSelections(
        removeCollateralSelections.map((c) => ({ address: c.address, amount: "" }))
      );
    } catch (err) {
      console.error("Unlock collateral failed:", err);
      alert("Unlock collateral failed: " + err.message);
    }
  }
  
  async function removeBid() {
    const bm = getBidManagerContract();
    if (!bm) {
      alert("BidManager not found. Deploy or connect your wallet.");
      return;
    }
    try {
      const tx = await bm.removeBid();
      await tx.wait();
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

  async function removeOffer() {
    const om = getOfferManagerContract();
    if (!om) {
      alert("OfferManager not found. Deploy or connect your wallet.");
      return;
    }
    try {
      const tx = await om.removeOffer();
      await tx.wait();
      alert("Your offer was removed and funds unlocked.");
      setOfferAmount("");
      setOfferRate("");
    } catch (err) {
      console.error("Remove offer failed:", err);
      alert("Remove offer failed: " + err.message);
    }
  }

  async function placeOffer() {
    const om = getOfferManagerContract();
    const lv = getLendingVaultContract();
    const am = getAuctionEngineContract();
    if (!om || !lv || !am) {
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
      const purchaseToken = await am.repaymentToken();
      const tokenDecimals = await getTokenDecimals(purchaseToken); 
      const quantity = ethers.utils.parseUnits(offerAmount, tokenDecimals);
      await approveToken(purchaseToken, lendingVaultAddress);
      const tx = await om.submitOffer(quantity, encryptedOffer);
      await tx.wait();
      alert("Offer placed successfully.");
      setOfferAmount("");
      setOfferRate("");
    } catch (error) {
      console.error("Offer failed:", error);
      alert("Offer failed: " + error.message);
    }
  }

  async function finalizeAuction() {
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
      alert("Decryption finalization failed: " + error.message);
      return;
    }

    try {
      const tx = await ae.finalizeAuction();
      await tx.wait();
      alert("Auction finalized.");
    } catch (error) {
      console.error("Finalize auction failed:", error);
      alert("Auction finalization failed: " + error.message);
    }
  }

  async function repay() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("LendingVault not found.");
      return;
    }
    const am = getAuctionEngineContract();
    if (!am) {
      alert("AuctionManager not found.");
      return;
    }
    try {
      const purchaseToken = await am.repaymentToken();
      const tokenDecimals = await getTokenDecimals(purchaseToken); 
      const amountBN = ethers.utils.parseUnits(repayAmount, tokenDecimals);
      await approveToken(purchaseToken, auctionEngineAddress);
      const tx = await ae.repay(amountBN);
      await tx.wait();
      alert("Repayment successful.");
      setRepayAmount("");
    } catch (error) {
      console.error("Repayment failed:", error);
      alert("Repayment failed: " + error.message);
    }
  }

  async function checkOwed() {
    const ae = getAuctionEngineContract();
    if (!ae) {
      alert("AuctionEngine not found.");
      return;
    }
    const am = getAuctionEngineContract();
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
        tx = await ae.batchEarlyLiquidation(liquidationBorrower, tokensArray, coverageArray);
      } else {
        tx = await ae.batchLateLiquidation(liquidationBorrower, tokensArray, coverageArray);
      }
      await tx.wait();
      alert("Liquidation executed.");
      setLiquidationBorrower("");
      setLiquidationCollateralSelections(liquidationCollateralSelections.map(c => ({ address: c.address, amount: "" })));
    } catch (error) {
      console.error("Liquidation failed:", error);
      alert("Liquidation failed: " + error.message);
    }
  }
  

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
      setCancelReason("");
    } catch (error) {
      console.error("Auction cancellation failed:", error);
      alert("Auction cancellation failed: " + error.message);
    }
  }

  function handleUnlockCollateralToggle(index) {
    setUnlockCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unlock: !updated[index].unlock };
      return updated;
    });
  }



  async function redeemToken() {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    const atContract = getAuctionTokenContract();
    if (!atContract) {
      alert("Auction token contract not found.");
      return;
    }
    const am = getAuctionEngineContract();
    if (!am) {
      alert("AuctionManager not found.");
      return;
    }
    try {
      const purchaseToken = await am.repaymentToken();
      const tokenDecimals = await getTokenDecimals(purchaseToken);
      const amount = ethers.utils.parseUnits(redemptionAmount, tokenDecimals);
      const tx = await atContract.redeemToken(amount);
      await tx.wait();
      alert("Token redemption successful.");
      setRedemptionAmount("");
    } catch (error) {
      console.error("Token redemption failed:", error);
      alert("Token redemption failed: " + error.message);
    }
  }

  useEffect(() => {
    fetch("https://auction-db.fairblock.network/contracts")
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

  useEffect(() => {
    if (!serverLoaded) return;
    const contractData = {
      auctions: deployedAuctions
    };
    const allEmpty = deployedAuctions.length === 0;
    if (allEmpty) return;

    fetch("https://auction-db.fairblock.network/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contractData)
    })
      .then((response) => response.json())
      .then((data) => console.log("Server updated with contract data:", data))
      .catch((error) => console.error("Error updating server:", error));
  }, [serverLoaded, deployedAuctions]);

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
    deployContractsCustom,
    registerNewCollateral,
    placeBid,
    placeOffer,
    finalizeAuction,
    repay,
    checkOwed,
    liquidate,
    cancelAuction,
  

    redemptionAmount,
    setRedemptionAmount,
    redeemToken,
    extraCollateralSelections,
    setExtraCollateralSelections,
    removeCollateralSelections,
    setRemoveCollateralSelections,

    externalLockCollateral,
    externalUnlockCollateral,

    removeBid,
    removeOffer,
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
    setCustomCollateralRatio
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

function useAppContext() {
  return useContext(AppContext);
}

function TokenDisplay({ address }) {
  const { signer } = useAppContext();
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    async function fetchSymbol() {
      try {
        const provider = signer ? signer.provider : ethers.getDefaultProvider();
        const tokenContract = new ethers.Contract(address, ["function symbol() view returns (string)"], provider);
        const tokenSymbol = await tokenContract.symbol();
        setSymbol(tokenSymbol);
      } catch (e) {
        console.error("Error fetching symbol for", address, e);
        setSymbol("");
      }
    }
    if (address) {
      fetchSymbol();
    }
  }, [address, signer]);

  return (
    <>
      {address} {symbol ? `(${symbol})` : ""}
    </>
  );
}

function FaucetPage() {
  const { signer } = useAppContext();

  const handleWithdraw = async (tokenName, faucetAddress) => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const FaucetABI = ["function withdraw() public"];
      const faucetContract = new ethers.Contract(faucetAddress, FaucetABI, signer);
      const tx = await faucetContract.withdraw();
      await tx.wait();
      alert(`${tokenName} withdrawal successful.`);
    } catch (error) {
      console.error(error);
      alert(`${tokenName} withdrawal failed: ${error.message}`);
    }
  };

  const card = {
    maxWidth: 620,
    margin: "0 auto",
    padding: 32,
    borderRadius: 20,
    border: "1px solid rgba(155,61,255,.45)",
    background:
      "linear-gradient(135deg, rgba(155,61,255,.15) 0%, rgba(155,61,255,.05) 100%)",
    backdropFilter: "blur(4px)",
    color: "#fff",
    fontFamily: FONT_FAMILY,
  };

  const heading = { fontSize: 28, fontWeight: 400, marginBottom: 32 };
  const sub = { fontSize: 17, marginBottom: 14, lineHeight: 1.45 };

  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontWeight: 400,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 12,
    width: "100%",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <div className="purple-card" style={card}>
        <h2 style={heading}>Faucet</h2>

        { }
        <div style={{ marginBottom: 28 }}>
          <p style={sub}>
            <strong>T1 token</strong>
            <br />
            Address:&nbsp;<span className="wrap-addr">
              <TokenDisplay address={T1_ADDRESS} />
            </span>
          </p>
          <button className="btn-primary" style={btn} onClick={() => handleWithdraw("T1", T1_FAUCET)}>
            Request&nbsp;T1
          </button>
        </div>

        { }
        <div style={{ marginBottom: 28 }}>
          <p style={sub}>
            <strong>T2 token</strong>
            <br />
            Address:&nbsp;<span className="wrap-addr">
              <TokenDisplay address={T2_ADDRESS} />
            </span>
          </p>
          <button className="btn-primary" style={btn} onClick={() => handleWithdraw("T2", T2_FAUCET)}>
            Request&nbsp;T2
          </button>
        </div>

        { }
        <div>
          <p style={sub}>
            <strong>T3 token</strong>
            <br />
            Address:&nbsp;<span className="wrap-addr">
              <TokenDisplay address={T3_ADDRESS} />
            </span>
          </p>
          <button className="btn-primary" style={btn} onClick={() => handleWithdraw("T3", T3_FAUCET)}>
            Request&nbsp;T3
          </button>
        </div>
      </div>
    </div>
  );
}



function WalletConnect() {
  const {
    signer,
    walletAddress,
    connectWallet,
    disconnectWallet,
    availableAccounts,
    switchAccount,
  } = useAppContext();

  const [open, setOpen] = React.useState(false);

  const pill = walletBtnBase;

  const selectDark = {
    ...pill,
    width: 260,
    background: "rgba(255,255,255,0.05)",
    color: COLORS.textPrimary,
    appearance: "none",
    paddingRight: 42,
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9IiNmZmYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkgMC41TDUuMDAyIDQuNjY3TDEgMC41IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "calc(100% - 16px) center",
  };
  const optionDark = { background: "#121212", color: "#fff" };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.60)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
  const card = {
    width: 420,
    padding: "48px 56px 56px",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  };
  const fox = { width: 140, marginBottom: 32 };
  const connectBtn = {
    background: COLORS.accent,
    border: "none",
    width: "100%",
    padding: "20px 0",
    borderRadius: 12,
    color: "#fff",
    fontSize: 20,
    fontWeight: 400,
    cursor: "pointer",
    marginTop: 40,
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const modal = (
    <div style={overlay} onClick={() => setOpen(false)}>
      <div className="purple-card" style={card} onClick={(e) => e.stopPropagation()}>
        <img src={`${process.env.PUBLIC_URL}/metamask.svg`} alt="MetaMask" style={fox} />
        <p style={{ color: "#000", fontSize: 22, fontWeight: 600 }}>
          To get started, connect your<br />MetaMask wallet.
        </p>
        <button
          className="wallet-pill"
          style={connectBtn}
          onClick={async () => {
            await connectWallet();
            setOpen(false);
          }}
        >
          Connect
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
        {signer ? (
          <>
            <select
              value={walletAddress}
              style={selectDark}
              onChange={(e) => switchAccount(e.target.value)}
            >
              {availableAccounts.map((acc) => (
                <option key={acc} value={acc} style={optionDark}>
                  {acc.slice(0, 6)}…{acc.slice(-4)}
                </option>
              ))}
            </select>

            <button
              className="wallet-pill"
              style={pill}
              onClick={disconnectWallet}
              onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            className="wallet-pill"
            style={pill}
            onClick={() => setOpen(true)}
            onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Connect Wallet
          </button>
        )}
      </div>

      { }
      {open && ReactDOM.createPortal(modal, document.body)}
    </>
  );
}



function TopBar({ sectionLinks = [] }) {
  return (
    <nav style={topBarStyle}>
      <img src="/fairates-logo.png" alt="Fairates" style={logoStyle} />

      {sectionLinks.map(({ to, label }) => (
        <Link key={label} to={to} style={navLink} className="nav-link">
          {label}
        </Link>
      ))}

      <WalletConnect />
    </nav>
  );
}


function LandingPage() {
  const navigate = useNavigate()

  const links = [
    { to: "/", label: "Home" },
    { to: "/developer/deploy", label: "Deploy" },
    { to: "/developer/manage", label: "Manage" },
    { to: "/developer/faucet", label: "Faucet" },
  ]

  const heroWrap = {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "50px 20px 100px",
    textAlign: "center",
  }

  const heroHeading = {
    fontSize: "clamp(2rem, 6vw, 3rem)",
    fontWeight: 400,
    lineHeight: 1.1,
    marginBottom: "24px",
    color: "#fff",
    fontFamily: FONT_FAMILY,
  }

  const heroSubContainer = {
    maxWidth: "650px",
    margin: "0 auto 56px",
    textAlign: "left",
  }

  const heroSub = {
    fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
    lineHeight: 1.5,
    margin: "0 0 24px",
    color: COLORS.textMuted,
  }

  const ctaRow = {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  }

  const primaryBtn = {
    background: COLORS.accent,
    color: "#FFF",
    border: "none",
    padding: "14px 32px",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background .18s",
    fontFamily: FONT_FAMILY,
  }

  return (
    <>
      <TopBar sectionLinks={links} />

      <div style={heroWrap}>
        <h1 style={heroHeading}>
          Fixed <span style={{ color: COLORS.accent }}>rates</span>,<br />
          not fixed games.
        </h1>

        <div style={heroSubContainer}>
          <p style={heroSub}>
            <strong>One rate</strong>: Fixed-rate for all lenders and borrowers through sealed-bid auctions.
          </p>
          <p style={heroSub}>
            <strong>Zero game</strong>: Fair price discovery. No centralized auctioneers or blackbox mechanisms powered by confidential computing.
          </p>
        </div>

        <div style={ctaRow}>
          <button
            style={primaryBtn}
            onClick={() => navigate("/user")}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.accentHover)}
            onMouseLeave={e => (e.currentTarget.style.background = COLORS.accent)}
          >
            Bid or Supply
          </button>
        </div>
      </div>
    </>
  )
}
function DeveloperWrapper() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/developer/deploy", label: "Deploy" },
    { to: "/developer/manage", label: "Manage" },
    { to: "/developer/faucet", label: "Faucet" },
  ];
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar sectionLinks={links} />
      <div style={{ padding: "32px" }}>
        <Routes>
          <Route path="deploy" element={<DeployPage />} />
          <Route
            path="auction/:aeAddress"
            element={<AuctionManagementPage />}
          />
          <Route path="manage" element={<ManageAuctionsPage />} />
          <Route path="faucet" element={<FaucetPage />} />
          <Route path="*" element={<DeployPage />} />
        </Routes>
      </div>
    </div>
  );
}
function UserWrapper() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/user", label: "Participate" },
    { to: "/user/faucet", label: "Faucet" },
  ];
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar sectionLinks={links} />
      <div style={{ padding: "32px" }}>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route
            path="auction/:auctionAddress"
            element={<UserAuctionPage />}
          />
          <Route path="faucet" element={<FaucetPage />} />
          <Route path="*" element={<UserDashboard />} />
        </Routes>
      </div>
    </div>
  );
}





function ManageAuctionsPage() {
  const { myAuctions, selectAuction } = useAppContext();
  const navigate = useNavigate();

  const wrap = { display: "flex", justifyContent: "center", padding: 48 };

  const card = {
    width: 420,
    padding: 32,
    borderRadius: 20,
    border: "1px solid rgba(155,61,255,.45)",
    background:
      "linear-gradient(135deg, rgba(155,61,255,.15), rgba(155,61,255,.05))",
    backdropFilter: "blur(4px)",
    color: "#fff",
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  };

  const heading = { fontSize: 28, fontWeight: 400, marginBottom: 24 };
  const selectBox = {
    width: "100%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    outline: "none",
  };
  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontWeight: 400,
    fontSize: 16,
    padding: "16px",
    borderRadius: 12,
    cursor: "pointer",
    width: "100%",
    marginTop: 28,
  };

  return (
    <div style={wrap}>
      <div className="purple-card" style={card}>
        <h2 style={heading}>Manage my auctions</h2>

        {myAuctions.length === 0 ? (
          <p style={{ fontSize: 16, lineHeight: 1.5 }}>
            No auctions deployed yet by this wallet.
          </p>
        ) : (
          <>
            <select
              style={selectBox}
              defaultValue=""
              onChange={(e) => {
                const addr = e.target.value;
                if (!addr) return;
                const found = myAuctions.find(
                  (a) => a.auctionEngineAddress === addr
                );
                if (found) selectAuction(found);
                navigate(`/developer/auction/${addr}`);
              }}
            >
              <option value="" disabled>
                – Select an auction –
              </option>
              {myAuctions.map((a) => (
                <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#231726", color: "#fff" }}  >
                  {a.auctionEngineAddress.slice(0, 6)}…{a.auctionEngineAddress.slice(-4)}
                </option>
              ))}
            </select>

            <button
              className="btn-primary"
              style={btn}
              onClick={() => {
                const sel = document.querySelector("select").value;
                if (!sel) return alert("Please select an auction first.");
                navigate(`/developer/auction/${sel}`);
              }}
            >
              Open dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AuctionManagementPage() {
  const { aeAddress } = useParams();
  const {
    currentAuction,
    deployedAuctions,
    selectAuction,
    setAuctionEngineAddress,
    signer,
    auctionEngineAddress,

    finalizeAuction,
    isDecrypting,
    registerNewCollateral,
    newCollateralAddress,
    setNewCollateralAddress,
    newCollateralRatio,
    setNewCollateralRatio,
    registeredCollaterals,
    cancelReason,
    setCancelReason,
    cancelAuction,
  } = useAppContext();

  const [clearingRate, setClearingRate] = React.useState("");

  React.useEffect(() => {
    if (aeAddress && (!currentAuction || currentAuction.auctionEngineAddress !== aeAddress)) {
      const found = deployedAuctions.find(
        (a) => a.auctionEngineAddress === aeAddress
      );
      if (found) selectAuction(found);
      else setAuctionEngineAddress(aeAddress);
    }
  }, [aeAddress, currentAuction, deployedAuctions, selectAuction, setAuctionEngineAddress]);

  async function checkClearingRate() {
    if (!signer || !auctionEngineAddress) {
      alert("AuctionEngine not set or wallet not connected.");
      return;
    }
    try {
      const ae = new ethers.Contract(
        auctionEngineAddress,
        AuctionEngineArtifact.abi,
        signer
      );
      const r = await ae.auctionClearingRate();
      const rate = r / 1e18;
      setClearingRate(rate.toString());
      alert(`Clearing Rate: ${rate}`);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch clearing rate: " + err.message);
    }
  }

  const wrapper = { display: "flex", justifyContent: "center", padding: 48 };

  const card = {
    width: 520,
    padding: 40,
    borderRadius: 20,
    border: "1px solid rgba(155,61,255,.45)",
    background:
      "linear-gradient(135deg, rgba(155,61,255,.15), rgba(155,61,255,.05))",
    backdropFilter: "blur(4px)",
    color: "#fff",
    fontFamily: FONT_FAMILY,
  };

  const h2 = {
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 32,
  };
  const sectionH3 = {
    fontSize: 22,
    fontWeight: 400,
    color: COLORS.accent,
    marginBottom: 16,
  };

  const label = {
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    marginBottom: 6,
    display: "block",
  };
  const input = {
    width: "80%",
    padding: "14px 18px",
    fontSize: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    outline: "none",
    marginBottom: 18,
  };
  const focusOn = (e) => {
    e.currentTarget.style.border = "1px solid #9B3DFF";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,61,255,.45)";
  };
  const focusOff = (e) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.25)";
    e.currentTarget.style.boxShadow = "none";
  };

  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontWeight: 400,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 8,
  };

  return (
    <div style={wrapper}>
      <div className="purple-card" style={card}>
        <h2 style={h2}>Auction&nbsp;management</h2>

        { }
        <div style={{ marginBottom: 40 }}>
          <h3 style={sectionH3}>Finalize auction</h3>
          <button className="btn-primary" style={btn} onClick={finalizeAuction}>
            Finalize
          </button>
          {isDecrypting && (
            <p style={{ marginTop: 10 }}>Decryption in progress…</p>
          )}

          <h3 style={{ ...sectionH3, marginTop: 32 }}>Check clearing rate</h3>
          <button className="btn-primary" style={btn} onClick={checkClearingRate}>
            Get rate
          </button>
          {clearingRate && (
            <p style={{ marginTop: 10, fontSize: 16 }}>
              Current clearing rate:&nbsp;<strong>{clearingRate}</strong>
            </p>
          )}
        </div>

        { }
        <div style={{ marginBottom: 40 }}>
          <h3 style={sectionH3}>Add collateral</h3>
          <label style={label}>Token address</label>
          <input
            style={input}
            value={newCollateralAddress}
            onChange={(e) => setNewCollateralAddress(e.target.value)}
            onFocus={focusOn}
            onBlur={focusOff}
            placeholder="0x…"
          />
          <label style={label}>Maintenance ratio</label>
          <input
            style={input}
            value={newCollateralRatio}
            onChange={(e) => setNewCollateralRatio(e.target.value)}
            onFocus={focusOn}
            onBlur={focusOff}
            placeholder="1"
          />
          <button className="btn-primary" style={btn} onClick={registerNewCollateral}>
            Register
          </button>

          {registeredCollaterals.length > 0 && (
            <ul style={{ marginTop: 18, fontSize: 15, lineHeight: 1.45 }}>
              {registeredCollaterals.map((c) => (
                <li key={c.address}>
                  {c.address.slice(0, 6)}…{c.address.slice(-4)}
                  &nbsp;(ratio&nbsp;{c.ratio})
                </li>
              ))}
            </ul>
          )}
        </div>

        { }
        <div>
          <h3 style={sectionH3}>Cancel auction</h3>
          <label style={label}>Reason</label>
          <input
            style={input}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            onFocus={focusOn}
            onBlur={focusOff}
            placeholder="e.g. testing"
          />
          <button className="btn-primary" style={btn} onClick={cancelAuction}>
            Cancel auction
          </button>
        </div>
      </div>
    </div>
  );
}


function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handleChange = (event) => setIsMobile(event.matches);


    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {

      mediaQuery.addListener(handleChange);
    }


    setIsMobile(mediaQuery.matches);


    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
}


function DeployPage() {
  const {
    deployContracts,
    deployContractsCustom,
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
  } = useAppContext();

  const page = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0px 32px 120px",
    display: "flex",
    gap: 64,
  };
  const columnStyle = { flex: "1 1 0%" };

  const cardBreak =
    "@media(max-width: 1020px){flex-direction:column;gap:48px;}";

  const h1 = { fontSize: 40, fontWeight: 400, marginBottom: 56 };
  const h2 = {
    fontSize: 26,
    fontWeight: 400,
    color: COLORS.accent,
    marginBottom: 6,
  };
  const subP = {
    fontSize: 18,
    lineHeight: 1.55,
    color: COLORS.textMuted,
    marginBottom: 20,
    maxWidth: 640,
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: 24,
  };
  const gridMobile =
    "@media(max-width:860px){grid-template-columns:1fr !important;}";

  const label = {
    fontSize: 20,
    fontWeight: 400,
    color: "#fff",
    marginBottom: 8,
    display: "block",
    textAlign: "left",
    marginTop: 12,
  };
  const inp = {
    width: "90%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.22)",
    outline: "none",
    transition: "border .18s,box-shadow .18s",
  };
  const onF = (e) => {
    e.currentTarget.style.border = "1px solid #9B3DFF";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,61,255,.45)";
  };
  const onB = (e) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.22)";
    e.currentTarget.style.boxShadow = "none";
  };

  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontSize: 18,
    fontWeight: 400,
    padding: "18px 60px",
    borderRadius: 14,
    cursor: "pointer",
    marginTop: 48,
  };

  const card = (
    <div
      style={{
        width: 320,
        padding: 28,
        borderRadius: 20,
        border: "1px solid rgba(155,61,255,.45)",
        background:
          "linear-gradient(135deg, rgba(155,61,255,.15), rgba(155,61,255,.05))",
        backdropFilter: "blur(4px)",
        flexShrink: 0,
        height: "20%",
      }}
    >
      <h3
        style={{
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 18,
          color: "#fff",
        }}
      >
        Test Deployment
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
        Deploy all contracts for testing. This option automatically sets the
        auction characteristics and disables some checks for easier testing.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 32 }}>
        In the generated auction, T1 is set as purchase token and T2 is the
        collateral by default.
      </p>
      <button className="btn-primary" style={btn} onClick={deployContracts}>
        Deploy&nbsp;(Test)
      </button>
    </div>
  );

  return (
    <div className="deploy-flex" style={{ ...page, [cardBreak]: {} }}>
      { }
      <div style={columnStyle}>
        <h1 style={h1}>Deploy contracts</h1>

        <h2 style={h2}>Custom Deployment</h2>
        <p style={subP}>
          Deploy all contracts with custom parameters. Decrypter is always set
          to our fixed address.
        </p>

        <div className="grid-2" style={{ ...grid, [gridMobile]: {} }}>
          { }
          <div>
            <label style={label}>Price Oracle Address</label>
            <input
              style={inp}
              value={customPriceOracle}
              onChange={(e) => setCustomPriceOracle(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0x…"
            />

            <label style={label}>Bid duration (secs)</label>
            <input
              style={inp}
              value={customBidDuration}
              onChange={(e) => setCustomBidDuration(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="86400"
            />

            <label style={label}>Repayment duration (secs)</label>
            <input
              style={inp}
              value={customRepaymentDuration}
              onChange={(e) => setCustomRepaymentDuration(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="172800"
            />

            <label style={label}>Fee</label>
            <input
              style={inp}
              value={customFee}
              onChange={(e) => setCustomFee(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0"
            />
            <label style={label}>Liquidation Fee</label>
            <input
              style={inp}
              value={customLiquidationFee}
              onChange={(e) => setCustomLiquidationFee(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0"
            />
            <label style={label}>Protocol Liquidation Fee</label>
            <input
              style={inp}
              value={customProtocolLiquidationFee}
              onChange={(e) => setCustomProtocolLiquidationFee(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0"
            />

            <label style={label}>Purchase token address</label>
            <input
              style={inp}
              value={customPurchaseToken}
              onChange={(e) => setCustomPurchaseToken(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0x…"
            />
            <label style={label}>Reveal duration (secs)</label>
            <input
              style={inp}
              value={customRevealDuration}
              onChange={(e) => setCustomRevealDuration(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="86400"
            />
            <label style={label}>Initial collateral ratio</label>
            <input
              style={inp}
              value={customCollateralRatio}
              onChange={(e) => setCustomCollateralRatio(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="1"
            />
          </div>

          { }
          <div>


            <label style={label}>Auction token ratio</label>
            <input
              style={inp}
              value={customAuctionTokenAmount}
              onChange={(e) => setCustomAuctionTokenAmount(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="1"
            />

            <label style={label}>Max bid value</label>
            <input
              style={inp}
              value={customMaxBid}
              onChange={(e) => setCustomMaxBid(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="15000"
            />

            <label style={label}>Min bid value</label>
            <input
              style={inp}
              value={customMinBid}
              onChange={(e) => setCustomMinBid(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="10"
            />
            <label style={label}>Max number of bids</label>
            <input
              style={inp}
              value={customMaxNumBids}
              onChange={(e) => setCustomMaxNumBids(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="50"
            />
            <label style={label}>Max offer value</label>
            <input
              style={inp}
              value={customMaxOffer}
              onChange={(e) => setCustomMaxOffer(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="10000"
            />

            <label style={label}>Min offer value</label>
            <input
              style={inp}
              value={customMinOffer}
              onChange={(e) => setCustomMinOffer(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="10"
            />
            <label style={label}>Max number of offers</label>
            <input
              style={inp}
              value={customMaxNumOffers}
              onChange={(e) => setCustomMaxNumOffers(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="50"
            />
            <label style={label}>Initial collateral token address</label>
            <input
              style={inp}
              value={customCollateralToken}
              onChange={(e) => setCustomCollateralToken(e.target.value)}
              onFocus={onF}
              onBlur={onB}
              placeholder="0x…"
            />



          </div>

        </div>
        <button className="btn-primary" style={btn} onClick={deployContractsCustom}>
          Deploy
        </button>
      </div>

      { }
      {card}
    </div>
  );
}



function UserDashboard() {
  const { deployedAuctions, selectAuction } = useAppContext();
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState("");

  const wrap = { display: "flex", justifyContent: "center", padding: 48 };

  const card = {
    width: 420,
    padding: 32,
    borderRadius: 20,
    border: "1px solid rgba(155,61,255,.45)",
    background:
      "linear-gradient(135deg, rgba(155,61,255,.15), rgba(155,61,255,.05))",
    backdropFilter: "blur(4px)",
    color: "#fff",
    fontFamily: FONT_FAMILY,
    textAlign: "center",
  };

  const heading = { fontSize: 28, fontWeight: 400, marginBottom: 24 };
  const selectBox = {
    width: "100%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    outline: "none",
  };
  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontWeight: 400,
    fontSize: 16,
    padding: "16px",
    borderRadius: 12,
    cursor: "pointer",
    width: "100%",
    marginTop: 28,
  };

  return (
    <div style={wrap}>
      <div className="purple-card" style={card}>
        <h2 style={heading}>Available auctions</h2>

        {deployedAuctions.length === 0 ? (
          <p style={{ fontSize: 16, lineHeight: 1.5 }}>
            No auctions deployed yet.
          </p>
        ) : (
          <>
            <select
              style={selectBox}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">– Select an auction –</option>
              {deployedAuctions.map((a) => (

                <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#231726", color: "#fff" }}  >
                  {a.auctionEngineAddress.slice(0, 6)}…{a.auctionEngineAddress.slice(-4)}
                </option>
              ))}
            </select>

            <button
              className="btn-primary"
              style={btn}
              onClick={() => {
                if (!selected)
                  return alert("Please select an auction first.");
                const found = deployedAuctions.find(
                  (a) => a.auctionEngineAddress === selected
                );
                if (found) selectAuction(found);
                navigate(`/user/auction/${selected}`);
              }}
            >
              Participate
            </button>
          </>
        )}
      </div>
    </div>
  );
}


function UserAuctionPage() {
  const {
    auctionEngineAddress,

    bidAmount,
    setBidAmount,
    bidRate,
    setBidRate,
    placeBid,

    offerAmount,
    setOfferAmount,
    offerRate,
    setOfferRate,
    placeOffer,

    repayAmount,
    setRepayAmount,
    repay,
    owedAmount,
    checkOwed,

    liquidationBorrower,
    setLiquidationBorrower,
    liquidationCollateralSelections,
    setLiquidationCollateralSelections,
    liquidate,

    redemptionAmount,
    setRedemptionAmount,
    redeemToken,

    bidCollateralSelections,
    setBidCollateralSelections,

    extraCollateralSelections,
    setExtraCollateralSelections,
    removeCollateralSelections,
    setRemoveCollateralSelections,
    externalLockCollateral,
    externalUnlockCollateral,

    removeBid,
    removeOffer,
  } = useAppContext();
  useEffect(() => {
    if (bidCollateralSelections.length > 0) {
      const rows = bidCollateralSelections.map((c) => ({
        address: c.address,
        amount: "",
      }));
      setExtraCollateralSelections(rows);
      setRemoveCollateralSelections(rows);
    }
  }, [bidCollateralSelections, setExtraCollateralSelections, setRemoveCollateralSelections]);

  const wrapper = { maxWidth: 1140, margin: "0 auto", padding: 32 };
  const section = { marginBottom: 64 };
  const h2 = { fontSize: 28, fontWeight: 400, color: COLORS.accent, marginBottom: 24 };
  const grid2 = { display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit,minmax(430px,1fr))" };
  const label = { fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8, display: "block", textAlign: "left", marginTop: 12 };
  const input = { width: "90%", padding: "18px 20px", fontSize: 18, borderRadius: 12, background: "rgba(255,255,255,0.04)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", outline: "none", transition: "box-shadow .18s,border .18s" };
  const focusOn = e => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,61,255,0.45)"; e.currentTarget.style.borderColor = COLORS.accent; };
  const focusOff = e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; };
  const purpleBtn = { background: COLORS.accent, border: "none", color: "#fff", fontSize: 18, fontWeight: 400, padding: "18px 64px", borderRadius: 14, cursor: "pointer", marginTop: 28, fontFamily:FONT_FAMILY };
  const table = { width: "100%", borderCollapse: "collapse", marginTop: 24 };
  const td = { border: "1px solid rgba(255,255,255,0.15)", padding: 12, fontSize: 15 };

  const updateBidCollat = (i, v) => setBidCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateLiqCollat = (i, v) => setLiquidationCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateExtraCollat = (i, v) => setExtraCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateRemoveCollat = (i, v) => setRemoveCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });

  return (
    <div style={wrapper}>
      <h1 style={{ fontSize: 38, fontWeight: 400, marginBottom: 48 }}>
        Participate in auction{" "}
        <span style={{ fontSize: 20, fontWeight: 400, color: COLORS.textMuted }}>
          ({auctionEngineAddress.slice(0, 6)}…{auctionEngineAddress.slice(-4)})
        </span>
      </h1>

      { }
      <div style={{ ...grid2, ...section }}>
        { }
        <div>
          <h2 style={h2}>Place a Bid</h2>
          <label style={label}>Bid amount</label>
          <input
            style={input}
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <label style={label}>Bid rate</label>
          <input
            style={input}
            value={bidRate}
            onChange={e => setBidRate(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <table style={table}>
            <thead>
              <tr>
                <th style={td}>Collateral token</th>
                <th style={td}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bidCollateralSelections.map((c, i) => (
                <tr key={c.address}>
                  <td style={td}>{c.address.slice(0, 6)}…{c.address.slice(-4)}</td>
                  <td style={td}>
                    <input
                      style={{ ...input, margin: 0, padding: "8px 10px", fontSize: 15 }}
                      value={c.amount}
                      onChange={e => updateBidCollat(i, e.target.value)}
                      onFocus={focusOn} onBlur={focusOff}
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-primary"
              style={{ ...purpleBtn, flex: 1 }}
              onClick={placeBid}
            >
              Submit Bid
            </button>
            <button
              className="btn-primary"
              style={{ ...purpleBtn, flex: 1 }}
              onClick={removeBid}
            >
              Remove My Bid
            </button>
          </div>
        </div>

        { }
        <div>
          <h2 style={h2}>Place an Offer</h2>
          <label style={label}>Offer amount</label>
          <input
            style={input}
            value={offerAmount}
            onChange={e => setOfferAmount(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <label style={label}>Offer rate</label>
          <input
            style={input}
            value={offerRate}
            onChange={e => setOfferRate(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-primary"
              style={{ ...purpleBtn, flex: 1 }}
              onClick={placeOffer}
            >
              Submit Offer
            </button>
            <button
              className="btn-primary"
              style={{ ...purpleBtn, flex: 1 }}
              onClick={removeOffer}
            >
              Remove My Offer
            </button>
          </div>
        </div>
      </div>
      <div style={{ ...grid2, ...section }}>
        { }
        <div style={section}>
          <h2 style={h2}>Add or Remove Collateral</h2>
          <table style={table}>
            <thead>
              <tr>
                <th style={td}>Token</th>
                <th style={td}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {extraCollateralSelections.map((c, i) => (
                <tr key={c.address}>
                  <td style={td}>{c.address.slice(0, 6)}…{c.address.slice(-4)}</td>
                  <td style={td}>
                    <input
                      style={{ ...input, margin: 0, padding: "8px 10px", fontSize: 15 }}
                      value={c.amount}
                      onChange={e => updateExtraCollat(i, e.target.value)}
                      onFocus={focusOn} onBlur={focusOff}
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-primary"
              style={purpleBtn}
              onClick={() =>
                externalLockCollateral(
                  extraCollateralSelections.map(c => c.address),
                  extraCollateralSelections.map(c => c.amount)
                )
              }
            >
              Lock Collateral
            </button>
            <button
              className="btn-primary"
              style={purpleBtn}
              onClick={() =>
                externalUnlockCollateral(
                  extraCollateralSelections.map(c => c.address),
                  extraCollateralSelections.map(c => c.amount)
                )
              }
            >
              Unlock Collateral
            </button>
          </div>
        </div>
      </div>

      { }
      <div style={{ ...grid2, ...section }}>
        <div>
          <h2 style={h2}>Repay Loan</h2>
          <label style={label}>Repay amount</label>
          <input
            style={input}
            value={repayAmount}
            onChange={e => setRepayAmount(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <button className="btn-primary" style={purpleBtn} onClick={repay}>
            Repay
          </button>
        </div>
        <div>
          <h2 style={h2}>Check Owed</h2>
          <button className="btn-primary" style={purpleBtn} onClick={checkOwed}>
            Check
          </button>
          {owedAmount && (
            <p style={{ marginTop: 18, fontSize: 20 }}>
              You owe: <strong>{owedAmount}</strong>
            </p>
          )}
        </div>
      </div>
      <div style={{ ...grid2, ...section }}>
        { }
        <div style={section}>
          <h2 style={h2}>Liquidate Borrower</h2>
          <label style={label}>Borrower address</label>
          <input
            style={input}
            value={liquidationBorrower}
            onChange={e => setLiquidationBorrower(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0x…"
          />
          <table style={table}>
            <thead>
              <tr>
                <th style={td}>Collateral token</th>
                <th style={td}>Coverage amount</th>
              </tr>
            </thead>
            <tbody>
              {liquidationCollateralSelections.map((c, i) => (
                <tr key={c.address}>
                  <td style={td}>{c.address.slice(0, 6)}…{c.address.slice(-4)}</td>
                  <td style={td}>
                    <input
                      style={{ ...input, margin: 0, padding: "8px 10px", fontSize: 15 }}
                      value={c.amount}
                      onChange={e => updateLiqCollat(i, e.target.value)}
                      onFocus={focusOn} onBlur={focusOff}
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-primary" style={purpleBtn} onClick={liquidate}>
            Liquidate
          </button>
        </div>

        { }
        <div style={section}>
          <h2 style={h2}>Redeem Auction Tokens</h2>
          <label style={label}>Redemption amount</label>
          <input
            style={input}
            value={redemptionAmount}
            onChange={e => setRedemptionAmount(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <button className="btn-primary" style={purpleBtn} onClick={redeemToken}>
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}


function BackgroundManager() {
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname === "/") {
      document.body.classList.remove("arb-bg");
    } else {
      document.body.classList.add("arb-bg");
    }
  }, [location.pathname]);

  return null;
}
function App() {
  return (
    <>
      { }
      <style>{globalBgCss}</style>
      <style>{`
        body.arb-bg{
          background:#0a0605 url("${process.env.PUBLIC_URL}/deploy-bg.png")
                     no-repeat bottom right/cover;
          background-attachment:fixed;
        }
      `}</style>
      <style>{mobileCss}</style>
      <style>{responsiveCss}</style>
      <AppProvider>
        <Router>
          { }
          <BackgroundManager />

          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/developer/*" element={<DeveloperWrapper />} />
            <Route path="/user/*" element={<UserWrapper />} />
          </Routes>
        </Router>
      </AppProvider>
    </>
  );
}


export default App;