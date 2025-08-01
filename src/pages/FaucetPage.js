import React from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { TokenDisplay } from "../components/TokenDisplay";
import { sendTx } from "../utils/deploy.js";
import { USDC_ADDRESS, ETH_ADDRESS, BTC_ADDRESS, USDC_FAUCET, ETH_FAUCET, BTC_FAUCET, COLORS, FONT_FAMILY } from "../styles.js";

export function FaucetPage() {
  const { signer } = useAppContext();

  const handleWithdraw = async (tokenName, faucetAddress) => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const FaucetABI = ["function withdraw() public"];
      const faucetContract = new ethers.Contract(faucetAddress, FaucetABI, signer);
      const tx = await sendTx(faucetContract, "withdraw");
      alert(`${tokenName} withdrawal successful.`);
    } catch (error) {
      console.error(error);
      alert(`${tokenName} withdrawal failed: ${error.message}`);
    }
  };

  const card = {
    maxWidth: 620,
    margin: "0 auto",
    padding: 32,
    borderRadius: 20,
    border: "1px solid rgba(155,61,255,.45)",
    background:
      "linear-gradient(135deg, rgba(155,61,255,.15) 0%, rgba(155,61,255,.05) 100%)",
    backdropFilter: "blur(4px)",
    color: "#fff",
    fontFamily: FONT_FAMILY,
  };

  const heading = { fontSize: 28, fontWeight: 400, marginBottom: 32 };
  const sub = { fontSize: 17, marginBottom: 14, lineHeight: 1.45 };

  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontWeight: 400,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 12,
    width: "100%",
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <div className="purple-card" style={card}>
        <h2 style={heading}>Faucet</h2>

        <div style={{ marginBottom: 28 }}>
          <p style={sub}>
            <strong>USDC token</strong>
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
            <strong>ETH token</strong>
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
            <strong>BTC token</strong>
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
  );
} 