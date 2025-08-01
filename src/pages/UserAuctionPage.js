import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";
import { infoStyles as S } from "../styles.js";
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

  const wrapper = { maxWidth: 1140, margin: "0 auto", padding: 32 };
  const section = { marginBottom: 64 };
  const h2 = { fontSize: 28, fontWeight: 400, color: COLORS.accent, marginBottom: 24 };
  const grid2 = { display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit,minmax(430px,1fr))" };
  const label = { fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8, display: "block", textAlign: "left", marginTop: 12 };
  const input = { width: "90%", padding: "18px 20px", fontSize: 18, borderRadius: 12, background: "rgba(255,255,255,0.04)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", outline: "none", transition: "box-shadow .18s,border .18s" };
  const focusOn = e => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,61,255,0.45)"; e.currentTarget.style.borderColor = COLORS.accent; };
  const focusOff = e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; };
  const purpleBtn = { background: COLORS.accent, border: "none", color: "#fff", fontSize: 18, fontWeight: 400, padding: "18px 64px", borderRadius: 14, cursor: "pointer", marginTop: 28, fontFamily: FONT_FAMILY };
  const table = { width: "100%", borderCollapse: "collapse", marginTop: 24 };
  const td = { border: "1px solid rgba(255,255,255,0.15)", padding: 12, fontSize: 15 };

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
    <div style={wrapper}>
      <h1 style={{ fontSize: 38, fontWeight: 400, marginBottom: 48 }}>
        Participate in auction{" "}
        <span style={{ fontSize: 20, fontWeight: 400, color: COLORS.textMuted }}>
          ({auctionEngineAddress?.slice(0, 6)}…{auctionEngineAddress?.slice(-4)})
        </span>
      </h1>

      {/* ───────── auction info card ───────── */}
      <div style={S.wrap}>
        {pills.map(([label, val]) => (
          <div key={label} style={S.pill}>
            <span style={S.label}>{label}</span>
            <span style={S.value}>{val}</span>
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
            <p style={{ marginTop: 10, fontSize: 16 }}>
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
                <th style={td}>Token</th>
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
          <button className="btn-primary" style={purpleBtn} onClick={redeemToken}>
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
} 