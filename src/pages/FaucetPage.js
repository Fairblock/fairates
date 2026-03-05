import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { TokenDisplay } from "../components/TokenDisplay";
import { sendTx } from "../utils/deploy.js";
import { USDC_ADDRESS, ETH_ADDRESS, BTC_ADDRESS, USDC_FAUCET, ETH_FAUCET, BTC_FAUCET } from "../styles.js";

export function FaucetPage() {
  const { signer, showToast, getErrorMessage } = useAppContext();
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("faucet-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("faucet-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const handleWithdraw = async (tokenName, faucetAddress) => {
    if (!signer) {
      showToast("Please connect your wallet first", "warning");
      return;
    }
    try {
      const FaucetABI = ["function withdraw() public"];
      const faucetContract = new ethers.Contract(faucetAddress, FaucetABI, signer);
      const tx = await sendTx(faucetContract, "withdraw");
      showToast(`${tokenName} withdrawal successful`, "success");
    } catch (error) {
      console.error(error);
      showToast(getErrorMessage(error), "error");
    }
  };

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
    maxWidth: 620,
    margin: "0 auto",
    padding: 32,
    borderRadius: 12,
    border: "none",
    background: "#FAFAFA",
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const heading = { 
    fontSize: 24, 
    fontWeight: 400, 
    marginBottom: 32,
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  
  const sub = { 
    fontSize: 17, 
    marginBottom: 14, 
    lineHeight: 1.45,
    color: "#666666",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
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
    marginTop: 12,
    width: "100%",
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
          
          body.faucet-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
        `}
      </style>
      <div style={pageContainer}>
        <div style={wrap}>
          <div className="purple-card" style={card}>
            <h2 style={heading}>Faucet</h2>

            <div style={{ marginBottom: 28 }}>
              <p style={sub}>
                <strong style={{ color: "#000000" }}>USDC token</strong>
                <br />
                Address:&nbsp;<span className="wrap-addr">
                  <TokenDisplay address={USDC_ADDRESS} />
                </span>
              </p>
              <button className="btn-primary" style={btn} onClick={() => handleWithdraw("USDC", USDC_FAUCET)}>
                Request&nbsp;USDC
              </button>
            </div>

            <div style={{ marginBottom: 28 }}>
              <p style={sub}>
                <strong style={{ color: "#000000" }}>ETH token</strong>
                <br />
                Address:&nbsp;<span className="wrap-addr">
                  <TokenDisplay address={ETH_ADDRESS} />
                </span>
              </p>
              <button className="btn-primary" style={btn} onClick={() => handleWithdraw("ETH", ETH_FAUCET)}>
                Request&nbsp;ETH
              </button>
            </div>

            <div>
              <p style={sub}>
                <strong style={{ color: "#000000" }}>BTC token</strong>
                <br />
                Address:&nbsp;<span className="wrap-addr">
                  <TokenDisplay address={BTC_ADDRESS} />
                </span>
              </p>
              <button className="btn-primary" style={btn} onClick={() => handleWithdraw("BTC", BTC_FAUCET)}>
                Request&nbsp;BTC
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 