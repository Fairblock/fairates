import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { getLatestAuctionActivity } from "../utils/firebase";
import { upsertAuctionListMetaFromDetail } from "../utils/auctionListMetaCache.js";
import { displaySymbol, getTokenLogoPath } from "../utils/symbolDisplay";
import { FONT_FAMILY, ARBITRUM_SEPOLIA, DEFAULT_COLLATERAL } from "../styles.js";
import AuctionEngineArtifact from "../AuctionEngine.json";
import BidManagerArtifact from "../BidManager.json";
import OfferManagerArtifact from "../OfferManager.json";

const LIGHT_BLUE = "#E4F5FF";
const ACCENT_BLUE = "#00A3FF";
const ERC20_META_ABI = ["function symbol() view returns (string)", "function decimals() view returns (uint8)"];

const INITIAL_AUCTION_META = {
  phase: "-",
  status: "-",
  decBids: 0,
  decOffers: 0,
  biddingEnd: 0,
  revealEnd: 0,
  repaymentDue: 0,
  bids: 0,
  offers: 0,
  minBid: "-",
  maxBid: "-",
  minOffer: "-",
  maxOffer: "-",
  loading: true,
  activityItems: [],
  userHasBid: false,
  userHasOffer: false,
  assetLabel: "-",
  collateralLabel: "-",
  isFinalized: false,
  isBiddingOver: false,
  clearingRate: "-",
  totalVolume: "-",
  userBidAllocation: "0",
  userOfferAllocation: "0",
  userOwedAmount: "0",
};

export function UserAuctionPage() {
  const { auctionAddress } = useParams();
  const {
    auctionEngineAddress,
    deployedAuctions,
    selectAuction,
    availableCollaterals,
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
    bidCollateralSelections,
    setBidCollateralSelections,
    signer,
    removeBid,
    removeOffer,
    bidManagerAddress,
    offerManagerAddress,
    walletAddress,
    repay,
    repayAmount,
    setRepayAmount,
    owedAmount,
    redeemToken,
    redemptionAmount,
    setRedemptionAmount,
    externalLockCollateral,
    extraCollateralSelections,
    setExtraCollateralSelections,
    externalUnlockCollateral,
    removeCollateralSelections,
    setRemoveCollateralSelections,
    currentAuction,
    collateralManagerAddress,
  } = useAppContext();

  // When opening via direct URL, ensure the auction from route is selected
  useEffect(() => {
    if (!auctionAddress || !deployedAuctions.length) return;
    const wanted = auctionAddress.toLowerCase();
    if (auctionEngineAddress && auctionEngineAddress.toLowerCase() === wanted) return;
    const found = deployedAuctions.find(
      (a) => a.auctionEngineAddress && a.auctionEngineAddress.toLowerCase() === wanted
    );
    if (found) selectAuction(found);
  }, [auctionAddress, deployedAuctions, auctionEngineAddress, selectAuction]);

  const [activeTab, setActiveTab] = useState("borrow"); // "borrow" | "supply"
  const [manageTab, setManageTab] = useState("offers"); // "offers" | "bids"
  const [collateralTab, setCollateralTab] = useState("lock"); // "lock" | "unlock"
  const [auctionMeta, setAuctionMeta] = useState(() => ({ ...INITIAL_AUCTION_META }));

  // Same route component instance is reused when only :auctionAddress changes; reset UI state
  // so we don't keep loading:false and stale rows from the previous auction.
  useEffect(() => {
    if (!auctionAddress) return;
    setAuctionMeta({ ...INITIAL_AUCTION_META });
  }, [auctionAddress]);

  const [collateralSymbolsByAddress, setCollateralSymbolsByAddress] = useState({});

  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("user-auction-page-active");

    const updateHeaderHeight = () => {
      const header = document.querySelector("nav");
      if (header) setHeaderHeight(header.offsetHeight);
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      document.body.classList.remove("user-auction-page-active");
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (availableCollaterals.length > 0) {
      if (extraCollateralSelections.length === 0) {
        setExtraCollateralSelections(
          availableCollaterals.map((c) => ({ address: c.address, amount: "" }))
        );
      }
      if (removeCollateralSelections.length === 0) {
        setRemoveCollateralSelections(
          availableCollaterals.map((c) => ({ address: c.address, amount: "" }))
        );
      }
    }
  }, [availableCollaterals]);

  const resetParticipationFields = () => {
    setBidAmount("");
    setBidRate("");
    setOfferAmount("");
    setOfferRate("");
    setBidCollateralSelections((prev) => {
      if (prev.length > 0) {
        return prev.map((c) => ({ ...c, amount: "" }));
      }
      if (availableCollaterals.length > 0) {
        return availableCollaterals.map((c) => ({
          address: c.address,
          amount: "",
        }));
      }
      return [{ address: DEFAULT_COLLATERAL, amount: "" }];
    });
  };

  // Reset inputs whenever the active auction changes
  useEffect(() => {
    if (!auctionEngineAddress) return;
    resetParticipationFields();
  }, [auctionEngineAddress]);

  // Load auction details and activity
  const auctionDetailsInitialLoadDoneRef = useRef(false);
  const lastAuctionDetailsScopeRef = useRef("");
  const loadDetailsInFlightRef = useRef(false);

  useEffect(() => {
    const scope = `${(auctionAddress || "").toLowerCase()}|${(
      auctionEngineAddress || ""
    ).toLowerCase()}`;
    if (lastAuctionDetailsScopeRef.current !== scope) {
      lastAuctionDetailsScopeRef.current = scope;
      auctionDetailsInitialLoadDoneRef.current = false;
    }

    let effectCancelled = false;

    async function loadDetails() {
      if (effectCancelled || loadDetailsInFlightRef.current) return;
      loadDetailsInFlightRef.current = true;

      try {
        const wanted = auctionAddress?.toLowerCase();
        const engine = auctionEngineAddress?.toLowerCase();

        if (!auctionEngineAddress || !bidManagerAddress || !offerManagerAddress) {
          if (!effectCancelled) {
            setAuctionMeta((prev) => ({ ...prev, loading: true }));
          }
          return;
        }

        // Context updates from selectAuction apply on the next render; avoid fetching the wrong auction
        // or finishing with loading:false while placeholders are still shown.
        if (!wanted || engine !== wanted) {
          if (!effectCancelled) {
            setAuctionMeta((prev) => ({ ...prev, loading: true }));
          }
          return;
        }

        try {
        // Periodic refresh (10s interval) should update data without the full-page loader.
        if (!auctionDetailsInitialLoadDoneRef.current) {
          if (!effectCancelled) {
            setAuctionMeta((prev) => ({ ...prev, loading: true }));
          }
        }

        const provider =
          signer?.provider ??
          new ethers.providers.JsonRpcProvider(ARBITRUM_SEPOLIA.rpcUrls[0]);

        const ae = new ethers.Contract(
          auctionEngineAddress,
          AuctionEngineArtifact.abi,
          provider
        );
        const bm = new ethers.Contract(
          bidManagerAddress,
          BidManagerArtifact.abi,
          provider
        );
        const om = new ethers.Contract(
          offerManagerAddress,
          OfferManagerArtifact.abi,
          provider
        );

        const phaseTxt = ["Bidding", "Reveal", "Loan‑Window", "Repayment", "Redemption"][
          await ae.getAuctionPhase()
        ];

        const [
          biddingStart,
          biddingEnd,
          revealEnd,
          repaymentDue,
          bidsArr,
          offersArr,
          auctionCancelled,
          finalized,
          maxBid,
          minBid,
          maxOffer,
          minOffer,
          bidsDec,
          offersDec,
          auctionTokenAddress,
          repaymentTokenAddress,
        ] = await Promise.all([
          ae.biddingStart(),
          ae.biddingEnd(),
          ae.revealEnd(),
          ae.repaymentDue(),
          bm.getBids(),
          om.getOffers(),
          ae.auctionCancelled(),
          ae.isFinalized(),
          bm.maxBidAmount(),
          bm.minimumBidAmount(),
          om.maxOfferAmount(),
          om.minimumOfferAmount(),
          ae.bidsDecrypted(),
          ae.offersDecrypted(),
          ae.auctionToken(),
          ae.repaymentToken(),
        ]);

        const statusTxt = auctionCancelled
          ? "Cancelled"
          : finalized
            ? "Finalized"
            : phaseTxt;
        const isBiddingOver = phaseTxt !== "Bidding" || auctionCancelled;

        let clearingRate = "-";
        let totalVolume = "-";
        let revealedBids = [];
        let revealedOffers = [];
        let userBidAllocation = "0";
        let userOfferAllocation = "0";
        let userOwedAmount = "0";

        if (finalized) {
          try {
            let tokenDec = 18;
            try {
              const rc = new ethers.Contract(repaymentTokenAddress, ERC20_META_ABI, provider);
              tokenDec = await rc.decimals();
            } catch {}

            const [clearingRateBN, volumeBN, bidRevLen, offerRevLen] = await Promise.all([
              ae.auctionClearingRate(),
              ae.auctionVolume(),
              ae.bidsRevealedLength(),
              ae.offersRevealedLength(),
            ]);

            clearingRate = (clearingRateBN / 1e18).toString();
            totalVolume = ethers.utils.formatUnits(volumeBN, tokenDec);

            const bidRevCount = bidRevLen.toNumber();
            const bidPromises = [];
            for (let i = 0; i < bidRevCount; i++) bidPromises.push(ae.bidsRevealed(i));
            const bidResults = await Promise.all(bidPromises);
            revealedBids = bidResults.map(([bidder, quantity, rate]) => ({
              bidder,
              quantity: ethers.utils.formatUnits(quantity, tokenDec),
              rate: (rate / 1e18).toString(),
            }));

            const offerRevCount = offerRevLen.toNumber();
            const offerPromises = [];
            for (let i = 0; i < offerRevCount; i++) offerPromises.push(ae.offersRevealed(i));
            const offerResults = await Promise.all(offerPromises);
            revealedOffers = offerResults.map(([offerer, quantity, rate]) => ({
              offerer,
              quantity: ethers.utils.formatUnits(quantity, tokenDec),
              rate: (rate / 1e18).toString(),
            }));

            if (walletAddress) {
              const [bidAlloc, offerAlloc, owed] = await Promise.all([
                ae.finalBidAllocation(walletAddress),
                ae.finalOfferAllocation(walletAddress),
                ae.repayments(walletAddress),
              ]);
              userBidAllocation = ethers.utils.formatUnits(bidAlloc, tokenDec);
              userOfferAllocation = ethers.utils.formatUnits(offerAlloc, tokenDec);
              userOwedAmount = ethers.utils.formatUnits(owed, tokenDec);
            }
          } catch (finErr) {
            console.error("Failed to load finalized data:", finErr);
          }
        }

        let latestActivity = [];

        if (finalized && (revealedBids.length > 0 || revealedOffers.length > 0)) {
          revealedBids.forEach((b) => {
            latestActivity.push({
              type: "bid",
              wallet: b.bidder,
              amount: b.quantity,
              rate: b.rate,
            });
          });
          revealedOffers.forEach((o) => {
            latestActivity.push({
              type: "offer",
              wallet: o.offerer,
              amount: o.quantity,
              rate: o.rate,
            });
          });
        } else {
          const fallbackActivity = [];
          (bidsArr || []).forEach((b) => {
            const submitter = b.submitter || "-";
            fallbackActivity.push({
              type: "bid",
              wallet: submitter,
              bid: "Encrypted",
              maxPrice: "Encrypted",
              time: "–",
            });
          });
          (offersArr || []).forEach((o) => {
            const submitter = o.submitter || "-";
            fallbackActivity.push({
              type: "offer",
              wallet: submitter,
              bid: "Encrypted",
              maxPrice: "Encrypted",
              time: "–",
            });
          });

          latestActivity = [...fallbackActivity];
          try {
            const activityDocs = await getLatestAuctionActivity(auctionEngineAddress, 10);

            if (activityDocs.length > 0 && fallbackActivity.length === 0) {
              latestActivity = activityDocs.map((entry) => ({
                type: entry.type,
                wallet: entry.wallet,
                bid: "Encrypted",
                maxPrice: "Encrypted",
                time: relativeTimeFromDate(entry.createdAt),
                txHash: entry.txHash,
              }));
            } else if (activityDocs.length > 0 && fallbackActivity.length > 0) {
              const byWalletType = new Map();
              activityDocs.forEach((entry) => {
                const key = `${(entry.wallet || "").toLowerCase()}:${entry.type || "bid"}`;
                if (!byWalletType.has(key)) byWalletType.set(key, entry);
              });

              latestActivity = fallbackActivity.map((item) => {
                const key = `${(item.wallet || "").toLowerCase()}:${item.type}`;
                const match = byWalletType.get(key);
                const createdAt = match?.createdAt;
                return {
                  ...item,
                  time: createdAt ? relativeTimeFromDate(createdAt) : item.time,
                  txHash: match?.txHash || item.txHash,
                };
              });
            }
          } catch (activityErr) {
            console.error("Failed to load activity from Firestore:", activityErr);
          }
        }

        if (latestActivity.length > 10) {
          latestActivity = latestActivity.slice(0, 10);
        }

        let userHasBid = false;
        let userHasOffer = false;
        if (walletAddress) {
          const w = walletAddress.toLowerCase();
          try {
            const bidIdx = await bm.bidSubmitted(walletAddress);
            userHasBid = bidIdx && !bidIdx.isZero();
          } catch (_) {}
          userHasOffer = (offersArr || []).some(
            (o) => o.submitter && o.submitter.toLowerCase() === w
          );
          if (finalized) {
            if (!userHasBid) {
              userHasBid = revealedBids.some((b) => (b.bidder || "").toLowerCase() === w);
            }
            if (!userHasOffer) {
              userHasOffer = revealedOffers.some((o) => (o.offerer || "").toLowerCase() === w);
            }
          }
        }

        const erc20For = (addr) =>
          new ethers.Contract(addr, ERC20_META_ABI, provider);

        const safeSymbol = async (addr) => {
          if (!addr) return "–";
          try {
            const c = erc20For(addr);
            const sym = await c.symbol();
            return displaySymbol(sym) || `${addr.slice(0, 6)}…${addr.slice(-4)}`;
          } catch {
            return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
          }
        };

        const [auctionSymbol, repaymentSymbol] = await Promise.all([
          safeSymbol(auctionTokenAddress),
          safeSymbol(repaymentTokenAddress),
        ]);

        const pairLabel = repaymentSymbol;

        const collateralAddresses =
          (availableCollaterals || []).map((c) => c.address).filter(Boolean);
        let collateralLabel = "–";
        let collateralSymbolsForListCache = [];
        if (collateralAddresses.length > 0) {
          const collSymbols = await Promise.all(
            collateralAddresses.map(safeSymbol)
          );
          collateralSymbolsForListCache = collSymbols;

          const symbolMap = {};
          collateralAddresses.forEach((addr, idx) => {
            if (addr) {
              symbolMap[addr.toLowerCase()] = collSymbols[idx];
            }
          });
          if (!effectCancelled) {
            setCollateralSymbolsByAddress(symbolMap);
          }

          if (collSymbols.length === 1) {
            collateralLabel = collSymbols[0];
          } else if (collSymbols.length === 2) {
            collateralLabel = `${collSymbols[0]}, ${collSymbols[1]}`;
          } else {
            collateralLabel = `${collSymbols[0]}, ${collSymbols[1]} +${
              collSymbols.length - 2
            } more`;
          }
        }

        if (!effectCancelled) {
          upsertAuctionListMetaFromDetail(auctionEngineAddress.toLowerCase(), {
            biddingStart: biddingStart.toNumber(),
            biddingEnd: biddingEnd.toNumber(),
            revealEnd: revealEnd.toNumber(),
            repaymentDue: repaymentDue.toNumber(),
            repaymentSymbol: pairLabel,
            collateralSymbols: collateralSymbolsForListCache,
            isFinalized: !!finalized,
          });
          setAuctionMeta({
            status: statusTxt,
            phase: phaseTxt,
            biddingEnd: biddingEnd.toNumber(),
            revealEnd: revealEnd.toNumber(),
            repaymentDue: repaymentDue.toNumber(),
            bids: bidsArr.length,
            offers: offersArr.length,
            maxBid: ethers.utils.formatUnits(maxBid, 18),
            minBid: ethers.utils.formatUnits(minBid, 18),
            maxOffer: ethers.utils.formatUnits(maxOffer, 18),
            minOffer: ethers.utils.formatUnits(minOffer, 18),
            decBids: finalized ? Number(bidsDec) : 0,
            decOffers: finalized ? Number(offersDec) : 0,
            activityItems: latestActivity,
            userHasBid,
            userHasOffer,
            loading: false,
            assetLabel: pairLabel,
            collateralLabel,
            isFinalized: !!finalized,
            isBiddingOver,
            clearingRate,
            totalVolume,
            userBidAllocation,
            userOfferAllocation,
            userOwedAmount,
          });
          auctionDetailsInitialLoadDoneRef.current = true;
        }
      } catch (err) {
        console.error("loadDetails:", err);
        if (!effectCancelled) {
          setAuctionMeta((prev) => ({ ...prev, loading: false }));
        }
      }
      } finally {
        loadDetailsInFlightRef.current = false;
      }
    }

    loadDetails();
    const interval = setInterval(loadDetails, 10000);
    return () => {
      effectCancelled = true;
      clearInterval(interval);
    };
  }, [
    auctionAddress,
    auctionEngineAddress,
    bidManagerAddress,
    offerManagerAddress,
    signer,
    walletAddress,
    availableCollaterals,
  ]);

  const updateBidCollat = (i, v) =>
    setBidCollateralSelections((prev) => {
      const c = [...prev];
      c[i].amount = v;
      return c;
    });

  const ts = (s) => (!s ? "–" : new Date(s * 1000).toLocaleString());

  const formatDateShort = (s) => {
    if (!s) return "–";
    const d = new Date(s * 1000);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const relativeTimeFromDate = (date) => {
    if (!date) return "–";
    const now = Date.now();
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    if (Number.isNaN(t)) return "–";
    const diffSeconds = Math.max(0, Math.floor((now - t) / 1000));

    if (diffSeconds < 60) return "Just now";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };
  const formatWallet = (addr) =>
    !addr || addr === "-"
      ? "–"
      : `${addr.slice(0, 6)}....${addr.slice(-4)}`;

  const isWalletConnected = !!signer;

  const auctionTimeline =
    auctionMeta.biddingEnd || auctionMeta.revealEnd
      ? (
          <>
            Bidding: {formatDateShort(auctionMeta.biddingEnd)}
            <br />
            Reveal: {formatDateShort(auctionMeta.revealEnd)}
          </>
        )
      : "–";
  const loanTerm = auctionMeta.repaymentDue
    ? `Repayment due ${formatDateShort(auctionMeta.repaymentDue)}`
    : "–";
  const maturityDate = auctionMeta.repaymentDue
    ? formatDateShort(auctionMeta.repaymentDue)
    : "–";
  const collateralPrimarySymbol = (auctionMeta.collateralLabel || "")
    .split(",")[0]
    .trim();
  const collateralLogoPath = collateralPrimarySymbol
    ? getTokenLogoPath(collateralPrimarySymbol)
    : null;

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'Charter';
            src: url('/fonts/charter_regular.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'Charter';
            src: url('/fonts/charter_bold.woff2') format('woff2');
            font-weight: 700;
            font-style: normal;
          }
          @font-face {
            font-family: 'SF Pro Display';
            src: url('/fonts/SFPRODISPLAYREGULAR.OTF') format('opentype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'SF Pro Display';
            src: url('/fonts/SFPRODISPLAYMEDIUM.OTF') format('opentype');
            font-weight: 500;
            font-style: normal;
          }
          @font-face {
            font-family: 'SF Pro Display';
            src: url('/fonts/SFPRODISPLAYBOLD.OTF') format('opentype');
            font-weight: 700;
            font-style: normal;
          }
          body.user-auction-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
          .user-auction-page-root {
            background-color: #FFFFFF;
          }
          .participation-tab:hover { background-color: #F5F5F5; }
          .participation-tab.active { background-color: ${LIGHT_BLUE}; color: ${ACCENT_BLUE}; }
          .input-field {
            background-color: #F9F9F9;
            border: none;
          }
          .input-field:focus {
            background-color: #F9F9F9;
            border: none;
            box-shadow: none;
          }
          .action-button:hover { background-color: ${ACCENT_BLUE}; color: #FFFFFF; }
          .action-button:disabled { opacity: 0.5; cursor: not-allowed; }
          @media (max-width: 900px) {
            .participation-grid { grid-template-columns: 1fr !important; }
          }
          .auction-loading-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(4px);
            z-index: 10;
          }
          .auction-loading-loader {
            height: 110px;
            aspect-ratio: 1;
            display: grid;
          }
          .auction-loading-loader::before,
          .auction-loading-loader::after {
            content: "";
            --c: no-repeat linear-gradient(${ACCENT_BLUE} 0 0);
            background: var(--c), var(--c);
            background-size: 25% 50%;
            animation: auction-loader-l5 1.5s infinite linear;
          }
          .auction-loading-loader::after {
            transform: scale(-1);
          }
          @keyframes auction-loader-l5 {
            0%,
            5%   {background-position:33.4% 100%,66.6% 100%}
            25%  {background-position:33.4% 100%,100% 0}
            50%  {background-position:0 0,100% 0}
            75%  {background-position:0 0,66.6% 100%}
            95%,
            100% {background-position:33.4% 100%,66.6% 100%}
          }
          .latest-activity-scroll {
            max-height: 220px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: ${ACCENT_BLUE} transparent;
          }
          .latest-activity-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .latest-activity-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .latest-activity-scroll::-webkit-scrollbar-thumb {
            background-color: ${ACCENT_BLUE};
            border-radius: 999px;
          }
          @media (max-height: 850px) {
            .user-auction-page-root-main {
              padding: 16px 20px !important;
            }
            .user-auction-top-summary {
              padding: 12px 16px !important;
              margin-bottom: 16px !important;
            }
            .user-auction-asset-row {
              margin-bottom: 18px !important;
            }
            .user-auction-participation-layout {
              gap: 20px !important;
            }
            .user-auction-manage-row {
              margin-top: 14px !important;
              padding: 10px 14px !important;
            }
            .latest-activity-scroll {
              max-height: 160px;
            }
          }
        `}
      </style>
      <div
        className="user-auction-page-root"
        style={{
          minHeight: `calc(100vh - ${headerHeight}px)`,
          backgroundColor: "#FFFFFF",
          position: "relative",
          padding: 0,
        }}
      >
        {auctionMeta.loading && (
          <div className="auction-loading-overlay">
            <div className="auction-loading-loader" />
          </div>
        )}
        <div
          className="user-auction-page-root-main"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 32px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top info section — Borrow/Supply Token, Auction Timeline, Loan Term, Maturity Date, Collateral Asset */}
          <div
            className="user-auction-top-summary"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
              padding: "20px 24px",
              backgroundColor: "#FAFAFA",
              borderRadius: "12px",
            }}
          >
            <InfoCell label="Token" value={auctionMeta.assetLabel} />
            <InfoCell label="Auction Timeline" value={auctionTimeline} />
            <InfoCell label="Loan Term" value={loanTerm} />
            <InfoCell label="Maturity Date" value={maturityDate} />
            <InfoCell
              label="Collateral Asset"
              value={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {collateralLogoPath && (
                    <img
                      src={collateralLogoPath}
                      alt={collateralPrimarySymbol || ""}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <span>{auctionMeta.collateralLabel || "–"}</span>
                </span>
              }
            />
          </div>

          {/* Asset row: icon + name, then Borrow Limit, Supply Limit, Active Borrows, Active Supplies */}
          <div
            className="user-auction-asset-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {getTokenLogoPath(auctionMeta.assetLabel) ? (
                <img
                  src={getTokenLogoPath(auctionMeta.assetLabel)}
                  alt={auctionMeta.assetLabel || ""}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #E4F5FF 0%, #B3E0FF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  $
                </div>
              )}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#000",
                  fontFamily: FONT_FAMILY,
                }}
              >
                {auctionMeta.assetLabel}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                marginLeft: "auto",
              }}
            >
              <InfoCell label="Borrow Limit" value={`${auctionMeta.minBid} – ${auctionMeta.maxBid}`} />
              <InfoCell label="Supply Limit" value={`${auctionMeta.minOffer} – ${auctionMeta.maxOffer}`} />
              <InfoCell label="Active Borrows" value={String(auctionMeta.bids)} />
              <InfoCell label="Active Supplies" value={String(auctionMeta.offers)} />
            </div>
          </div>

          {/* Two columns: left = Supply/Borrow + form, right = Latest Activity */}
          <div
            className="participation-grid user-auction-participation-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {/* Left: Participation / Post-Auction Actions */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "none",
              }}
            >
              {auctionMeta.isBiddingOver ? (
                auctionMeta.isFinalized ? (
                  isWalletConnected && parseFloat(auctionMeta.userBidAllocation) > 0 ? (
                    /* Allocated bidder: results + repay + manage collateral */
                    <>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#000", marginBottom: 16, fontFamily: FONT_FAMILY }}>
                        Auction Results
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        <InfoCell label="Clearing Rate" value={`${auctionMeta.clearingRate}%`} />
                        <InfoCell label="Your Allocation" value={auctionMeta.userBidAllocation} />
                        <InfoCell label="Amount Owed" value={auctionMeta.userOwedAmount} />
                        <InfoCell label="Total Volume" value={auctionMeta.totalVolume} />
                      </div>

                      <div style={{ borderTop: "1px solid #eee", paddingTop: 20, marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 12, fontFamily: FONT_FAMILY }}>
                          Repay Loan
                        </h4>
                        <Label>Repayment Amount</Label>
                        <input
                          className="input-field"
                          style={inputStyle}
                          value={repayAmount}
                          onChange={(e) => setRepayAmount(e.target.value)}
                          placeholder="0"
                        />
                        <button
                          className="action-button"
                          style={{ ...primaryBtnStyle, width: "100%", padding: "14px 24px" }}
                          onClick={repay}
                        >
                          Repay
                        </button>
                      </div>

                      <div style={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 12, fontFamily: FONT_FAMILY }}>
                          Manage Collateral
                        </h4>
                        <div style={{ display: "flex", gap: "8px", marginBottom: 16 }}>
                          {[
                            { id: "lock", label: "Lock More" },
                            { id: "unlock", label: "Unlock Excess" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setCollateralTab(tab.id)}
                              className={`participation-tab ${collateralTab === tab.id ? "active" : ""}`}
                              style={{
                                padding: "8px 16px",
                                fontSize: 13,
                                fontWeight: 500,
                                color: collateralTab === tab.id ? ACCENT_BLUE : "#666",
                                background: collateralTab === tab.id ? LIGHT_BLUE : "transparent",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontFamily: FONT_FAMILY,
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {collateralTab === "lock" && (
                          <>
                            {extraCollateralSelections.map((c, i) => (
                              <div key={c.address} style={{ marginBottom: 8 }}>
                                  <input
                                    className="input-field"
                                    style={inputStyle}
                                    value={c.amount}
                                    onChange={(e) => {
                                      const updated = [...extraCollateralSelections];
                                      updated[i] = { ...updated[i], amount: e.target.value };
                                      setExtraCollateralSelections(updated);
                                    }}
                                    placeholder="Amount to lock"
                                  />
                                </div>
                            ))}
                            <button
                              className="action-button"
                              style={{ ...primaryBtnStyle, width: "100%", padding: "12px 24px" }}
                              onClick={externalLockCollateral}
                              disabled={extraCollateralSelections.length === 0}
                            >
                              Lock Collateral
                            </button>
                          </>
                        )}

                        {collateralTab === "unlock" && (
                          <>
                            {removeCollateralSelections.map((c, i) => (
                              <div key={c.address} style={{ marginBottom: 8 }}>
                                  <input
                                    className="input-field"
                                    style={inputStyle}
                                    value={c.amount}
                                    onChange={(e) => {
                                      const updated = [...removeCollateralSelections];
                                      updated[i] = { ...updated[i], amount: e.target.value };
                                      setRemoveCollateralSelections(updated);
                                    }}
                                    placeholder="Amount to unlock"
                                  />
                                </div>
                            ))}
                            <button
                              className="action-button"
                              style={{ ...primaryBtnStyle, width: "100%", padding: "12px 24px" }}
                              onClick={externalUnlockCollateral}
                              disabled={removeCollateralSelections.length === 0}
                            >
                              Unlock Collateral
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : isWalletConnected && parseFloat(auctionMeta.userOfferAllocation) > 0 ? (
                    /* Allocated offerer: results + redeem */
                    <>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#000", marginBottom: 16, fontFamily: FONT_FAMILY }}>
                        Auction Results
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        <InfoCell label="Clearing Rate" value={`${auctionMeta.clearingRate}%`} />
                        <InfoCell label="Your Allocation" value={auctionMeta.userOfferAllocation} />
                        <InfoCell label="Total Volume" value={auctionMeta.totalVolume} />
                      </div>

                      <div style={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 12, fontFamily: FONT_FAMILY }}>
                          Redeem Auction Token
                        </h4>
                        <Label>Redemption Amount</Label>
                        <input
                          className="input-field"
                          style={inputStyle}
                          value={redemptionAmount}
                          onChange={(e) => setRedemptionAmount(e.target.value)}
                          placeholder="0"
                        />
                        <button
                          className="action-button"
                          style={{ ...primaryBtnStyle, width: "100%", padding: "14px 24px" }}
                          onClick={redeemToken}
                        >
                          Redeem
                        </button>
                      </div>
                    </>
                  ) : (
                    /* No wallet or no allocation: results summary */
                    <>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#000", marginBottom: 16, fontFamily: FONT_FAMILY }}>
                        Auction Results
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        <InfoCell label="Clearing Interest Rate" value={`${auctionMeta.clearingRate}%`} />
                        <InfoCell label="Total Allocated Volume" value={auctionMeta.totalVolume} />
                      </div>
                      <div style={{ padding: "16px 0", fontSize: 14, color: "#666", fontFamily: FONT_FAMILY, lineHeight: 1.6 }}>
                        {auctionMeta.loading
                          ? "Final results are loading. Please wait a moment…"
                          : !isWalletConnected
                            ? "Connect your wallet to see your allocation details."
                            : auctionMeta.userHasBid || auctionMeta.userHasOffer
                              ? "You may not have received an allocation, or results are still syncing. Refresh if this looks wrong."
                              : "You did not participate in this auction."}
                      </div>
                    </>
                  )
                ) : (
                  /* Bidding over but not finalized: waiting message */
                  <div style={{ textAlign: "center", padding: "40px 24px" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#000", marginBottom: 8, fontFamily: FONT_FAMILY }}>
                      Auction Has Ended
                    </h3>
                    <p style={{ fontSize: 14, color: "#666", fontFamily: FONT_FAMILY, lineHeight: 1.6, margin: 0 }}>
                      The bidding period is over. Please wait while the auction results are being finalized.
                    </p>
                  </div>
                )
              ) : (
                /* Active bidding phase: Supply / Borrow tabs + form */
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "24px",
                    }}
                  >
                    {[
                      { id: "supply", label: "Supply" },
                      { id: "borrow", label: "Borrow" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          resetParticipationFields();
                        }}
                        className={`participation-tab ${activeTab === tab.id ? "active" : ""}`}
                        style={{
                          padding: "12px 28px",
                          fontSize: 15,
                          fontWeight: 500,
                          color: activeTab === tab.id ? ACCENT_BLUE : "#666",
                          background: activeTab === tab.id ? LIGHT_BLUE : "transparent",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "borrow" && (
                    <>
                      <Label>Borrow Amount</Label>
                      <div style={{ position: "relative", marginBottom: 18 }}>
                        <input
                          className="input-field"
                          style={{ ...inputStyle, marginBottom: 0 }}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="0"
                          disabled={!isWalletConnected}
                        />
                        <button
                          type="button"
                          onClick={() => setBidAmount(auctionMeta.maxBid !== "-" ? auctionMeta.maxBid : "")}
                          style={{
                            position: "absolute",
                            right: 12,
                            top: 0,
                            bottom: 0,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            color: ACCENT_BLUE,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isWalletConnected ? "pointer" : "default",
                            fontFamily: FONT_FAMILY,
                            padding: 0,
                          }}
                        >
                          Max
                        </button>
                      </div>
                      <Label>Maximum Interest Rate</Label>
                      <input
                        className="input-field"
                        style={inputStyle}
                        value={bidRate}
                        onChange={(e) => setBidRate(e.target.value)}
                        placeholder="0"
                        disabled={!isWalletConnected}
                      />
                      {bidCollateralSelections.length > 0 && (
                        <>
                          <Label>Collateral</Label>
                          <div
                            style={{
                              backgroundColor: "transparent",
                              borderRadius: "10px",
                              border: "none",
                              overflow: "hidden",
                              marginBottom: 18,
                            }}
                          >
                            {bidCollateralSelections.map((c, i) => (
                              <div
                                key={c.address}
                                style={{
                                  padding: 0,
                                  borderBottom:
                                    i < bidCollateralSelections.length - 1
                                      ? "1px solid #E8E8E8"
                                      : "none",
                                }}
                              >
                                <input
                                  className="input-field"
                                  style={{
                                    ...inputStyle,
                                  }}
                                  value={c.amount}
                                  onChange={(e) => updateBidCollat(i, e.target.value)}
                                  placeholder="Collateral amount"
                                  disabled={!isWalletConnected}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <button
                        className="action-button"
                        style={{
                          ...primaryBtnStyle,
                          width: "100%",
                          padding: "14px 24px",
                        }}
                        onClick={placeBid}
                        disabled={!isWalletConnected}
                      >
                        {isWalletConnected ? "Submit Borrow" : "Connect wallet to borrow"}
                      </button>
                    </>
                  )}

                  {activeTab === "supply" && (
                    <>
                      <Label>Supply Amount</Label>
                      <input
                        className="input-field"
                        style={inputStyle}
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder="0"
                        disabled={!isWalletConnected}
                      />
                      <Label>Minimum Interest Rate</Label>
                      <input
                        className="input-field"
                        style={inputStyle}
                        value={offerRate}
                        onChange={(e) => setOfferRate(e.target.value)}
                        placeholder="0"
                        disabled={!isWalletConnected}
                      />
                      <button
                        className="action-button"
                        style={{
                          ...primaryBtnStyle,
                          width: "100%",
                          padding: "14px 24px",
                        }}
                        onClick={placeOffer}
                        disabled={!isWalletConnected}
                      >
                        {isWalletConnected ? "Submit Supply" : "Connect wallet to supply"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Right: Latest Activity */}
            <div
              style={{
                backgroundColor: "#FAFAFA",
                borderRadius: "16px",
                padding: "24px",
                border: "none",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#000",
                  marginBottom: 16,
                  fontFamily: FONT_FAMILY,
                }}
              >
                {auctionMeta.isFinalized ? "Borrows & Supplies" : "Latest Activity"}
              </h3>
              <div className="latest-activity-scroll">
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Wallet</th>
                      <th style={thStyle}>Type</th>
                      {auctionMeta.isFinalized ? (
                        <>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Rate</th>
                        </>
                      ) : (
                        <>
                          <th style={thStyle}>Details</th>
                          <th style={thStyle}>Time</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {auctionMeta.activityItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ ...tdStyle, color: "#999", textAlign: "center" }}>
                          No activity yet
                        </td>
                      </tr>
                    ) : (
                      auctionMeta.activityItems.map((row, i) => {
                        const explorerBase =
                          (ARBITRUM_SEPOLIA.blockExplorerUrls &&
                            ARBITRUM_SEPOLIA.blockExplorerUrls[0]) ||
                          "https://sepolia.arbiscan.io";
                        const cleanBase = explorerBase.replace(/\/+$/, "");
                        const href = row.txHash
                          ? `${cleanBase}/tx/${row.txHash}`
                          : null;

                        return (
                        <tr key={i}>
                          <td style={tdStyle}>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: ACCENT_BLUE, textDecoration: "none" }}
                              >
                                {formatWallet(row.wallet)}
                              </a>
                            ) : (
                              formatWallet(row.wallet)
                            )}
                          </td>
                          <td style={tdStyle}>
                            {row.type === "offer" ? "Supply" : "Borrow"}
                          </td>
                          {auctionMeta.isFinalized ? (
                            <>
                              <td style={tdStyle}>{row.amount}</td>
                              <td style={tdStyle}>{row.rate}%</td>
                            </>
                          ) : (
                            <>
                              <td style={tdStyle}>{row.bid}</td>
                              <td style={tdStyle}>{row.time}</td>
                            </>
                          )}
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Manage Auctions — only shown during active bidding */}
          {!auctionMeta.isBiddingOver && (
            <div
              className="user-auction-manage-row"
              style={{
                marginTop: "20px",
                backgroundColor: "#FAFAFA",
                borderRadius: "14px",
                padding: "14px 20px",
                border: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "24px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#000",
                      margin: 0,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    Manage Auctions
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: 13,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setManageTab("offers")}
                      style={{
                          padding: "6px 10px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: manageTab === "offers" ? "#000" : "#666",
                          backgroundColor:
                            manageTab === "offers" ? LIGHT_BLUE : "transparent",
                          border: "none",
                          borderRadius: 999,
                          cursor: "pointer",
                          fontFamily: FONT_FAMILY,
                        }}
                    >
                      Open Supplies
                    </button>
                    <button
                      type="button"
                      onClick={() => setManageTab("bids")}
                      style={{
                          padding: "6px 10px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: manageTab === "bids" ? "#000" : "#666",
                          backgroundColor:
                            manageTab === "bids" ? LIGHT_BLUE : "transparent",
                          border: "none",
                          borderRadius: 999,
                          cursor: "pointer",
                          fontFamily: FONT_FAMILY,
                        }}
                    >
                      Open Borrows
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#000",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {manageTab === "offers"
                      ? auctionMeta.userHasOffer
                        ? "You have an active supply."
                        : "No open supplies."
                      : auctionMeta.userHasBid
                        ? "You have an active borrow."
                        : "No open borrows."}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      ...primaryBtnStyle,
                      padding: "8px 18px",
                      fontSize: 13,
                    }}
                    disabled={
                      (manageTab === "offers" && !auctionMeta.userHasOffer) ||
                      (manageTab === "bids" && !auctionMeta.userHasBid) ||
                      !isWalletConnected
                    }
                    onClick={() => {
                      setActiveTab(manageTab === "bids" ? "borrow" : "supply");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={{
                      ...primaryBtnStyle,
                      padding: "8px 18px",
                      fontSize: 13,
                    }}
                    disabled={
                      (manageTab === "offers" && !auctionMeta.userHasOffer) ||
                      (manageTab === "bids" && !auctionMeta.userHasBid) ||
                      !isWalletConnected
                    }
                    onClick={() => {
                      if (manageTab === "bids") removeBid();
                      else removeOffer();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCell({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          color: "#999",
          textTransform: "uppercase",
          fontFamily: FONT_FAMILY,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#000",
          wordBreak: "break-word",
          fontFamily: FONT_FAMILY,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Label({ children, style = {} }) {
  return (
    <label
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: "#000",
        marginBottom: 8,
        display: "block",
        fontFamily: FONT_FAMILY,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 15,
  borderRadius: "10px",
  background: "#F9F9F9",
  color: "#000",
  border: "none",
  outline: "none",
  marginBottom: 18,
  fontFamily: FONT_FAMILY,
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  background: LIGHT_BLUE,
  border: "none",
  color: ACCENT_BLUE,
  fontSize: 15,
  fontWeight: 500,
  borderRadius: "10px",
  cursor: "pointer",
  fontFamily: FONT_FAMILY,
  transition: "all 0.2s ease",
};

const secondaryBtnStyle = {
  background: "#F5F5F5",
  border: "1px solid #E0E0E0",
  color: ACCENT_BLUE,
  fontSize: 15,
  fontWeight: 500,
  borderRadius: "10px",
  cursor: "pointer",
  fontFamily: FONT_FAMILY,
  transition: "all 0.2s ease",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  fontFamily: FONT_FAMILY,
  tableLayout: "fixed",
};
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #E0E0E0",
  color: "#666",
  fontWeight: 500,
};
const tdStyle = {
  padding: "10px 12px",
  borderBottom: "1px solid #EEEEEE",
  color: "#000",
  wordBreak: "break-word",
};
