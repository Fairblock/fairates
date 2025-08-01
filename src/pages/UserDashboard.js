import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";

export function UserDashboard() {
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
                <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#231726", color: "#fff" }}>
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