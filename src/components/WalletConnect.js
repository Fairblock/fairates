import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useAppContext } from "../context/AppContext";

function formatAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

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
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const accountDropdownRef = useRef(null);
  const dropdownPortalRef = useRef(null);

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

  // Custom wallet selector trigger + dropdown styles (light grey like original)
  const walletTrigger = {
    ...pill,
    minWidth: 120,
    maxWidth: 200,
    background: "#F9F9F9",
    color: "#000000",
    border: "none",
    padding: "10px 36px 10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    boxSizing: "border-box",
  };
  const walletDropdown = {
    position: "fixed",
    top: dropdownPosition ? dropdownPosition.top + dropdownPosition.height + 4 : 0,
    left: dropdownPosition ? dropdownPosition.left : 0,
    width: dropdownPosition ? dropdownPosition.width : "auto",
    minWidth: dropdownPosition ? dropdownPosition.width : 120,
    maxHeight: 280,
    overflowY: "auto",
    overflowX: "hidden",
    background: "#F9F9F9",
    border: "none",
    borderRadius: 10,
    boxShadow: "none",
    zIndex: 10000,
  };
  const walletOption = {
    width: "100%",
    padding: "12px 14px",
    color: "#000000",
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    textAlign: "left",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    transition: "background .15s, color .15s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const walletOptionLast = { ...walletOption, borderBottom: "none" };
  const chevronSvg = (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

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

  // When dropdown opens, measure trigger position for portal (avoids cut-off by nav overflow)
  useEffect(() => {
    if (!accountDropdownOpen) {
      setDropdownPosition(null);
      return;
    }
    const el = accountDropdownRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
  }, [accountDropdownOpen]);

  // Close account dropdown on outside click (dropdown is in portal so check both trigger and dropdown)
  useEffect(() => {
    if (!accountDropdownOpen) return;
    const handleClickOutside = (e) => {
      const inTrigger = accountDropdownRef.current && accountDropdownRef.current.contains(e.target);
      const inDropdown = dropdownPortalRef.current && dropdownPortalRef.current.contains(e.target);
      if (!inTrigger && !inDropdown) setAccountDropdownOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setAccountDropdownOpen(false);
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountDropdownOpen]);

  const modal = (
    <div style={overlay} onClick={() => setOpen(false)}>
      <div className="purple-card" style={card} onClick={(e) => e.stopPropagation()}>
        <img src={`${process.env.PUBLIC_URL}/metamask.svg`} alt="MetaMask" style={fox} />
        <p style={{ color: "#000", fontSize: 19, fontWeight: 300, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
      <style>
        {`
          .wallet-connect-root {
            min-width: 0;
            flex-shrink: 0;
          }
          .wallet-address-select {
            min-width: 0;
          }
          .wallet-dropdown-menu {
            animation: walletDropdownFade 0.15s ease-out;
            scrollbar-gutter: stable;
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.18) rgba(0,0,0,0.04);
          }
          .wallet-dropdown-menu::-webkit-scrollbar {
            width: 8px;
          }
          .wallet-dropdown-menu::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.04);
            border-radius: 4px;
            margin: 4px 0;
          }
          .wallet-dropdown-menu::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.18);
            border-radius: 4px;
          }
          .wallet-dropdown-menu::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.28);
          }
          @keyframes walletDropdownFade {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .wallet-dropdown-trigger {
            text-align: left;
          }
        `}
      </style>
      <div className="wallet-connect-root" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: 0 }}>
        {signer ? (
          <>
            <div
              ref={accountDropdownRef}
              className="wallet-address-select"
              style={{ position: "relative", flexShrink: 1, minWidth: 0 }}
            >
              <button
                type="button"
                className="wallet-pill wallet-dropdown-trigger"
                style={walletTrigger}
                onClick={() => setAccountDropdownOpen((v) => !v)}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatAddress(walletAddress)}
                </span>
                <span style={{ transform: accountDropdownOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  {chevronSvg}
                </span>
              </button>
              {accountDropdownOpen && dropdownPosition && ReactDOM.createPortal(
                <div ref={dropdownPortalRef} style={walletDropdown} className="wallet-dropdown-menu">
                  {availableAccounts.map((acc, i) => (
                    <button
                      type="button"
                      key={acc}
                      style={i === availableAccounts.length - 1 ? walletOptionLast : walletOption}
                      onClick={() => {
                        switchAccount(acc);
                        setAccountDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.06)";
                        e.currentTarget.style.color = "#000";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#000000";
                      }}
                    >
                      {formatAddress(acc)}
                      {acc === walletAddress && (
                        <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <button
              className="wallet-pill wallet-disconnect-btn"
              style={{ ...pill, flexShrink: 0 }}
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