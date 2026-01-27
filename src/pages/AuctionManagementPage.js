import React, { useEffect, useState } from "react";
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

  const [clearingRate, setClearingRate] = useState("");
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("auction-management-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("auction-management-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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

  useEffect(() => {
    if (aeAddress && (!currentAuction || currentAuction.auctionEngineAddress !== aeAddress)) {
      const found = deployedAuctions.find(
        (a) => a.auctionEngineAddress === aeAddress
      );
      if (found) selectAuction(found);
      else setAuctionEngineAddress(aeAddress);
    }
  }, [aeAddress, currentAuction, deployedAuctions, selectAuction, setAuctionEngineAddress]);

  const pageContainer = {
    minHeight: "calc(100vh - var(--header-height, 80px))",
    backgroundColor: "#FFFFFF",
    position: "relative",
    padding: "0px 0px 0px",
  };

  const wrap = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px 32px",
    minHeight: "calc(100vh - var(--header-height, 80px))",
    position: "relative",
    zIndex: 1,
  };

  const card = {
    width: 520,
    padding: 40,
    borderRadius: 12,
    border: "1px solid #A9A9A9",
    background: "#FFFFFF",
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const h2 = {
    fontSize: 24,
    fontWeight: 400,
    marginBottom: 32,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const sectionH3 = {
    fontSize: 21,
    fontWeight: 400,
    color: "#000000",
    marginBottom: 16,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const label = {
    fontSize: 20,
    fontWeight: 400,
    color: "#000000",
    marginBottom: 8,
    display: "block",
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
    marginBottom: 18,
    transition: "box-shadow .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const focusOn = (e) => {
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.1)";
  };
  const focusOff = (e) => {
    e.currentTarget.style.boxShadow = "none";
  };

  const btn = {
    background: "#E4F5FF",
    border: "none",
    color: "#00A3FF",
    fontWeight: 400,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
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
          
          body.auction-management-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `}
      </style>
      <div style={pageContainer}>
        <img src="/bgpattern.png" alt="" style={patternStyle} />
        <div style={wrap}>
          <div className="purple-card" style={card}>
            <h2 style={h2}>Auction&nbsp;management</h2>

            <div style={{ marginBottom: 40 }}>
              <h3 style={sectionH3}>Finalize auction</h3>
              <button className="btn-primary" style={btn} onClick={finalizeAuction}>
                Finalize
              </button>
              {decryptingAuctionAddress === auctionEngineAddress && (
                <p style={{ marginTop: 10, fontSize: 16, color: "#666666", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>Decryption in progress…</p>
              )}

              <h3 style={{ ...sectionH3, marginTop: 32 }}>Check clearing rate</h3>
              <button className="btn-primary" style={btn} onClick={checkClearingRate}>
                Get rate
              </button>
              {clearingRate && (
                <p style={{ marginTop: 10, fontSize: 16, color: "#000000", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
                <ul style={{ marginTop: 18, fontSize: 15, lineHeight: 1.45, color: "#000000", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
      </div>
    </>
  );
} 