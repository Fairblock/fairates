import React from "react";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";

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

  return (
    <div style={wrapper}>
      <h1 style={{ fontSize: 38, fontWeight: 400, marginBottom: 48 }}>
        Participate in auction{" "}
        <span style={{ fontSize: 20, fontWeight: 400, color: COLORS.textMuted }}>
          ({auctionEngineAddress?.slice(0, 6)}…{auctionEngineAddress?.slice(-4)})
        </span>
      </h1>

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
    </div>
  );
} 