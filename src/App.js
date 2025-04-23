import ReactDOM from "react-dom";
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

/* ─── Contract Artifacts ──────────────────────────────────────────────── */
import CollateralManagerArtifact from "./CollateralManager.json";
import AuctionTokenArtifact from "./AuctionToken.json";
import AuctionEngineArtifact from "./AuctionEngine.json";
import LendingVaultArtifact from "./LendingVault.json";
import BidManagerArtifact from "./BidManager.json";
import OfferManagerArtifact from "./OfferManager.json";
import FairyringArtifact from "./FairyringContract.json";

/* ─── Constants (unchanged) ───────────────────────────────────────────── */
const FAIRYRING_CONTRACT_ADDRESS =
  "0xcBD4E181561fF26e9Cf20C4B1250fA7D0049BA95";
const ERC20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];
const T1_ADDRESS = "0xDB1E18f9eb609FD8027DF1fCcc06315f019C0dA0";
const DEFAULT_COLLATERAL =
  "0x2367dDf156601b411479A3745B20f0618055270E";

const T2_ADDRESS =
  "0x2367dDf156601b411479A3745B20f0618055270E";
const T3_ADDRESS =
  "0xf59D050BeA595f6F3A47e0a28e85B23BFB56DD81";

const T1_FAUCET =
  "0x23F62098dE48391AcdEFA14D9C0fCa5f30EEb5a8";
const T2_FAUCET =
  "0xb7D6e143417E0e097365296408f0c8B41b60493B";
const T3_FAUCET =
  "0x2369F3ed583DE7cA80c46977d323119d24674824";
/* ─── Brand palette & type ───────────────────────────────────────────── */
const COLORS = {
  bgDark: "#080808",
  textPrimary: "#FFFFFF",
  textMuted: "#BDBDBD",
  accent: "#9B3DFF",
  accentHover: "#B570FF",
  buttonBorder: "rgba(255,255,255,0.15)",
};
const FONT_FAMILY = `"Inter", sans-serif`;

/* NAV BAR */
export const topBarStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0 64px",
  height: "112px",
  backdropFilter: "blur(6px)",
  background: "rgba(8,8,8,0.72)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};
export const navLink = {
  fontSize: "28px",
  fontWeight: 600,
  marginLeft: "64px",
  color: COLORS.textPrimary,
};
export const logoStyle = { height: 80 };

export const walletBtnBase = {
  height: "56px",
  display: "flex",
  alignItems: "center",
  padding: "0 32px",
  borderRadius: "9999px",
  border: `1px solid ${COLORS.buttonBorder}`,
  background: "transparent",
  color: COLORS.textPrimary,
  fontWeight: 600,
  fontFamily: FONT_FAMILY,
  cursor: "pointer",
  transition: "background .18s",
};

/* HERO */

export const heroHeading = {
  fontSize: "96px",
  fontWeight: 700,
  lineHeight: 1.1,
  marginBottom: "40px",
};
export const heroSub = {
  fontSize: "26px",
  lineHeight: 1.55,
  maxWidth: "760px",
  margin: "0 auto 72px",
  color: COLORS.textMuted,
};
export const ctaRow = {
  display: "flex",
  gap: "32px",
  justifyContent: "center",
  flexWrap: "wrap",
};
export const primaryBtn = {
  background: COLORS.accent,
  color: "#FFF",
  border: "none",
  padding: "24px 56px",
  borderRadius: "16px",
  fontSize: "22px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "background .18s",
};
export const secondaryBtn = {
  ...primaryBtn,
  background: "#FFF",
  color: COLORS.bgDark,
};




/* ─── Global CSS (background uses your PNG) ──────────────────────────── */
const globalBgCss = `
  html,body{margin:0;padding:0;min-height:100vh}
  body{
    background-color:${COLORS.bgDark};
    background-image:url("/home-bg.png");
    background-position:center bottom;
    background-repeat:no-repeat;
    background-size:cover;
    color:${COLORS.textPrimary};
    font-family:${FONT_FAMILY};
    -webkit-font-smoothing:antialiased;
  }
  a{color:${COLORS.textPrimary};text-decoration:none}
`;

/* ─── Utility : hex→Uint8Array (unchanged) ───────────────────────────── */
function hexToUint8Array(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return arr;
}

/* ─── Re-usable inline styles from your original file (kept intact) ─── */
const buttonStyle = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "0.7rem 1.2rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  transition: "background-color 0.2s ease-in-out",
  fontFamily: "EB Garabond",
  whiteSpace: "nowrap",
};
const buttonStyleBid = {
  ...buttonStyle,
  width: "25%",
};
const buttonStyleAuction = {
  ...buttonStyle,
  width: "40%",
};
const inputStyle = {
  width: "40%",
  marginBottom: "0.7rem",
  padding: "0.7rem 1.2rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  color: "#333",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  transition: "border-color 0.2s ease-in-out",
  fontFamily: "EB Garabond",
  marginRight: "0.7rem",
};
const inputStyleCollat = {
  ...inputStyle,
  width: "100%",
};
const cardStyle = {
  backgroundColor: "#fff",
  color: "#333",
  padding: "1.5rem",
  marginTop: "1.5rem",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  fontFamily: "EB Garabond",
};

const auctionPageOuterStyle = {
  backgroundColor: "#f7f7f7",
  padding: "2rem",
  borderRadius: "10px",
  maxWidth: "1200px",
  margin: "2rem auto",
  display: "grid",
  gridTemplateRows: "auto auto auto",
  rowGap: "2rem",
};
const auctionTitleStyle = {
  textAlign: "center",
  color: "#555",
  fontSize: "1.8rem",
  marginBottom: "1.5rem",
  fontWeight: "bold",
};
const threeColumnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "2rem",
};
const proSectionCardStyle = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
};
const labelStyle = {
  display: "block",
  marginBottom: "0.3rem",
  marginTop: "0.8rem",
  fontWeight: 600,
  color: "#666",
  fontSize: "0.95rem",
};
const tableStyle = {
  width: "100%",
  borderSpacing: 0,
  borderCollapse: "collapse",
  marginBottom: "0.7rem",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};
const tdStyle = {
  padding: "0.5rem",
  borderBottom: "1px solid #e0e0e0",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};
const selectStyle = {
  width: "20%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  color: "#333",
  fontFamily: "EB Garabond",
  marginTop: "1rem",
  marginRight: "0.5rem",
};
const selectStyleWallet = {
  ...selectStyle,
  width: "70%",
};

// --------------------------------------------------------
// App Context & Provider 
// --------------------------------------------------------
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState([]);


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

  
  const [customPriceOracle, setCustomPriceOracle] = useState("");
  const [customBidDuration, setCustomBidDuration] = useState("");
  const [customRevealDuration, setCustomRevealDuration] = useState("");
  const [customRepaymentDuration, setCustomRepaymentDuration] = useState("");
  const [customFee, setCustomFee] = useState("");
  const [customAuctionTokenAmount, setCustomAuctionTokenAmount] = useState("");
  const [customDecrypter, setCustomDecrypter] = useState("");
  const [customPurchaseToken, setCustomPurchaseToken] = useState("");


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
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAvailableAccounts(accounts);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newSigner = provider.getSigner(0);
      const address = accounts[0];
      setSigner(newSigner);
      setWalletAddress(address);
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
    const ID = `fairy1m9l358xunhhwds0568za49mzhvuxx9uxdra8sq/${userAddr}/${auctionIdNum}`;
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
      const priceOracle = "0x0cE2ae8BC8c40F341d950d2Fbf7B3180d5783ce4";
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
      const bmContract = await BidManagerFactory.deploy(
        cmContract.address,
        aeContract.address,
        15000,
        T1_ADDRESS,
        10,
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
      const omContract = await OfferManagerFactory.deploy(
        lvContract.address,
        aeContract.address,
        10000,
        10,
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
      const AUCTION_TOKEN_AMOUNT = Number(customAuctionTokenAmount);
      const DECRYPTER = "0xF760B0F08897CbE3bca53b7840774883Cbc4bF12";
      const purchaseToken = customPurchaseToken;
      const maxBid = Number(customMaxBid);
      const maxOffer = Number(customMaxOffer);

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
        purchaseToken
        // TODO: add min bid value and max num bids                                                                    
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
        maxOffer
        // TODO: add min offer and max number of offers                                                                                          
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
      setBidAmount("");
      setBidRate("");
      setBidCollateralSelections(bidCollateralSelections.map(c => ({ address: c.address, amount: "" })));
    } catch (error) {
      console.error("Bid failed:", error);
      alert("Bid failed: " + error.message);
    }
  }

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
    try {
      await approveToken(T1_ADDRESS, auctionEngineAddress);
      const amountBN = ethers.utils.parseUnits(repayAmount, 18);
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
    try {
      const owed = await ae.repayments(walletAddress);
      const formattedOwed = ethers.utils.formatUnits(owed, 18);
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
      const coverageArray = usedCollaterals.map((c) => ethers.BigNumber.from(c.amount));

      await approveToken(T1_ADDRESS, auctionEngineAddress);

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
      alert("Collateral unlock failed: " + error.message);
    }
  }

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
      alert("Unlock offer funds failed: " + error.message);
    }
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
    try {
      const amountBN = ethers.BigNumber.from(redemptionAmount);
      const tx = await atContract.redeemToken(amountBN);
      await tx.wait();
      alert("Token redemption successful.");
      setRedemptionAmount("");
    } catch (error) {
      console.error("Token redemption failed:", error);
      alert("Token redemption failed: " + error.message);
    }
  }

  useEffect(() => {
    fetch("https://34.228.190.48:9092/contracts")
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

    fetch("https://34.228.190.48:9092/contracts", {
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
    unlockMyCollateral,
    unlockMyOfferFunds,

    redemptionAmount,
    setRedemptionAmount,
    redeemToken,

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

// --------------------------------------------------------
// TokenDisplay Component
// --------------------------------------------------------
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

// --------------------------------------------------------
// Faucet Page Component 
// --------------------------------------------------------
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

  return (
    <div style={cardStyle}>
      <h2>Faucet</h2>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>T1</h3>
        <p>Token Address: <TokenDisplay address={T1_ADDRESS} /></p>
        <p>Faucet Address: {T1_FAUCET}</p>
        <button style={buttonStyle} onClick={() => handleWithdraw("T1", T1_FAUCET)}>Request T1</button>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>T2</h3>
        <p>Token Address: <TokenDisplay address={T2_ADDRESS} /></p>
        <p>Faucet Address: {T2_FAUCET}</p>
        <button style={buttonStyle} onClick={() => handleWithdraw("T2", T2_FAUCET)}>Request T2</button>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>T3</h3>
        <p>Token Address: <TokenDisplay address={T3_ADDRESS} /></p>
        <p>Faucet Address: {T3_FAUCET}</p>
        <button style={buttonStyle} onClick={() => handleWithdraw("T3", T3_FAUCET)}>Request T3</button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   WALLET-CONNECT 
   ──────────────────────────────────────────────────────────── */
   /* ───────────────────────────────────────────────────────────────
   WALLET-CONNECT  with modal overlay
   ───────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────
   WALLET-CONNECT  (modal is now portalled, so it centres)
   ──────────────────────────────────────────────────────────── */
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
  
    /* pill */
    const pill = walletBtnBase;
  
    /* dark select */
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
  
    /* modal */
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
      fontWeight: 700,
      cursor: "pointer",
      marginTop: 40,
    };
  
    /* ESC closes modal */
    React.useEffect(() => {
      if (!open) return;
      const onKey = (e) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open]);
  
    /* helper to render the modal via portal */
    const modal = (
      <div style={overlay} onClick={() => setOpen(false)}>
        <div style={card} onClick={(e) => e.stopPropagation()}>
          <img src={`${process.env.PUBLIC_URL}/metamask.svg`} alt="MetaMask" style={fox} />
          <p style={{ color: "#000", fontSize: 22, fontWeight: 600 }}>
            To get started, connect your<br />MetaMask wallet.
          </p>
          <button
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
  
        {/* render modal into <body> so nav backdrop-filter doesn’t trap it */}
        {open && ReactDOM.createPortal(modal, document.body)}
      </>
    );
  }
  

/* ───────────────────────────────────────────────────────────────────────
   TOP BAR (logo + links)
   ───────────────────────────────────────────────────────────────────── */

   function TopBar({ sectionLinks = [] }) {
    return (
      <nav style={topBarStyle}>
        <img src="/fairates-logo.png" alt="Fairates" style={logoStyle} />
  
        {sectionLinks.map(({ to, label }) => (
          <Link key={label} to={to} style={navLink}>
            {label}
          </Link>
        ))}
  
        <WalletConnect />
      </nav>
    );
  }

/* ───────────────────────────────────────────────────────────────────────
   LANDING PAGE  – now uses background image, plus top nav
   ───────────────────────────────────────────────────────────────────── */
function LandingPage() {
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Home" },
    { to: "/developer/deploy", label: "Deploy" },
    { to: "/developer/manage", label: "Manage" },
    { to: "/developer/faucet", label: "Faucet" },
  ];

  const heroWrap = {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "50px 20px 160px",
    textAlign: "center",
  };
  const heading = {
    fontSize: "64px",
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: "28px",
  };
  const sub = {
    fontSize: "20px",
    lineHeight: 1.5,
    maxWidth: "680px",
    margin: "0 auto 56px",
    color: COLORS.textMuted,
  };
  const ctaRow = {
    display: "flex",
    gap: "24px",
    justifyContent: "center",
    flexWrap: "wrap",
  };
  const primaryBtn = {
    background: COLORS.accent,
    color: "#FFF",
    border: "none",
    padding: "18px 40px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background .18s",
  };
  const secondaryBtn = {
    ...primaryBtn,
    background: "#FFF",
    color: COLORS.bgDark,
  };

  return (
    
    <div style={{ minHeight: "100vh" }}>
      {/* top navigation */}
      <TopBar sectionLinks={links} />
      {/* main hero copy */}
      <div style={heroWrap}>
  <h1 style={heroHeading}>
    Fixed <span style={{ color: COLORS.accent }}>rates</span>,<br />
    not fixed games.
  </h1>

  <p style={heroSub}>
  One rate: Fixed-rate for all lenders and borrowers through sealed-bid auctions. 
  <p></p>
  Zero game: Fair price discovery. No centralized auctioneers or blackbox mechanisms powered by confidential computing
  </p>
  <div style={ctaRow}>
    <button
      style={primaryBtn}
      onClick={() => navigate("/user")}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = COLORS.accentHover)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = COLORS.accent)
      }
    >
      Bid or Supply
    </button>

   
  </div>
</div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────
   Developer & User Wrappers reuse TopBar
   ───────────────────────────────────────────────────────────────────── */
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

/* ───────────────────────────────────────────────────────────────────────
   Mobile overrides (your original block)
   ───────────────────────────────────────────────────────────────────── */
const mobileCss = `
  @media (max-width: 768px) {
    .auction-page-outer {
      padding: 1rem !important;
      margin: 1rem auto !important;
    }
    .three-column-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .responsive-input,
    .responsive-select,
    .responsive-button {
      width: 100% !important;
    }
  }
`;




function ManageAuctionsPage() {
  const { myAuctions, selectAuction } = useAppContext();
  const navigate = useNavigate();

  return (
    <div style={cardStyle}>
      <h2>Manage My Auctions</h2>
      {myAuctions.length === 0 ? (
        <p>No auctions deployed yet by this wallet.</p>
      ) : (
        <>
          <select
            style={selectStyle}
            className="responsive-select"
            onChange={(e) => {
              const selectedEngine = e.target.value;
              if (!selectedEngine) {
                alert("Please select an auction first.");
                return;
              }
              const auctionObj = myAuctions.find(a => a.auctionEngineAddress === selectedEngine);
              if(auctionObj) {
                selectAuction(auctionObj);
              }
              navigate(`/developer/auction/${selectedEngine}`);
            }}
          >
            <option value="">-- Select an Auction --</option>
            {myAuctions.map((auction) => (
              <option key={auction.auctionEngineAddress} value={auction.auctionEngineAddress}>
                {auction.auctionEngineAddress}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------
// AuctionManagementPage
// --------------------------------------------------------
function AuctionManagementPage() {
  const { aeAddress } = useParams();
  const { currentAuction, deployedAuctions, selectAuction, setAuctionEngineAddress, signer, auctionEngineAddress, finalizeAuction, isDecrypting,
    registerNewCollateral, newCollateralAddress, setNewCollateralAddress,
    newCollateralRatio, setNewCollateralRatio, registeredCollaterals,
    cancelReason, setCancelReason, cancelAuction } = useAppContext();
  const [clearingRate, setClearingRate] = useState("");

  useEffect(() => {
    if (aeAddress && (!currentAuction || currentAuction.auctionEngineAddress !== aeAddress)) {
      const foundAuction = deployedAuctions.find(a => a.auctionEngineAddress === aeAddress);
      if(foundAuction) {
        selectAuction(foundAuction);
      } else {
        setAuctionEngineAddress(aeAddress);
      }
    }
  }, [aeAddress, currentAuction, deployedAuctions, selectAuction, setAuctionEngineAddress]);

  async function checkClearingRate() {
    if (!signer || !auctionEngineAddress) {
      alert("AuctionEngine not set or wallet not connected.");
      return;
    }
    try {
      const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
      const r = await ae.auctionClearingRate();
      const rate = r / 1e18;
      setClearingRate(rate.toString());
      alert(`Clearing Rate: ${rate.toString()}`);
    } catch (error) {
      console.error("Clearing rate error:", error);
      alert("Failed to fetch clearing rate: " + error.message);
    }
  }

  return (
    <div className="auction-page-outer" style={cardStyle}>
      <h2>Auction Management: {aeAddress}</h2>
      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Finalize Auction</h3>
        <button style={buttonStyle} className="responsive-button" onClick={finalizeAuction}>
          Finalize Auction
        </button>
        {isDecrypting && <p>Decryption in progress, please wait...</p>}
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Check Clearing Rate</h3>
        <button style={buttonStyle} className="responsive-button" onClick={checkClearingRate}>
          Get Clearing Rate
        </button>
        {clearingRate && (
          <p style={{ marginTop: "0.5rem" }}>
            Current Clearing Rate: <strong>{clearingRate}</strong>
          </p>
        )}
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", width:"30%" }}>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Add Collateral</h3>
        <label style={labelStyle}>Token Address:</label>
        <input
          type="text"
          placeholder="0x..."
          style={inputStyleCollat}
          className="responsive-input"
          value={newCollateralAddress}
          onChange={(e) => setNewCollateralAddress(e.target.value)}
        />
        <label style={labelStyle}>Maintenance Ratio:</label>
        <input
          type="text"
          placeholder="1"
          style={inputStyleCollat}
          className="responsive-input"
          value={newCollateralRatio}
          onChange={(e) => setNewCollateralRatio(e.target.value)}
        />
        <button style={buttonStyleAuction} className="responsive-button" onClick={registerNewCollateral}>
          Register Collateral
        </button>
        {registeredCollaterals.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Registered Collaterals:</strong>
            <ul style={{ lineHeight: "1.6" }}>
              {registeredCollaterals.map((rc) => (
                <li key={rc.address}>
                  <TokenDisplay address={rc.address} /> (ratio {rc.ratio})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Cancel Auction</h3>
        <label style={labelStyle}>Reason:</label>
        <input
          type="text"
          style={inputStyle}
          className="responsive-input"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <button style={buttonStyle} className="responsive-button" onClick={cancelAuction}>
          Cancel Auction
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// DeveloperWrapper
// --------------------------------------------------------

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
    customAuctionTokenAmount,
    setCustomAuctionTokenAmount,
    customPurchaseToken,
    setCustomPurchaseToken,
    customMaxBid,
    setCustomMaxBid,
    customMaxOffer,
    setCustomMaxOffer,
    customCollateralToken,
    setCustomCollateralToken,
    customCollateralRatio,
    setCustomCollateralRatio
  } = useAppContext();

  return (
    <div style={cardStyle}>
      <h2>Deploy Contracts</h2>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Test Deployment</h3>
        <p>
          Deploy all contracts for testing. This option automatically sets the auction characteristics and disables some checks for easier testing.
        </p>
        <p>In the generated auction, T1 is set as purchase token and T2 is the collateral by default.</p>
        <button style={buttonStyle} className="responsive-button" onClick={deployContracts}>
          Deploy (Test)
        </button>
      </div>
      <hr style={{ margin: "2rem 0" }} />
      <div>
        <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Custom Deployment</h3>
        <p>
          Deploy all contracts with custom parameters. Decrypter is always set to our fixed address.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", width:"50%" }}>
          <label style={labelStyle}>Price Oracle Address:</label>
          <input
            type="text"
            placeholder="0x..."
            value={customPriceOracle}
            onChange={(e) => setCustomPriceOracle(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Bid Duration (seconds):</label>
          <input
            type="text"
            placeholder="86400"
            value={customBidDuration}
            onChange={(e) => setCustomBidDuration(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Reveal Duration (seconds):</label>
          <input
            type="text"
            placeholder="86400"
            value={customRevealDuration}
            onChange={(e) => setCustomRevealDuration(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Repayment Duration (seconds):</label>
          <input
            type="text"
            placeholder="172800"
            value={customRepaymentDuration}
            onChange={(e) => setCustomRepaymentDuration(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Fee:</label>
          <input
            type="text"
            placeholder="0"
            value={customFee}
            onChange={(e) => setCustomFee(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Auction Token Ratio:</label>
          <input
            type="text"
            placeholder="1"
            value={customAuctionTokenAmount}
            onChange={(e) => setCustomAuctionTokenAmount(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Purchase Token Address:</label>
          <input
            type="text"
            placeholder="0x..."
            value={customPurchaseToken}
            onChange={(e) => setCustomPurchaseToken(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Max Bid Value:</label>
          <input
            type="text"
            placeholder="e.g., 15000"
            value={customMaxBid}
            onChange={(e) => setCustomMaxBid(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Max Offer Value:</label>
          <input
            type="text"
            placeholder="e.g., 10000"
            value={customMaxOffer}
            onChange={(e) => setCustomMaxOffer(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Initial Collateral Token Address:</label>
          <input
            type="text"
            placeholder="0x..."
            value={customCollateralToken}
            onChange={(e) => setCustomCollateralToken(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Initial Collateral Ratio:</label>
          <input
            type="text"
            placeholder="e.g., 1"
            value={customCollateralRatio}
            onChange={(e) => setCustomCollateralRatio(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <button style={buttonStyleAuction} className="responsive-button" onClick={deployContractsCustom}>
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}

const UserDashboard = () => {
  const { deployedAuctions, selectAuction } = useAppContext();
  const navigate = useNavigate();
  const [selectedAuction, setSelectedAuction] = useState("");

  return (
    <div style={cardStyle}>
      <h2>Available Auctions</h2>
      {deployedAuctions.length === 0 ? (
        <p>No auctions deployed yet.</p>
      ) : (
        <>
          <select
            style={selectStyle}
            className="responsive-select"
            value={selectedAuction}
            onChange={(e) => {
              setSelectedAuction(e.target.value);
              const auctionObj = deployedAuctions.find(a => a.auctionEngineAddress === e.target.value);
              if (auctionObj) selectAuction(auctionObj);
            }}
          >
            <option value="">-- Select an Auction --</option>
            {deployedAuctions.map((auction) => (
              <option key={auction.auctionEngineAddress} value={auction.auctionEngineAddress}>
                {auction.auctionEngineAddress}
              </option>
            ))}
          </select>
          <button
            style={buttonStyle}
            className="responsive-button"
            onClick={() => {
              if (!selectedAuction) {
                alert("Please select an auction first.");
                return;
              }
              navigate(`/user/auction/${selectedAuction}`);
            }}
          >
            View &amp; Participate
          </button>
        </>
      )}
    </div>
  );
};

// --------------------------------------------------------
// UserAuctionPage
// --------------------------------------------------------
function UserAuctionPage() {
  const { auctionAddress } = useParams();
  const {
    currentAuction,
    deployedAuctions,
    selectAuction,
    placeBid,
    placeOffer,
    bidAmount,
    setBidAmount,
    bidRate,
    setBidRate,
    offerAmount,
    setOfferAmount,
    offerRate,
    setOfferRate,
    bidCollateralSelections,
    setBidCollateralSelections,
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
    signer,
    auctionEngineAddress
  } = useAppContext();

  const [auctionDetails, setAuctionDetails] = useState({
    token: "",
    isFinalized: false,
    auctionCancelled: false,
    biddingEnd: "",
    repaymentDue: ""
  });

  function formatDate(timestamp) {
    const d = new Date(timestamp * 1000);
    let day = d.getDate().toString().padStart(2, "0");
    let month = (d.getMonth() + 1).toString().padStart(2, "0");
    let year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    async function fetchAuctionInfo() {
      if (signer && auctionEngineAddress) {
        try {
          const ae = new ethers.Contract(auctionEngineAddress, AuctionEngineArtifact.abi, signer);
          const token = await ae.token();
          const finalized = await ae.isFinalized();
          const cancelled = await ae.auctionCancelled();
          const biddingEndBN = await ae.biddingEnd();
          const repaymentDueBN = await ae.repaymentDue();
          setAuctionDetails({
            token: token,
            isFinalized: finalized,
            auctionCancelled: cancelled,
            biddingEnd: formatDate(biddingEndBN.toNumber()),
            repaymentDue: formatDate(repaymentDueBN.toNumber())
          });
        } catch (error) {
          console.error("Failed to fetch auction info:", error);
        }
      }
    }
    fetchAuctionInfo();
  }, [signer, auctionEngineAddress]);

  useEffect(() => {
    if (auctionAddress && (!currentAuction || currentAuction.auctionEngineAddress !== auctionAddress)) {
      const foundAuction = deployedAuctions.find(a => a.auctionEngineAddress === auctionAddress);
      if (foundAuction) {
        selectAuction(foundAuction);
      }
    }
  }, [auctionAddress, currentAuction, deployedAuctions, selectAuction]);

  const handleBidCollateralAmountChange = (index, newVal) => {
    setBidCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index].amount = newVal;
      return updated;
    });
  };

  const handleLiquidationCollateralAmountChange = (index, newVal) => {
    setLiquidationCollateralSelections((prev) => {
      const updated = [...prev];
      updated[index].amount = newVal;
      return updated;
    });
  };

  return (
    <div className="auction-page-outer" style={auctionPageOuterStyle}>
      <h2 style={{auctionTitleStyle, fontSize: useIsMobile() ? "0.8rem":"1.8rem" }}>Auction: "{auctionAddress}"</h2>
      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "#f9f9f9" ,width: useIsMobile() ? "90%":"100%"  }}>
        <p><strong>Auction Token:</strong> {auctionDetails.token ? <TokenDisplay address={auctionDetails.token} /> : "N/A"}</p>
        <p>
          <strong>Status:</strong>{" "}
          {auctionDetails.auctionCancelled ? "Cancelled" : auctionDetails.isFinalized ? "Finalized" : "Active"}
        </p>
        <p><strong>Bidding Deadline:</strong> {auctionDetails.biddingEnd || "N/A"}</p>
        <p><strong>Repayment Due:</strong> {auctionDetails.repaymentDue || "N/A"}</p>
      </div>
      <div style={{  width: useIsMobile() ? "100%":"100%" }}>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Place a Bid</h3>
          <label style={labelStyle}>Bid Amount:</label>
          <input
            type="text"
            placeholder="Enter bid amount"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Bid Rate:</label>
          <input
            type="text"
            placeholder="Enter bid rate"
            value={bidRate}
            onChange={(e) => setBidRate(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#555" }}>
            Collateral for Bid:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f1f1f1" }}>
                <th style={{ padding: "0.5rem", fontWeight: 600 }}>Token</th>
                <th style={{ padding: "0.5rem", fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bidCollateralSelections.map((coll, idx) => (
                <tr key={`${coll.address}-${idx}`}>
                  <td style={tdStyle}><TokenDisplay address={coll.address} /></td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      placeholder="0"
                      style={{ ...inputStyle, marginBottom: 0 }}
                      className="responsive-input"
                      value={coll.amount}
                      onChange={(e) => handleBidCollateralAmountChange(idx, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={buttonStyleBid} className="responsive-button" onClick={placeBid}>
            Submit
          </button>
        </div>
      </div>
      <div className="three-column-grid" style={{...threeColumnGridStyle,width: useIsMobile() ? "100%":"100%"}}>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Place an Offer</h3>
          <label style={labelStyle}>Offer Amount:</label>
          <input
            type="text"
            placeholder="Enter offer amount"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <label style={labelStyle}>Offer Rate:</label>
          <input
            type="text"
            placeholder="Enter offer rate"
            value={offerRate}
            onChange={(e) => setOfferRate(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <button style={buttonStyleBid} className="responsive-button" onClick={placeOffer}>
            Submit
          </button>
        </div>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Repay Loan</h3>
          <label style={labelStyle}>Repay Amount:</label>
          <input
            type="text"
            placeholder="Enter repay amount"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <button style={buttonStyleBid} className="responsive-button" onClick={repay}>
            Repay
          </button>
        </div>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Check Owed</h3>
          <button style={{ ...buttonStyleBid, marginBottom: "0.7rem" }} className="responsive-button" onClick={checkOwed}>
            Check
          </button>
          {owedAmount && (
            <p style={{ marginTop: "0.5rem", fontSize: "1rem" }}>
              You owe: <strong>{owedAmount}</strong>
            </p>
          )}
        </div>
      </div>
      <div style={{ width: useIsMobile() ? "100%":"100%"}}>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Liquidate Borrower</h3>
          <label style={labelStyle}>Borrower Address:</label>
          <input
            type="text"
            placeholder="0x..."
            value={liquidationBorrower}
            onChange={(e) => setLiquidationBorrower(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", fontWeight: 600, color: "#555" }}>
            Coverage amounts for each collateral:
          </p>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f1f1f1" }}>
                <th style={{ padding: "0.5rem", fontWeight: 600 }}>Collateral Token</th>
                <th style={{ padding: "0.5rem", fontWeight: 600 }}>Coverage Amount</th>
              </tr>
            </thead>
            <tbody>
              {liquidationCollateralSelections.map((coll, idx) => (
                <tr key={`${coll.address}-${idx}`}>
                  <td style={tdStyle}><TokenDisplay address={coll.address} /></td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      placeholder="0"
                      style={{ ...inputStyle, marginBottom: 0 }}
                      className="responsive-input"
                      value={coll.amount}
                      onChange={(e) => handleLiquidationCollateralAmountChange(idx, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={buttonStyleBid} className="responsive-button" onClick={liquidate}>
            Liquidate
          </button>
        </div>
      </div >
      <div style={{ width: useIsMobile() ? "100%":"100%"}}>
        <div style={proSectionCardStyle}>
          <h3 style={{ marginBottom: "1rem", color: "#9B3DFF" }}>Redeem Auction Tokens</h3>
          <label style={labelStyle}>Redemption Amount:</label>
          <input
            type="text"
            placeholder="Enter redemption amount"
            value={redemptionAmount}
            onChange={(e) => setRedemptionAmount(e.target.value)}
            style={inputStyle}
            className="responsive-input"
          />
          <button style={buttonStyleBid} className="responsive-button" onClick={redeemToken}>
            Redeem Tokens
          </button>
        </div>
      </div>
     </div>
  );
}
function App() {
  return (
    <>
      <style>{globalBgCss}</style>
      <style>{mobileCss}</style>

      <AppProvider>
        <Router>
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