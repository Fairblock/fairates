import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";
import AuctionEngineArtifact from "../AuctionEngine.json";
import BidManagerArtifact from "../BidManager.json";
import OfferManagerArtifact from "../OfferManager.json";

export function UserAuctionPage() {
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
    bidManagerAddress,
    offerManagerAddress,
    signer,
    removeBid,
    removeOffer,
  } = useAppContext();

  const [auctionMeta, setAuctionMeta] = useState({
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
    maxOffer: "-"
  });

  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("user-auction-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("user-auction-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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

  // load auction details every time a dependency changes
  useEffect(() => {
    async function loadDetails() {
      if (!signer ||
          !auctionEngineAddress ||
          !bidManagerAddress ||
          !offerManagerAddress) return;

      try {
        const ae = new ethers.Contract(
          auctionEngineAddress,
          AuctionEngineArtifact.abi,
          signer
        );
        const bm = new ethers.Contract(
          bidManagerAddress,
          BidManagerArtifact.abi,
          signer
        );
        const om = new ethers.Contract(
          offerManagerAddress,
          OfferManagerArtifact.abi,
          signer
        );

        // phase ↦ human string
        const phaseTxt = ["Bidding", "Reveal", "Loan‑Window",
                          "Repayment", "Redemption"]
                         [await ae.getAuctionPhase()];

        const [
          biddingEnd,
          revealEnd,
          repaymentDue,
          bidsArr,
          offersArr,
          cancelled,
          finalized,
          maxBid,
          minBid,
          maxOffer,
          minOffer,
          bidsDec,
          offersDec
        ] = await Promise.all([
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
          ae.offersDecrypted() 
        ]);

        const statusTxt = cancelled
          ? "❌ Cancelled"
          : finalized
            ? "✅ Finalized"
            : `🟢 ${phaseTxt}`;

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
          decOffers: finalized ? Number(offersDec) : 0
        });
      } catch (err) {
        console.error("loadDetails:", err);
      }
    }

    loadDetails();
  }, [
    signer,
    auctionEngineAddress,
    bidManagerAddress,
    offerManagerAddress
  ]);

  const pageContainer = {
    minHeight: "calc(100vh - var(--header-height, 80px))",
    backgroundColor: "#FFFFFF",
    position: "relative",
    padding: "0px 0px 0px",
  };

  const wrapper = { 
    maxWidth: 1140, 
    margin: "0 auto", 
    padding: "32px 32px",
    position: "relative",
    zIndex: 1,
  };
  const section = { marginBottom: 64 };
  const h1 = {
    fontSize: 32,
    fontWeight: 400,
    marginBottom: 6,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const h2 = { 
    fontSize: 21, 
    fontWeight: 400, 
    color: "#000000", 
    marginBottom: 24,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const grid2 = { display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit,minmax(430px,1fr))" };
  const label = { 
    fontSize: 20, 
    fontWeight: 400, 
    color: "#000000", 
    marginBottom: 8, 
    display: "block", 
    textAlign: "left", 
    marginTop: 12,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const input = { 
    width: "90%", 
    padding: "16px 20px", 
    fontSize: 17, 
    borderRadius: 12, 
    background: "#F9F9F9", 
    color: "#000000", 
    border: "none", 
    outline: "none", 
    transition: "box-shadow .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const focusOn = e => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.1)"; };
  const focusOff = e => { e.currentTarget.style.boxShadow = ""; };
  const btn = { 
    background: "#E4F5FF", 
    border: "none", 
    color: "#00A3FF", 
    fontSize: 18, 
    fontWeight: 400, 
    padding: "18px 64px", 
    borderRadius: 14, 
    cursor: "pointer", 
    marginTop: 28, 
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const table = { width: "100%", borderCollapse: "collapse", marginTop: 24 };
  const th = {
    border: "1px solid #E0E0E0",
    padding: 12,
    fontSize: 15,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: 500,
    textAlign: "left",
  };
  const td = { 
    border: "1px solid #E0E0E0", 
    padding: 12, 
    fontSize: 15,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  // White theme info styles
  const infoStyles = {
    wrap: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '48px',
    },
    pill: {
      flex: '1 0 auto',
      minWidth: '160px',
      padding: '14px 18px',
      borderRadius: '14px',
      background: '#F9F9F9',
      border: '1px solid #E0E0E0',
    },
    label: {
      fontSize: '11px',
      letterSpacing: '.06em',
      color: '#666666',
      textTransform: 'uppercase',
      marginBottom: '2px',
      display: 'block',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    value: {
      fontSize: '15px',
      fontWeight: 500,
      color: '#000000',
      wordBreak: 'break-word',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    },
  };

  const patternStyle = {
    position: "fixed",
    right: 0,
    top: `${headerHeight}px`,
    height: `calc(100vh - ${headerHeight}px)`,
    minHeight: `calc(100vh - ${headerHeight}px)`,
    width: "auto",
    objectFit: "cover",
    zIndex: 0,
    pointerEvents: "none",
  };

  const updateBidCollat = (i, v) => setBidCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateLiqCollat = (i, v) => setLiquidationCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateExtraCollat = (i, v) => setExtraCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateRemoveCollat = (i, v) => setRemoveCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  
  const ts = s => !s ? '–' : new Date(s*1000).toLocaleString();
  
  const base = [
    ['Status', auctionMeta.status],
    ['Bid limit', `${auctionMeta.minBid} – ${auctionMeta.maxBid}`],
    ['Offer limit', `${auctionMeta.minOffer} – ${auctionMeta.maxOffer}`],
    ['Bidding ends', ts(auctionMeta.biddingEnd)],
    ['Reveal ends', ts(auctionMeta.revealEnd)],
    ['Repayment due', ts(auctionMeta.repaymentDue)],
  ];

  const live = [['Bids', auctionMeta.bids], ['Offers', auctionMeta.offers]];
  const final = [['Decrypted bids', auctionMeta.decBids],
                ['Decrypted offers', auctionMeta.decOffers]];

  const pills = auctionMeta.status.startsWith('✅')
                ? [...base, ...final]
                : [...base, ...live];

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
        `}
      </style>
      <div style={pageContainer}>
        <img src="/bgpattern.png" alt="" style={patternStyle} />
        <div style={wrapper}>
          <h1 style={h1}>
            Participate in auction{" "}
            <span style={{ fontSize: 20, fontWeight: 400, color: "#666666", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              ({auctionEngineAddress?.slice(0, 6)}…{auctionEngineAddress?.slice(-4)})
            </span>
          </h1>

          {/* ───────── auction info card ───────── */}
          <div style={infoStyles.wrap}>
            {pills.map(([label, val]) => (
              <div key={label} style={infoStyles.pill}>
                <span style={infoStyles.label}>{label}</span>
                <span style={infoStyles.value}>{val}</span>
              </div>
            ))}
          </div>

      <div style={{ ...grid2, ...section }}>
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
                <th style={th}>Collateral token</th>
                <th style={th}>Amount</th>
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
              style={{ ...btn, flex: 1 }}
              onClick={placeBid}
            >
              Submit Bid
            </button>
            <button
              className="btn-primary"
              style={{ ...btn, flex: 1 }}
              onClick={removeBid}
            >
              Remove My Bid
            </button>
          </div>
        </div>

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
              style={{ ...btn, flex: 1 }}
              onClick={placeOffer}
            >
              Submit Offer
            </button>
            <button
              className="btn-primary"
              style={{ ...btn, flex: 1 }}
              onClick={removeOffer}
            >
              Remove My Offer
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...grid2, ...section }}>
        <div style={section}>
          <h2 style={h2}>Add or Remove Collateral</h2>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Token</th>
                <th style={th}>Amount</th>
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
              style={btn}
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
              style={btn}
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
          <button className="btn-primary" style={btn} onClick={repay}>
            Repay
          </button>
        </div>
        <div>
          <h2 style={h2}>Check Owed</h2>
          <button className="btn-primary" style={btn} onClick={checkOwed}>
            Check
          </button>
          {owedAmount && (
            <p style={{ marginTop: 10, fontSize: 16, color: "#000000", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              You owe: <strong>{owedAmount}</strong>
            </p>
          )}
        </div>
      </div>

      <div style={{ ...grid2, ...section }}>
        <div>
          <h2 style={h2}>Liquidate</h2>
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
                <th style={th}>Token</th>
                <th style={th}>Coverage amount</th>
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
          <button className="btn-primary" style={btn} onClick={liquidate}>
            Liquidate
          </button>
        </div>
        <div>
          <h2 style={h2}>Redeem Token</h2>
          <label style={label}>Redemption amount</label>
          <input
            style={input}
            value={redemptionAmount}
            onChange={e => setRedemptionAmount(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
            placeholder="0"
          />
          <button className="btn-primary" style={btn} onClick={redeemToken}>
            Redeem
          </button>
        </div>
      </div>
        </div>
      </div>
    </>
  );
} 