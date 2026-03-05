import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";

export function ManageAuctionsPage() {
  const { myAuctions, selectAuction, showToast } = useAppContext();
  const navigate = useNavigate();
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("manage-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("manage-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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
    width: 420,
    padding: 32,
    borderRadius: 12,
    border: "none",
    background: "#FAFAFA",
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    textAlign: "center",
  };

  const heading = { 
    fontSize: 24, 
    fontWeight: 400, 
    marginBottom: 24,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  
  const selectBox = {
    width: "100%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "#F9F9F9",
    color: "#000000",
    border: "none",
    outline: "none",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  
  const btn = {
    background: "#E4F5FF",
    border: "none",
    color: "#00A3FF",
    fontWeight: 400,
    fontSize: 16,
    padding: "16px",
    borderRadius: 8,
    cursor: "pointer",
    width: "100%",
    marginTop: 28,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
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
          
          body.manage-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `}
      </style>
      <div style={pageContainer}>
        <div style={wrap}>
          <div className="purple-card" style={card}>
            <h2 style={heading}>Manage my auctions</h2>

            {myAuctions.length === 0 ? (
              <p style={{ 
                fontSize: 16, 
                lineHeight: 1.5,
                color: "#666666",
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              }}>
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
                    <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#FFFFFF", color: "#000000" }}>
                      {a.auctionEngineAddress.slice(0, 6)}…{a.auctionEngineAddress.slice(-4)}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-primary"
                  style={btn}
                  onClick={() => {
                    const sel = document.querySelector("select").value;
                    if (!sel) {
                      showToast("Please select an auction first", "warning");
                      return;
                    }
                    navigate(`/developer/auction/${sel}`);
                  }}
                >
                  Open dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 