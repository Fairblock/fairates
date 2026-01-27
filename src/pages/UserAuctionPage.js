import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { COLORS, FONT_FAMILY, ARBITRUM_SEPOLIA } from "../styles.js";
import AuctionEngineArtifact from "../AuctionEngine.json";
import BidManagerArtifact from "../BidManager.json";
import OfferManagerArtifact from "../OfferManager.json";

export function UserAuctionPage() {
  const {
    auctionEngineAddress,
    bidAmount,
    setBidAmount,
    bidRate,
    setBidRate,
    placeBid,
    offerAmount,
    setOfferAmount,
    offerRate,
    setOfferRate,
    placeOffer,
    repayAmount,
    setRepayAmount,
    repay,
    owedAmount,
    checkOwed,
    liquidationBorrower,
    setLiquidationBorrower,
    liquidationCollateralSelections,
    setLiquidationCollateralSelections,
    liquidate,
    redemptionAmount,
    setRedemptionAmount,
    redeemToken,
    bidCollateralSelections,
    setBidCollateralSelections,
    extraCollateralSelections,
    setExtraCollateralSelections,
    removeCollateralSelections,
    setRemoveCollateralSelections,
    externalLockCollateral,
    externalUnlockCollateral,
    bidManagerAddress,
    offerManagerAddress,
    signer,
    removeBid,
    removeOffer,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState("bid");
  const [auctionMeta, setAuctionMeta] = useState({
    phase: "-",
    status: "-",
    decBids: 0,
    decOffers: 0,
    biddingEnd: 0,
    revealEnd: 0,
    repaymentDue: 0,
    bids: 0,
    offers: 0,
    minBid: "-",
    maxBid: "-",
    minOffer: "-",
    maxOffer: "-",
    loading: true,
  });

  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    document.body.classList.add("user-auction-page-active");
    
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      document.body.classList.remove("user-auction-page-active");
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (bidCollateralSelections.length > 0) {
      const rows = bidCollateralSelections.map((c) => ({
        address: c.address,
        amount: "",
      }));
      setExtraCollateralSelections(rows);
      setRemoveCollateralSelections(rows);
    }
  }, [bidCollateralSelections, setExtraCollateralSelections, setRemoveCollateralSelections]);

  // Load auction details - works even without wallet connection
  useEffect(() => {
    async function loadDetails() {
      if (!auctionEngineAddress || !bidManagerAddress || !offerManagerAddress) {
        setAuctionMeta(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Use provider instead of signer for read-only operations
        const provider = signer?.provider ?? 
          new ethers.providers.JsonRpcProvider(ARBITRUM_SEPOLIA.rpcUrls[0]);

        const ae = new ethers.Contract(
          auctionEngineAddress,
          AuctionEngineArtifact.abi,
          provider
        );
        const bm = new ethers.Contract(
          bidManagerAddress,
          BidManagerArtifact.abi,
          provider
        );
        const om = new ethers.Contract(
          offerManagerAddress,
          OfferManagerArtifact.abi,
          provider
        );

        // phase ↦ human string
        const phaseTxt = ["Bidding", "Reveal", "Loan‑Window",
                          "Repayment", "Redemption"]
                         [await ae.getAuctionPhase()];

        const [
          biddingEnd,
          revealEnd,
          repaymentDue,
          bidsArr,
          offersArr,
          cancelled,
          finalized,
          maxBid,
          minBid,
          maxOffer,
          minOffer,
          bidsDec,
          offersDec
        ] = await Promise.all([
          ae.biddingEnd(),
          ae.revealEnd(),
          ae.repaymentDue(),
          bm.getBids(),
          om.getOffers(),
          ae.auctionCancelled(),
          ae.isFinalized(),
          bm.maxBidAmount(),
          bm.minimumBidAmount(),
          om.maxOfferAmount(),
          om.minimumOfferAmount(),
          ae.bidsDecrypted(),
          ae.offersDecrypted() 
        ]);

        const statusTxt = cancelled
          ? "❌ Cancelled"
          : finalized
            ? "✅ Finalized"
            : `🟢 ${phaseTxt}`;

        setAuctionMeta({
          status: statusTxt,
          phase: phaseTxt,
          biddingEnd: biddingEnd.toNumber(),
          revealEnd: revealEnd.toNumber(),
          repaymentDue: repaymentDue.toNumber(),
          bids: bidsArr.length,
          offers: offersArr.length,
          maxBid: ethers.utils.formatUnits(maxBid, 18),
          minBid: ethers.utils.formatUnits(minBid, 18),
          maxOffer: ethers.utils.formatUnits(maxOffer, 18),
          minOffer: ethers.utils.formatUnits(minOffer, 18),
          decBids: finalized ? Number(bidsDec) : 0,
          decOffers: finalized ? Number(offersDec) : 0,
          loading: false,
        });
      } catch (err) {
        console.error("loadDetails:", err);
        setAuctionMeta(prev => ({ ...prev, loading: false }));
      }
    }

    loadDetails();
    // Refresh every 10 seconds
    const interval = setInterval(loadDetails, 10000);
    return () => clearInterval(interval);
  }, [
    auctionEngineAddress,
    bidManagerAddress,
    offerManagerAddress,
    signer
  ]);

  const updateBidCollat = (i, v) => setBidCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateLiqCollat = (i, v) => setLiquidationCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateExtraCollat = (i, v) => setExtraCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  const updateRemoveCollat = (i, v) => setRemoveCollateralSelections(prev => { const c = [...prev]; c[i].amount = v; return c; });
  
  const ts = s => !s ? '–' : new Date(s*1000).toLocaleString();
  
  const base = [
    ['Status', auctionMeta.status],
    ['Bid limit', `${auctionMeta.minBid} – ${auctionMeta.maxBid}`],
    ['Offer limit', `${auctionMeta.minOffer} – ${auctionMeta.maxOffer}`],
    ['Bidding ends', ts(auctionMeta.biddingEnd)],
    ['Reveal ends', ts(auctionMeta.revealEnd)],
    ['Repayment due', ts(auctionMeta.repaymentDue)],
  ];

  const live = [['Bids', auctionMeta.bids], ['Offers', auctionMeta.offers]];
  const final = [['Decrypted bids', auctionMeta.decBids],
                ['Decrypted offers', auctionMeta.decOffers]];

  const pills = auctionMeta.status.startsWith('✅')
                ? [...base, ...final]
                : [...base, ...live];

  const tabs = [
    { id: "bid", label: "Place Bid" },
    { id: "offer", label: "Place Offer" },
    { id: "collateral", label: "Collateral" },
    { id: "repay", label: "Repay Loan" },
    { id: "liquidate", label: "Liquidate" },
    { id: "redeem", label: "Redeem" },
  ];

  const isWalletConnected = !!signer;

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
          
          body.user-auction-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }

          .tab-button {
            transition: all 0.2s ease;
          }

          .tab-button:hover {
            background-color: #F5F5F5;
          }

          .tab-button.active {
            background-color: #E4F5FF;
            color: #00A3FF;
          }

          .input-field:focus {
            box-shadow: 0 0 0 3px rgba(0, 163, 255, 0.1);
            border-color: #00A3FF;
          }

          .action-button {
            transition: all 0.2s ease;
          }

          .action-button:hover {
            background-color: #00A3FF;
            color: #FFFFFF;
          }

          .action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .tabs-container {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .tabs-container::-webkit-scrollbar {
              display: none;
            }
          }
        `}
      </style>
      <div style={{
        minHeight: "calc(100vh - var(--header-height, 80px))",
        backgroundColor: "#FFFFFF",
        position: "relative",
        padding: 0,
      }}>
        <img 
          src="/bgpattern.png" 
          alt="" 
          style={{
            position: "fixed",
            right: 0,
            top: `${headerHeight}px`,
            height: `calc(100vh - ${headerHeight}px)`,
            minHeight: `calc(100vh - ${headerHeight}px)`,
            width: "auto",
            objectFit: "cover",
            zIndex: 0,
            pointerEvents: "none",
          }} 
        />
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "24px 32px",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 400,
              marginBottom: 4,
              color: "#000000",
              fontFamily: FONT_FAMILY,
              letterSpacing: "-0.02em",
            }}>
              Auction Details
            </h1>
            <p style={{
              fontSize: 13,
              color: "#999999",
              fontFamily: FONT_FAMILY,
              margin: 0,
              fontWeight: 400,
            }}>
              {auctionEngineAddress?.slice(0, 10)}…{auctionEngineAddress?.slice(-8)}
            </p>
          </div>

          {/* Auction Info - Minimal Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid #F0F0F0',
          }}>
            {pills.map(([label, val]) => (
              <div key={label} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <span style={{
                  fontSize: '11px',
                  letterSpacing: '.06em',
                  color: '#999999',
                  textTransform: 'uppercase',
                  fontFamily: FONT_FAMILY,
                  fontWeight: 400,
                }}>{label}</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#000000',
                  wordBreak: 'break-word',
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.4,
                }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div 
            className="tabs-container"
            style={{
              borderBottom: '1px solid #E8E8E8',
              marginBottom: 20,
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tab-button"
                style={{
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: activeTab === tab.id ? '#00A3FF' : '#666666',
                  background: activeTab === tab.id ? '#E4F5FF' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #00A3FF' : '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: FONT_FAMILY,
                  whiteSpace: 'nowrap',
                  borderRadius: '8px 8px 0 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            backgroundColor: '#FAFAFA',
            borderRadius: '16px',
            padding: '24px',
            minHeight: '300px',
            maxWidth: '700px',
          }}>
            {/* Place Bid Tab */}
            {activeTab === "bid" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to place a bid.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Bid Amount</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Bid Rate</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={bidRate}
                    onChange={e => setBidRate(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  {bidCollateralSelections.length > 0 && (
                    <>
                      <label style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: 12,
                        display: 'block',
                        fontFamily: FONT_FAMILY,
                      }}>Collateral</label>
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E0E0E0',
                        overflow: 'hidden',
                        marginBottom: 18,
                      }}>
                        {bidCollateralSelections.map((c, i) => (
                          <div key={c.address} style={{
                            padding: '12px',
                            borderBottom: i < bidCollateralSelections.length - 1 ? '1px solid #E8E8E8' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{
                              fontSize: 13,
                              color: '#666666',
                              fontFamily: FONT_FAMILY,
                            }}>
                              {c.address.slice(0, 8)}…{c.address.slice(-6)}
                            </span>
                            <input
                              className="input-field"
                              style={{
                                width: "200px",
                                padding: "8px 12px",
                                fontSize: 13,
                                borderRadius: "8px",
                                background: "#F9F9F9",
                                color: "#000000",
                                border: "1px solid #E0E0E0",
                                outline: "none",
                                fontFamily: FONT_FAMILY,
                              }}
                              value={c.amount}
                              onChange={e => updateBidCollat(i, e.target.value)}
                              placeholder="0"
                              disabled={!isWalletConnected}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#E4F5FF",
                        border: "none",
                        color: "#00A3FF",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={placeBid}
                      disabled={!isWalletConnected}
                    >
                      Submit Bid
                    </button>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#F5F5F5",
                        border: "1px solid #E0E0E0",
                        color: "#666666",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={removeBid}
                      disabled={!isWalletConnected}
                    >
                      Remove Bid
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Place Offer Tab */}
            {activeTab === "offer" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to place an offer.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Offer Amount</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Offer Rate</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={offerRate}
                    onChange={e => setOfferRate(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#E4F5FF",
                        border: "none",
                        color: "#00A3FF",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={placeOffer}
                      disabled={!isWalletConnected}
                    >
                      Submit Offer
                    </button>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#F5F5F5",
                        border: "1px solid #E0E0E0",
                        color: "#666666",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={removeOffer}
                      disabled={!isWalletConnected}
                    >
                      Remove Offer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collateral Tab */}
            {activeTab === "collateral" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to manage collateral.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  {extraCollateralSelections.length > 0 && (
                    <>
                      <label style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: 12,
                        display: 'block',
                        fontFamily: FONT_FAMILY,
                      }}>Collateral Tokens</label>
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E0E0E0',
                        overflow: 'hidden',
                        marginBottom: 18,
                      }}>
                        {extraCollateralSelections.map((c, i) => (
                          <div key={c.address} style={{
                            padding: '12px',
                            borderBottom: i < extraCollateralSelections.length - 1 ? '1px solid #E8E8E8' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{
                              fontSize: 13,
                              color: '#666666',
                              fontFamily: FONT_FAMILY,
                            }}>
                              {c.address.slice(0, 8)}…{c.address.slice(-6)}
                            </span>
                            <input
                              className="input-field"
                              style={{
                                width: "200px",
                                padding: "8px 12px",
                                fontSize: 13,
                                borderRadius: "8px",
                                background: "#F9F9F9",
                                color: "#000000",
                                border: "1px solid #E0E0E0",
                                outline: "none",
                                fontFamily: FONT_FAMILY,
                              }}
                              value={c.amount}
                              onChange={e => updateExtraCollat(i, e.target.value)}
                              placeholder="0"
                              disabled={!isWalletConnected}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#E4F5FF",
                        border: "none",
                        color: "#00A3FF",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={() =>
                        externalLockCollateral(
                          extraCollateralSelections.map(c => c.address),
                          extraCollateralSelections.map(c => c.amount)
                        )
                      }
                      disabled={!isWalletConnected}
                    >
                      Lock Collateral
                    </button>
                    <button
                      className="action-button"
                      style={{
                        flex: 1,
                        background: "#F5F5F5",
                        border: "1px solid #E0E0E0",
                        color: "#666666",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                      }}
                      onClick={() =>
                        externalUnlockCollateral(
                          extraCollateralSelections.map(c => c.address),
                          extraCollateralSelections.map(c => c.amount)
                        )
                      }
                      disabled={!isWalletConnected}
                    >
                      Unlock Collateral
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Repay Loan Tab */}
            {activeTab === "repay" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to repay a loan.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Repay Amount</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={repayAmount}
                    onChange={e => setRepayAmount(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  <button
                    className="action-button"
                    style={{
                      background: "#E4F5FF",
                      border: "none",
                      color: "#00A3FF",
                      fontSize: 15,
                      fontWeight: 500,
                      padding: "12px 32px",
                      borderRadius: "10px",
                      cursor: isWalletConnected ? "pointer" : "not-allowed",
                      fontFamily: FONT_FAMILY,
                      opacity: isWalletConnected ? 1 : 0.5,
                    }}
                    onClick={repay}
                    disabled={!isWalletConnected}
                  >
                    Repay Loan
                  </button>
                  <div style={{ marginTop: 18 }}>
                    <button
                      className="action-button"
                      style={{
                        background: "#F5F5F5",
                        border: "1px solid #E0E0E0",
                        color: "#666666",
                        fontSize: 15,
                        fontWeight: 500,
                        padding: "12px 32px",
                        borderRadius: "10px",
                        cursor: isWalletConnected ? "pointer" : "not-allowed",
                        fontFamily: FONT_FAMILY,
                        opacity: isWalletConnected ? 1 : 0.5,
                        marginRight: 12,
                      }}
                      onClick={checkOwed}
                      disabled={!isWalletConnected}
                    >
                      Check Owed
                    </button>
                    {owedAmount && (
                      <span style={{
                        fontSize: 15,
                        color: "#000000",
                        fontFamily: FONT_FAMILY,
                        fontWeight: 500,
                      }}>
                        You owe: <strong>{owedAmount}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Liquidate Tab */}
            {activeTab === "liquidate" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to liquidate.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Borrower Address</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={liquidationBorrower}
                    onChange={e => setLiquidationBorrower(e.target.value)}
                    placeholder="0x…"
                    disabled={!isWalletConnected}
                  />
                  {liquidationCollateralSelections.length > 0 && (
                    <>
                      <label style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: 12,
                        display: 'block',
                        fontFamily: FONT_FAMILY,
                      }}>Coverage Amount</label>
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E0E0E0',
                        overflow: 'hidden',
                        marginBottom: 18,
                      }}>
                        {liquidationCollateralSelections.map((c, i) => (
                          <div key={c.address} style={{
                            padding: '12px',
                            borderBottom: i < liquidationCollateralSelections.length - 1 ? '1px solid #E8E8E8' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{
                              fontSize: 13,
                              color: '#666666',
                              fontFamily: FONT_FAMILY,
                            }}>
                              {c.address.slice(0, 8)}…{c.address.slice(-6)}
                            </span>
                            <input
                              className="input-field"
                              style={{
                                width: "200px",
                                padding: "8px 12px",
                                fontSize: 13,
                                borderRadius: "8px",
                                background: "#F9F9F9",
                                color: "#000000",
                                border: "1px solid #E0E0E0",
                                outline: "none",
                                fontFamily: FONT_FAMILY,
                              }}
                              value={c.amount}
                              onChange={e => updateLiqCollat(i, e.target.value)}
                              placeholder="0"
                              disabled={!isWalletConnected}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    className="action-button"
                    style={{
                      background: "#E4F5FF",
                      border: "none",
                      color: "#00A3FF",
                      fontSize: 15,
                      fontWeight: 500,
                      padding: "12px 32px",
                      borderRadius: "10px",
                      cursor: isWalletConnected ? "pointer" : "not-allowed",
                      fontFamily: FONT_FAMILY,
                      opacity: isWalletConnected ? 1 : 0.5,
                    }}
                    onClick={liquidate}
                    disabled={!isWalletConnected}
                  >
                    Liquidate
                  </button>
                </div>
              </div>
            )}

            {/* Redeem Tab */}
            {activeTab === "redeem" && (
              <div>
                {!isWalletConnected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    color: '#856404',
                    fontFamily: FONT_FAMILY,
                    fontSize: 13,
                  }}>
                    Please connect your wallet to redeem tokens.
                  </div>
                )}
                <div style={{ maxWidth: '100%' }}>
                  <label style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#000000',
                    marginBottom: 8,
                    display: 'block',
                    fontFamily: FONT_FAMILY,
                  }}>Redemption Amount</label>
                  <input
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: 15,
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#000000",
                      border: "1px solid #E0E0E0",
                      outline: "none",
                      marginBottom: 18,
                      fontFamily: FONT_FAMILY,
                      boxSizing: 'border-box',
                    }}
                    value={redemptionAmount}
                    onChange={e => setRedemptionAmount(e.target.value)}
                    placeholder="0"
                    disabled={!isWalletConnected}
                  />
                  <button
                    className="action-button"
                    style={{
                      background: "#E4F5FF",
                      border: "none",
                      color: "#00A3FF",
                      fontSize: 15,
                      fontWeight: 500,
                      padding: "12px 32px",
                      borderRadius: "10px",
                      cursor: isWalletConnected ? "pointer" : "not-allowed",
                      fontFamily: FONT_FAMILY,
                      opacity: isWalletConnected ? 1 : 0.5,
                    }}
                    onClick={redeemToken}
                    disabled={!isWalletConnected}
                  >
                    Redeem Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
