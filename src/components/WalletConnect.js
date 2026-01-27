import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useAppContext } from "../context/AppContext";

export function WalletConnect() {
  const {
    signer,
    walletAddress,
    connectWallet,
    disconnectWallet,
    availableAccounts,
    switchAccount,
  } = useAppContext();

  const [open, setOpen] = useState(false);

  const pill = {
    background: "#000000",
    border: "none",
    color: "#FFFFFF",
    fontWeight: 400,
    fontSize: 16,
    padding: "12px 24px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "opacity .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const selectDark = {
    ...pill,
    width: 260,
    background: "#F9F9F9",
    color: "#000000",
    border: "none",
    appearance: "none",
    paddingRight: 42,
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIGZpbGw9IiMwMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTkgMC41TDUuMDAyIDQuNjY3TDEgMC41IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "calc(100% - 16px) center",
  };
  
  const optionDark = { background: "#FFFFFF", color: "#000000" };

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
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  
  const fox = { width: 140, marginBottom: 32 };
  
  const connectBtn = {
    background: "#000000",
    border: "none",
    width: "100%",
    padding: "20px 0",
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 400,
    cursor: "pointer",
    marginTop: 40,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const modal = (
    <div style={overlay} onClick={() => setOpen(false)}>
      <div className="purple-card" style={card} onClick={(e) => e.stopPropagation()}>
        <img src={`${process.env.PUBLIC_URL}/metamask.svg`} alt="MetaMask" style={fox} />
        <p style={{ color: "#000", fontSize: 18, fontWeight: 600, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Disconnect
            </button>
          </>
        ) : (
            <button
              className="wallet-pill"
              style={pill}
              onClick={() => setOpen(true)}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Connect
            </button>
        )}
      </div>

      {open && ReactDOM.createPortal(modal, document.body)}
    </>
  );
} 