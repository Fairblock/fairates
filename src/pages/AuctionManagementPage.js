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

  const [activeTab, setActiveTab] = useState("finalize");
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

  const tabs = [
    { id: "finalize", label: "Finalize" },
    { id: "rate", label: "Check Rate" },
    { id: "collateral", label: "Add Collateral" },
    { id: "cancel", label: "Cancel Auction" },
  ];

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

          .tab-button {
            transition: all 0.2s ease;
          }

          .tab-button:hover {
            background-color: #F5F5F5;
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
        <img src="/bgpattern.png" alt="" style={patternStyle} />
        <div style={{ 
          maxWidth: 1200, 
          margin: "0 auto", 
          padding: "48px 32px",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 400,
              marginBottom: 4,
              color: "#000000",
              fontFamily: FONT_FAMILY,
              letterSpacing: "-0.02em",
            }}>
              Auction Management
            </h1>
            <p style={{
              fontSize: 14,
              color: "#999999",
              fontFamily: FONT_FAMILY,
              margin: 0,
            }}>
              {auctionEngineAddress?.slice(0, 10)}…{auctionEngineAddress?.slice(-8)}
            </p>
          </div>

          {/* Tabs */}
          <div 
            className="tabs-container"
            style={{
              borderBottom: '1px solid #E8E8E8',
              marginBottom: 32,
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
            padding: '40px',
            minHeight: '300px',
          }}>
            {/* Finalize Tab */}
            {activeTab === "finalize" && (
              <div style={{ maxWidth: 600 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#000000',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                }}>
                  Finalize Auction
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#666666',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.5,
                }}>
                  Finalize the auction to complete the decryption process and determine the clearing rate.
                </p>
                <button
                  className="action-button"
                  style={{
                    background: "#E4F5FF",
                    border: "none",
                    color: "#00A3FF",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "16px 48px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                  onClick={finalizeAuction}
                >
                  Finalize Auction
                </button>
                {decryptingAuctionAddress === auctionEngineAddress && (
                  <p style={{
                    marginTop: 16,
                    fontSize: 14,
                    color: "#666666",
                    fontFamily: FONT_FAMILY,
                  }}>
                    Decryption in progress…
                  </p>
                )}
              </div>
            )}

            {/* Check Rate Tab */}
            {activeTab === "rate" && (
              <div style={{ maxWidth: 600 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#000000',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                }}>
                  Check Clearing Rate
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#666666',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.5,
                }}>
                  Get the current clearing rate for this auction.
                </p>
                <button
                  className="action-button"
                  style={{
                    background: "#E4F5FF",
                    border: "none",
                    color: "#00A3FF",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "16px 48px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                  onClick={checkClearingRate}
                >
                  Get Rate
                </button>
                {clearingRate && (
                  <div style={{
                    marginTop: 24,
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                  }}>
                    <p style={{
                      fontSize: 14,
                      color: "#666666",
                      marginBottom: 4,
                      fontFamily: FONT_FAMILY,
                    }}>
                      Current Clearing Rate
                    </p>
                    <p style={{
                      fontSize: 20,
                      color: "#000000",
                      fontFamily: FONT_FAMILY,
                      fontWeight: 500,
                      margin: 0,
                    }}>
                      {clearingRate}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Add Collateral Tab */}
            {activeTab === "collateral" && (
              <div style={{ maxWidth: 600 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#000000',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                }}>
                  Add Collateral
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: 16,
                }}>
                  <div>
                    <label style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#000000',
                      marginBottom: 8,
                      display: 'block',
                      fontFamily: FONT_FAMILY,
                    }}>Token Address</label>
                    <input
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        fontSize: 14,
                        borderRadius: "10px",
                        background: "#FFFFFF",
                        color: "#000000",
                        border: "1px solid #E0E0E0",
                        outline: "none",
                        fontFamily: FONT_FAMILY,
                        boxSizing: 'border-box',
                      }}
                      value={newCollateralAddress}
                      onChange={(e) => setNewCollateralAddress(e.target.value)}
                      placeholder="0x…"
                    />
                  </div>
                  <div>
                    <label style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#000000',
                      marginBottom: 8,
                      display: 'block',
                      fontFamily: FONT_FAMILY,
                    }}>Maintenance Ratio</label>
                    <input
                      className="input-field"
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        fontSize: 14,
                        borderRadius: "10px",
                        background: "#FFFFFF",
                        color: "#000000",
                        border: "1px solid #E0E0E0",
                        outline: "none",
                        fontFamily: FONT_FAMILY,
                        boxSizing: 'border-box',
                      }}
                      value={newCollateralRatio}
                      onChange={(e) => setNewCollateralRatio(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
                <button
                  className="action-button"
                  style={{
                    background: "#E4F5FF",
                    border: "none",
                    color: "#00A3FF",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "16px 48px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                  onClick={registerNewCollateral}
                >
                  Register Collateral
                </button>

                {registeredCollaterals.length > 0 && (
                  <div style={{
                    marginTop: 32,
                    paddingTop: 24,
                    borderTop: '1px solid #E8E8E8',
                  }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#000000',
                      marginBottom: 16,
                      fontFamily: FONT_FAMILY,
                    }}>Registered Collaterals</p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      {registeredCollaterals.map((c) => (
                        <div
                          key={c.address}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E0E0E0',
                            fontSize: 13,
                            color: '#000000',
                            fontFamily: FONT_FAMILY,
                          }}
                        >
                          {c.address.slice(0, 8)}…{c.address.slice(-6)} (ratio {c.ratio})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancel Auction Tab */}
            {activeTab === "cancel" && (
              <div style={{ maxWidth: 600 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#000000',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                }}>
                  Cancel Auction
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#666666',
                  marginBottom: 24,
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1.5,
                }}>
                  Cancel this auction. Please provide a reason for cancellation.
                </p>
                <label style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#000000',
                  marginBottom: 8,
                  display: 'block',
                  fontFamily: FONT_FAMILY,
                }}>Reason</label>
                <input
                  className="input-field"
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    fontSize: 14,
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#000000",
                    border: "1px solid #E0E0E0",
                    outline: "none",
                    marginBottom: 24,
                    fontFamily: FONT_FAMILY,
                    boxSizing: 'border-box',
                  }}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. testing"
                />
                <button
                  className="action-button"
                  style={{
                    background: "#E4F5FF",
                    border: "none",
                    color: "#00A3FF",
                    fontSize: 16,
                    fontWeight: 500,
                    padding: "16px 48px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                  onClick={cancelAuction}
                >
                  Cancel Auction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
