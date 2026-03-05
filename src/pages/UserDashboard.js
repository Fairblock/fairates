import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";
import { PageLoader } from "../components/PageLoader";
import { FONT_FAMILY, ARBITRUM_SEPOLIA } from "../styles.js";
import AuctionEngineArtifact from "../AuctionEngine.json";
import CollateralManagerArtifact from "../CollateralManager.json";

export function UserDashboard() {
  const { deployedAuctions, selectAuction, showToast } = useAppContext();
  const navigate = useNavigate();
  const [headerHeight, setHeaderHeight] = useState(80);
  const [activeTab, setActiveTab] = useState("live");
  const [visibleCount, setVisibleCount] = useState(16);
  const [auctionMeta, setAuctionMeta] = useState({});
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!deployedAuctions || deployedAuctions.length === 0) {
      setAuctionMeta({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAuctionMeta() {
      try {
        const provider =
          (window.ethereum && new ethers.providers.Web3Provider(window.ethereum)) ||
          new ethers.providers.JsonRpcProvider(ARBITRUM_SEPOLIA.rpcUrls[0]);

        const ERC20_META_ABI = ["function symbol() view returns (string)"];
        const erc20For = (addr) =>
          new ethers.Contract(addr, ERC20_META_ABI, provider);

        const safeSymbol = async (addr) => {
          if (!addr) return "";
          try {
            const c = erc20For(addr);
            const sym = await c.symbol();
            if (sym && typeof sym === "string" && sym.trim().length > 0) {
              return sym.trim();
            }
          } catch {
            // ignore
          }
          return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
        };

        const entries = await Promise.all(
          deployedAuctions.map(async (a) => {
            try {
              const ae = new ethers.Contract(
                a.auctionEngineAddress,
                AuctionEngineArtifact.abi,
                provider,
              );

              const [
                biddingStartBn,
                biddingEndBn,
                revealEndBn,
                repaymentDueBn,
                repaymentTokenAddress,
              ] = await Promise.all([
                ae.biddingStart(),
                ae.biddingEnd(),
                ae.revealEnd(),
                ae.repaymentDue(),
                ae.repaymentToken(),
              ]);

              let collateralSymbols = [];
              if (a.collateralManagerAddress) {
                try {
                  const cm = new ethers.Contract(
                    a.collateralManagerAddress,
                    CollateralManagerArtifact.abi,
                    provider,
                  );
                  const collateralTokens = await cm.getAcceptedCollateralTokens();
                  collateralSymbols = await Promise.all(
                    collateralTokens.map(safeSymbol),
                  );
                } catch (cmErr) {
                  console.error("Failed to load collateral tokens", cmErr);
                }
              }

              const repaymentSymbol = await safeSymbol(repaymentTokenAddress);

              return [
                a.auctionEngineAddress.toLowerCase(),
                {
                  biddingStart: biddingStartBn.toNumber(),
                  biddingEnd: biddingEndBn.toNumber(),
                  revealEnd: revealEndBn.toNumber(),
                  repaymentDue: repaymentDueBn.toNumber(),
                  repaymentSymbol,
                  collateralSymbols,
                },
              ];
            } catch (err) {
              console.error("Failed to load auction meta", err);
              return [a.auctionEngineAddress.toLowerCase(), null];
            }
          }),
        );

        if (cancelled) return;

        const next = {};
        for (const [key, value] of entries) {
          if (value) next[key] = value;
        }
        setAuctionMeta(next);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load auctions overview", err);
        if (showToast) {
          showToast("Failed to load auction details", "error");
        }
        setLoading(false);
      }
    }

    loadAuctionMeta();
    const id = setInterval(loadAuctionMeta, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [deployedAuctions, showToast]);

  const pageContainer = {
    minHeight: "calc(100vh - var(--header-height, 80px))",
    backgroundColor: "#FFFFFF",
    position: "relative",
    padding: "0px 0px 0px",
  };

  const contentWrapper = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 32px 48px",
    position: "relative",
    zIndex: 1,
  };

  const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  };

  const heading = {
    fontSize: 24,
    fontWeight: 500,
    color: "#000000",
    fontFamily: FONT_FAMILY,
    letterSpacing: "-0.01em",
  };

  const subheading = {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  };

  const tabsRow = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  };

  const tabButton = (isActive) => ({
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FONT_FAMILY,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    backgroundColor: isActive ? "#000000" : "#F3F3F3",
    color: isActive ? "#FFFFFF" : "#555555",
  });

  const tableCard = {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: "20px 24px 12px",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.03)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  };

  const thStyle = {
    padding: "10px 12px",
    textAlign: "left",
    color: "#888888",
    fontWeight: 500,
    borderBottom: "1px solid #E2E2E2",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };

  const tdStyle = {
    padding: "14px 12px",
    borderBottom: "1px solid #EDEDED",
    color: "#111111",
    fontSize: 14,
  };

  const formatLoanTerm = (startSec, endSec) => {
    if (!startSec || !endSec || endSec <= startSec) return "";
    const diffSec = endSec - startSec;
    const days = Math.round(diffSec / 86400);
    if (days >= 7 && days % 7 === 0) {
      const weeks = days / 7;
      return weeks === 1 ? "1 week" : `${weeks} weeks`;
    }
    if (days >= 1) {
      return days === 1 ? "1 day" : `${days} days`;
    }
    const hours = Math.round(diffSec / 3600);
    if (hours >= 1) {
      return hours === 1 ? "1 hour" : `${hours} hours`;
    }
    const minutes = Math.max(1, Math.round(diffSec / 60));
    return `${minutes} min`;
  };

  const formatMaturity = (sec) => {
    if (!sec) return "";
    const d = new Date(sec * 1000);
    const datePart = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart}, ${timePart}`;
  };

  const formatCollateral = (symbols) => {
    if (!symbols || symbols.length === 0) return "";
    if (symbols.length === 1) return symbols[0];
    if (symbols.length === 2) return `${symbols[0]}, ${symbols[1]}`;
    return `${symbols[0]}, ${symbols[1]} +${symbols.length - 2} more`;
  };

  const formatClosingTime = (biddingEndSec) => {
    if (!biddingEndSec) return "";
    const nowSec = Date.now() / 1000;
    const diff = Math.floor(biddingEndSec - nowSec);
    if (diff <= 0) return "Completed";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const parts = [];
    if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
    if (hours) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
    if (!days && minutes) parts.push(`${minutes} min`);
    return parts.join(" ");
  };

  const closingProgress = (biddingStartSec, biddingEndSec) => {
    if (
      !biddingStartSec ||
      !biddingEndSec ||
      biddingEndSec <= biddingStartSec
    ) {
      return 0;
    }
    const nowSec = Date.now() / 1000;
    if (nowSec <= biddingStartSec) return 0;
    if (nowSec >= biddingEndSec) return 1;
    const total = biddingEndSec - biddingStartSec;
    const elapsed = nowSec - biddingStartSec;
    return Math.min(1, Math.max(0, elapsed / total));
  };

  const auctionsToShow = activeTab === "live" ? deployedAuctions : [];
  const visibleAuctions = auctionsToShow.slice(0, visibleCount);
  const hasMore = auctionsToShow.length > visibleCount;

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

          .auction-row {
            cursor: pointer;
            transition: background-color 0.12s ease, box-shadow 0.12s ease;
          }

          .auction-row:hover {
            background-color: #F1F1F1;
            box-shadow: none;
          }

          .participate-table-scroll {
            max-height: min(480px, 55vh);
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #00A3FF rgba(0, 0, 0, 0.06);
            border-radius: 12px;
          }
          .participate-table-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .participate-table-scroll::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.04);
            border-radius: 999px;
            margin: 8px 0;
          }
          .participate-table-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #00A3FF 0%, #0088DD 100%);
            border-radius: 999px;
          }
          .participate-table-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #0090EE 0%, #0077CC 100%);
          }
        `}
      </style>
      <div style={pageContainer}>
        <PageLoader loading={loading} />
        <div style={contentWrapper}>
          <div style={headerRow}>
            <div>
              <h2 style={heading}>Participate</h2>
              <p style={subheading}>
                Browse auctions and click a row to participate.
              </p>
            </div>
          </div>

          <div style={tabsRow}>
            <button
              type="button"
              style={tabButton(activeTab === "live")}
              onClick={() => setActiveTab("live")}
            >
              ● Live Auctions
            </button>
            <button
              type="button"
              style={tabButton(activeTab === "closed")}
              onClick={() => setActiveTab("closed")}
            >
              Closed Auctions
            </button>
          </div>

          <div style={tableCard}>
            {auctionsToShow.length === 0 ? (
              <p
                style={{
                  fontSize: 14,
                  color: "#777777",
                  padding: "8px 4px 16px",
                  fontFamily:
                    "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                {activeTab === "live"
                  ? "No auctions are currently live."
                  : "No closed auctions yet."}
              </p>
            ) : (
              <>
                <div className="participate-table-scroll">
                  <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 40 }}>#</th>
                      <th style={thStyle}>Supply / Borrow</th>
                      <th style={thStyle}>Loan Term</th>
                      <th style={thStyle}>Maturity</th>
                      <th style={thStyle}>Collateral Type</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>
                        Closing Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAuctions.map((auction, idx) => {
                      const index = idx + 1;
                      const meta =
                        auctionMeta[auction.auctionEngineAddress.toLowerCase()] ||
                        {};
                      const shortAddress = `${auction.auctionEngineAddress.slice(
                        0,
                        6,
                      )}…${auction.auctionEngineAddress.slice(-4)}`;
                      const progress = closingProgress(
                        meta.biddingStart,
                        meta.biddingEnd,
                      );
                      return (
                        <tr
                          key={auction.auctionEngineAddress}
                          className="auction-row"
                          onClick={() => {
                            selectAuction(auction);
                            navigate(`/user/auction/${auction.auctionEngineAddress}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              selectAuction(auction);
                              navigate(
                                `/user/auction/${auction.auctionEngineAddress}`,
                              );
                            }
                          }}
                          tabIndex={0}
                        >
                          <td style={tdStyle}>{index}</td>
                          <td style={tdStyle}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "999px",
                                  background:
                                    "linear-gradient(135deg, #E4F5FF 0%, #B3E0FF 100%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#004B7A",
                                }}
                              >
                                $
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                  }}
                                >
                                  {meta.repaymentSymbol || ""}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#888888",
                                  }}
                                >
                                  {shortAddress}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {formatLoanTerm(meta.revealEnd, meta.repaymentDue)}
                          </td>
                          <td style={tdStyle}>
                            {formatMaturity(meta.repaymentDue)}
                          </td>
                          <td style={tdStyle}>
                            {formatCollateral(meta.collateralSymbols)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "#111111",
                                }}
                              >
                                {formatClosingTime(meta.biddingEnd)}
                              </span>
                              <div
                                style={{
                                  width: 80,
                                  height: 4,
                                  borderRadius: 999,
                                  backgroundColor: "#E2E2E2",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress * 100}%`,
                                    height: "100%",
                                    backgroundColor: "#00A3FF",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                {hasMore && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "12px 0 4px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 16)}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 999,
                        border: "1px solid #D0D0D0",
                        backgroundColor: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily:
                          "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                      }}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 