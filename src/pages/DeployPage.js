import React, { useEffect, useState, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY } from "../styles.js";

export function DeployPage() {
  const {
    deployContracts,
    deployContractsCustom,
    customPriceOracle,
    setCustomPriceOracle,
    customBidDuration,
    setCustomBidDuration,
    customRevealDuration,
    setCustomRevealDuration,
    customRepaymentDuration,
    setCustomRepaymentDuration,
    customFee,
    setCustomFee,
    setCustomLiquidationFee,
    customLiquidationFee,
    setCustomProtocolLiquidationFee,
    customProtocolLiquidationFee,
    customAuctionTokenAmount,
    setCustomAuctionTokenAmount,
    customPurchaseToken,
    setCustomPurchaseToken,
    customMaxBid,
    setCustomMaxBid,
    customMaxOffer,
    setCustomMaxOffer,
    setCustomMinBid,
    customMinOffer,
    setCustomMinOffer,
    customMinBid,
    setCustomMaxNumBids,
    setCustomMaxNumOffers,
    customMaxNumBids,
    customMaxNumOffers,
    customCollateralToken,
    setCustomCollateralToken,
    customCollateralRatio,
    setCustomCollateralRatio,
  } = useAppContext();

  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("deploy-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("deploy-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const pageContainer = {
    minHeight: "calc(100vh - var(--header-height, 80px))",
    backgroundColor: "#FFFFFF",
    position: "relative",
    padding: "0px 0px 0px",
  };

  const page = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 32px",
    display: "flex",
    gap: 64,
    position: "relative",
    zIndex: 1,
  };
  const columnStyle = { flex: "1 1 0%" };

  const cardBreak = "@media(max-width: 1020px){flex-direction:column;gap:48px;}";

  const h1 = { 
    fontSize: 32, 
    fontWeight: 400, 
    marginBottom: 6, 
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const h2 = {
    fontSize:21,
    fontWeight: 400,
    color: "#000000",
    marginBottom: 6,
    marginTop: 0,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const subP = {
    fontSize: 18,
    lineHeight: 1.55,
    color: "#666666",
    marginBottom: 20,
    marginTop: 0,
    maxWidth: 640,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: 24,
  };
  const gridMobile = "@media(max-width:860px){grid-template-columns:1fr !important;}";

  const label = {
    fontSize: 20,
    fontWeight: 400,
    color: "#000000",
    marginBottom: 8,
    display: "block",
    textAlign: "left",
    marginTop: 12,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const inp = {
    width: "90%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "#F9F9F9",
    color: "#000000",
    border: "none",
    outline: "none",
    transition: "box-shadow .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const onF = (e) => {
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.1)";
  };
  const onB = (e) => {
    e.currentTarget.style.boxShadow = "none";
  };

  const btn = {
    background: "#E4F5FF",
    border: "none",
    color: "#00A3FF",
    fontSize: 18,
    fontWeight: 400,
    padding: "18px 60px",
    borderRadius: 14,
    cursor: "pointer",
    marginTop: 48,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const testDeployBtn = {
    background: "#E4F5FF",
    border: "none",
    color: "#00A3FF",
    fontSize: 16,
    fontWeight: 400,
    padding: "12px 24px",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 0,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const card = (
    <div
      style={{
        width: 400,
        padding: "16px 20px",
        borderRadius: 12,
        border: "1px solid #A9A9A9",
        background: "#FFFFFF",
        flexShrink: 0,
        height: "fit-content",
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 400,
          marginBottom: 12,
          marginTop: 0,
          color: "#000000",
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        Test Deployment
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 12, color: "#666666", marginTop: 0, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        Deploy all contracts for testing. This option automatically sets the
        auction characteristics and disables some checks for easier testing.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 20, color: "#666666", marginTop: 0, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        In the generated auction, USDC is set as purchase token and ETH is the
        collateral by default.
      </p>
      <button className="btn-primary" style={testDeployBtn} onClick={deployContracts}>
        Deploy Auction
      </button>
    </div>
  );

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
          
          body.deploy-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `}
      </style>
      <div style={pageContainer}>
        <img src="/bgpattern.png" alt="" style={patternStyle} />
        <div className="deploy-flex" style={{ ...page, [cardBreak]: {} }}>
          <div style={columnStyle}>
            <h1 style={h1}>Deploy Contracts</h1>

            <h2 style={h2}>Custom Deployment</h2>
            <p style={subP}>
              Deploy all contracts with custom parameters. Decrypter is always set
              to our fixed address.
            </p>

            <div className="grid-2" style={{ ...grid, [gridMobile]: {} }}>
              <div>
                <label style={label}>Price Oracle Address</label>
                <input
                  style={inp}
                  value={customPriceOracle}
                  onChange={(e) => setCustomPriceOracle(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0x…"
                />

                <label style={label}>Bid duration (secs)</label>
                <input
                  style={inp}
                  value={customBidDuration}
                  onChange={(e) => setCustomBidDuration(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="86400"
                />

                <label style={label}>Repayment duration (secs)</label>
                <input
                  style={inp}
                  value={customRepaymentDuration}
                  onChange={(e) => setCustomRepaymentDuration(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="172800"
                />

                <label style={label}>Fee</label>
                <input
                  style={inp}
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0"
                />
                <label style={label}>Liquidation Fee</label>
                <input
                  style={inp}
                  value={customLiquidationFee}
                  onChange={(e) => setCustomLiquidationFee(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0"
                />
                <label style={label}>Protocol Liquidation Fee</label>
                <input
                  style={inp}
                  value={customProtocolLiquidationFee}
                  onChange={(e) => setCustomProtocolLiquidationFee(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0"
                />

                <label style={label}>Purchase token address</label>
                <input
                  style={inp}
                  value={customPurchaseToken}
                  onChange={(e) => setCustomPurchaseToken(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0x…"
                />
                <label style={label}>Reveal duration (secs)</label>
                <input
                  style={inp}
                  value={customRevealDuration}
                  onChange={(e) => setCustomRevealDuration(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="86400"
                />
                <label style={label}>Initial collateral ratio</label>
                <input
                  style={inp}
                  value={customCollateralRatio}
                  onChange={(e) => setCustomCollateralRatio(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="1"
                />
              </div>

              <div>
                <label style={label}>Auction token ratio</label>
                <input
                  style={inp}
                  value={customAuctionTokenAmount}
                  onChange={(e) => setCustomAuctionTokenAmount(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="1"
                />

                <label style={label}>Max bid value</label>
                <input
                  style={inp}
                  value={customMaxBid}
                  onChange={(e) => setCustomMaxBid(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="15000"
                />

                <label style={label}>Min bid value</label>
                <input
                  style={inp}
                  value={customMinBid}
                  onChange={(e) => setCustomMinBid(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="10"
                />
                <label style={label}>Max number of bids</label>
                <input
                  style={inp}
                  value={customMaxNumBids}
                  onChange={(e) => setCustomMaxNumBids(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="50"
                />
                <label style={label}>Max offer value</label>
                <input
                  style={inp}
                  value={customMaxOffer}
                  onChange={(e) => setCustomMaxOffer(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="10000"
                />

                <label style={label}>Min offer value</label>
                <input
                  style={inp}
                  value={customMinOffer}
                  onChange={(e) => setCustomMinOffer(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="10"
                />
                <label style={label}>Max number of offers</label>
                <input
                  style={inp}
                  value={customMaxNumOffers}
                  onChange={(e) => setCustomMaxNumOffers(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="50"
                />
                <label style={label}>Initial collateral token address</label>
                <input
                  style={inp}
                  value={customCollateralToken}
                  onChange={(e) => setCustomCollateralToken(e.target.value)}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0x…"
                />
              </div>
            </div>
            <button className="btn-primary" style={btn} onClick={deployContractsCustom}>
              Deploy
            </button>
          </div>

          {card}
        </div>
      </div>
    </>
  );
} 