import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";

export function ManageAuctionsPage() {
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
                <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#231726", color: "#fff" }}>
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