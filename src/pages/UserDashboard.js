import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function UserDashboard() {
  const { deployedAuctions, selectAuction, showToast } = useAppContext();
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState("");
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("user-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("user-page-active");
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
    border: "1px solid #A9A9A9",
    background: "#FFFFFF",
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
          
          body.user-page-active {
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
            <h2 style={heading}>Available auctions</h2>

            {deployedAuctions.length === 0 ? (
              <p style={{ 
                fontSize: 16, 
                lineHeight: 1.5,
                color: "#666666",
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
              }}>
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
                    <option key={a.auctionEngineAddress} value={a.auctionEngineAddress} style={{ background: "#FFFFFF", color: "#000000" }}>
                      {a.auctionEngineAddress.slice(0, 6)}…{a.auctionEngineAddress.slice(-4)}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-primary"
                  style={btn}
                  onClick={() => {
                    if (!selected) {
                      showToast("Please select an auction first", "warning");
                      return;
                    }
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
      </div>
    </>
  );
} 