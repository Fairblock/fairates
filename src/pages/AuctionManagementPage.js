import React from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";
import AuctionEngineArtifact from "../AuctionEngine.json";

export function AuctionManagementPage() {
  const { aeAddress } = useParams();
  const {
    currentAuction,
    deployedAuctions,
    selectAuction,
    setAuctionEngineAddress,
    signer,
    auctionEngineAddress,
    finalizeAuction,
    decryptingAuctionAddress,
    registerNewCollateral,
    newCollateralAddress,
    setNewCollateralAddress,
    newCollateralRatio,
    setNewCollateralRatio,
    registeredCollaterals,
    cancelReason,
    setCancelReason,
    cancelAuction,
    showToast,
    getErrorMessage,
  } = useAppContext();

  const [clearingRate, setClearingRate] = React.useState("");

  async function checkClearingRate() {
    if (!signer || !auctionEngineAddress) {
      showToast("AuctionEngine not set or wallet not connected", "warning");
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
      showToast(`Clearing Rate: ${rate}`, "info");
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err), "error");
    }
  }

  React.useEffect(() => {
    if (aeAddress && (!currentAuction || currentAuction.auctionEngineAddress !== aeAddress)) {
      const found = deployedAuctions.find(
        (a) => a.auctionEngineAddress === aeAddress
      );
      if (found) selectAuction(found);
      else setAuctionEngineAddress(aeAddress);
    }
  }, [aeAddress, currentAuction, deployedAuctions, selectAuction, setAuctionEngineAddress]);

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

        <div style={{ marginBottom: 40 }}>
          <h3 style={sectionH3}>Finalize auction</h3>
          <button className="btn-primary" style={btn} onClick={finalizeAuction}>
            Finalize
          </button>
          {decryptingAuctionAddress === auctionEngineAddress && (
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