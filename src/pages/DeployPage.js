import React from "react";
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

  const page = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0px 32px 120px",
    display: "flex",
    gap: 64,
  };
  const columnStyle = { flex: "1 1 0%" };

  const cardBreak = "@media(max-width: 1020px){flex-direction:column;gap:48px;}";

  const h1 = { fontSize: 40, fontWeight: 400, marginBottom: 56 };
  const h2 = {
    fontSize: 26,
    fontWeight: 400,
    color: COLORS.accent,
    marginBottom: 6,
  };
  const subP = {
    fontSize: 18,
    lineHeight: 1.55,
    color: COLORS.textMuted,
    marginBottom: 20,
    maxWidth: 640,
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
    color: "#fff",
    marginBottom: 8,
    display: "block",
    textAlign: "left",
    marginTop: 12,
  };
  const inp = {
    width: "90%",
    padding: "16px 20px",
    fontSize: 17,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.22)",
    outline: "none",
    transition: "border .18s,box-shadow .18s",
  };
  const onF = (e) => {
    e.currentTarget.style.border = "1px solid #9B3DFF";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(155,61,255,.45)";
  };
  const onB = (e) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.22)";
    e.currentTarget.style.boxShadow = "none";
  };

  const btn = {
    background: COLORS.accent,
    border: "none",
    color: "#fff",
    fontSize: 18,
    fontWeight: 400,
    padding: "18px 60px",
    borderRadius: 14,
    cursor: "pointer",
    marginTop: 48,
  };

  const card = (
    <div
      style={{
        width: 320,
        padding: 28,
        borderRadius: 20,
        border: "1px solid rgba(155,61,255,.45)",
        background:
          "linear-gradient(135deg, rgba(155,61,255,.15), rgba(155,61,255,.05))",
        backdropFilter: "blur(4px)",
        flexShrink: 0,
        height: "20%",
      }}
    >
      <h3
        style={{
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 18,
          color: "#fff",
        }}
      >
        Test Deployment
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
        Deploy all contracts for testing. This option automatically sets the
        auction characteristics and disables some checks for easier testing.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 32 }}>
        In the generated auction, USDC is set as purchase token and ETH is the
        collateral by default.
      </p>
      <button className="btn-primary" style={btn} onClick={deployContracts}>
        Deploy&nbsp;(Test)
      </button>
    </div>
  );

  return (
    <div className="deploy-flex" style={{ ...page, [cardBreak]: {} }}>
      <div style={columnStyle}>
        <h1 style={h1}>Deploy contracts</h1>

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
  );
} 