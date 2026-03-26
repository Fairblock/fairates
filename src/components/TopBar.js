import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";
import { topBarStyle, navLink, logoStyle, FONT_FAMILY } from "../styles.js";

export function TopBar({ sectionLinks = [], isLandingPage = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDeployPage = location.pathname.includes("/developer/deploy") || location.pathname === "/developer";
  const isManagePage = location.pathname.includes("/developer/manage");
  const isFaucetPage = location.pathname.includes("/developer/faucet");
  const isAuctionManagementPage = location.pathname.includes("/developer/auction/");
  const isDeveloperPage = isDeployPage || isManagePage || isFaucetPage || isAuctionManagementPage;
  const isUserPage = location.pathname.includes("/user");

  const landingPageTopBarStyle = {
    ...topBarStyle,
    background: "#FFFFFF",
    borderBottom: "none",
    height: "auto",
    minHeight: "auto",
    padding: "12px 48px",
    flexWrap: "nowrap",
  };

  const landingPageNavLink = {
    ...navLink,
    color: "#000000",
    fontFamily: "'Charter', serif",
    textDecoration: "none",
  };

  const launchAppBtn = {
    background: "#000000",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 400,
    cursor: "pointer",
    transition: "opacity .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    marginLeft: "auto",
  };

  const landingPageLogoStyle = {
    ...logoStyle,
    filter: "brightness(0)",
  };

  const navRef = useRef(null);

  useEffect(() => {
    if (isLandingPage && navRef.current) {
      const updateHeaderHeight = () => {
        const height = navRef.current?.offsetHeight || 80;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      };
      
      updateHeaderHeight();
      window.addEventListener('resize', updateHeaderHeight);
      
      return () => window.removeEventListener('resize', updateHeaderHeight);
    }
  }, [isLandingPage]);

  if (isLandingPage) {
    const deployLink = sectionLinks.find(link => link.label === "Deploy Auction");
    const howItWorksLink = sectionLinks.find(link => link.label === "How it works");
    
    return (
      <>
        <style>
          {`
            .landing-page-nav {
              display: flex;
              align-items: center;
              background: #FFFFFF;
              border-bottom: none;
              height: auto;
              min-height: auto;
              padding: 12px 48px;
              flex-wrap: nowrap;
            }
            
            .landing-page-nav img {
              height: auto;
              max-height: 64px;
              width: auto;
              object-fit: contain;
            }
            
            :root {
              --header-height: 80px;
            }
            
            .landing-page-nav .nav-link {
              white-space: nowrap;
              text-decoration: none !important;
            }
            
            .landing-page-nav .launch-app-btn {
              white-space: nowrap;
              flex-shrink: 0;
            }
            
            @media (max-width: 1024px) {
              .landing-page-nav {
                padding: 10px 32px;
              }
              
              .landing-page-nav img {
                max-height: 56px;
              }
            }
            
            @media (max-width: 768px) {
              .landing-page-nav {
                padding: 8px 24px;
                flex-wrap: wrap;
              }
              
              .landing-page-nav img {
                max-height: 48px;
              }
              
              .landing-page-nav .nav-link {
                font-size: 0.9rem;
              }
              
              .landing-page-nav .launch-app-btn {
                font-size: 0.9rem;
                padding: 10px 20px;
              }
            }
            
            @media (max-width: 480px) {
              .landing-page-nav {
                padding: 6px 16px;
              }
              
              .landing-page-nav img {
                max-height: 40px;
              }
              
              .landing-page-nav .nav-link {
                font-size: 0.85rem;
                margin-left: 16px !important;
              }
              
              .landing-page-nav .launch-app-btn {
                font-size: 0.85rem;
                padding: 8px 16px;
              }
              
              .landing-page-nav .nav-right-group {
                gap: 16px !important;
              }
            }
          `}
        </style>
        <nav ref={navRef} style={landingPageTopBarStyle} className="landing-page-nav">
          <img src="/fairrates-logo.png" alt="fairrates" style={landingPageLogoStyle} />

          {deployLink && (
            <Link 
              to={deployLink.to} 
              style={{ ...landingPageNavLink, marginLeft: "32px" }} 
              className="nav-link"
            >
              {deployLink.label}
            </Link>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "32px" }} className="nav-right-group">
          {howItWorksLink && (
            howItWorksLink.to.startsWith("http") ? (
              <a 
                href={howItWorksLink.to} 
                target="_blank" 
                rel="noopener noreferrer"
                style={landingPageNavLink} 
                className="nav-link"
              >
                {howItWorksLink.label}
              </a>
            ) : (
              <Link 
                to={howItWorksLink.to} 
                style={landingPageNavLink} 
                className="nav-link"
                onClick={(e) => {
                  if (howItWorksLink.to === "#") {
                    e.preventDefault();
                    // Scroll to how it works section or handle as needed
                  }
                }}
              >
                {howItWorksLink.label}
              </Link>
            )
          )}

            <button
              style={launchAppBtn}
              className="launch-app-btn"
              onClick={() => navigate("/user")}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Launch App
            </button>
          </div>
        </nav>
      </>
    );
  }

  const deployPageTopBarStyle = {
    ...topBarStyle,
    background: "#FFFFFF",
    borderBottom: "none",
    height: "auto",
    minHeight: "auto",
    padding: "12px 48px",
    flexWrap: "wrap",
    gap: "16px",
    minWidth: 0,
  };

  const deployPageNavLink = {
    ...navLink,
    color: "#000000",
    fontFamily: "'Charter', serif",
    textDecoration: "none",
  };

  const isNavLinkActive = (to) => {
    const path = location.pathname;
    if (path === to) return true;
    if (to === "/developer/deploy" && path === "/developer") return true;
    if (to === "/developer/manage" && (path.startsWith("/developer/manage") || path.startsWith("/developer/auction/"))) return true;
    if (to === "/user") return path === "/user" || path.startsWith("/user/auction/");
    if (path.startsWith(to + "/")) return true;
    return false;
  };

  const deployPageLogoStyle = {
    ...logoStyle,
    filter: "brightness(0)",
  };

  if (isDeveloperPage || isUserPage) {
    return (
      <>
        <style>
          {`
            .developer-page-nav .nav-link,
            .user-page-nav .nav-link {
              text-decoration: none !important;
            }
            .developer-page-nav,
            .user-page-nav {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 16px;
              min-width: 0;
            }
            .developer-page-nav .nav-links-row,
            .user-page-nav .nav-links-row {
              display: flex;
              align-items: center;
              flex: 1 1 auto;
              min-width: 0;
              gap: 0;
            }
            .developer-page-nav .nav-links-row .nav-link,
            .user-page-nav .nav-links-row .nav-link {
              flex-shrink: 0;
              margin-left: 32px !important;
            }
            .developer-page-nav .nav-links-row .nav-link:first-of-type,
            .user-page-nav .nav-links-row .nav-link:first-of-type {
              margin-left: 24px !important;
            }
            .developer-page-nav .nav-logo,
            .user-page-nav .nav-logo {
              flex-shrink: 0;
            }
            .developer-page-nav .wallet-wrap,
            .user-page-nav .wallet-wrap {
              flex-shrink: 0;
              margin-left: auto;
              min-width: 0;
            }
            @media (max-width: 900px) {
              .developer-page-nav,
              .user-page-nav {
                padding: 12px 24px;
                gap: 12px;
              }
              .developer-page-nav .nav-links-row .nav-link,
              .user-page-nav .nav-links-row .nav-link {
                margin-left: 20px !important;
                font-size: 0.95rem;
              }
              .developer-page-nav .nav-links-row .nav-link:first-of-type,
              .user-page-nav .nav-links-row .nav-link:first-of-type {
                margin-left: 16px !important;
              }
            }
            @media (max-width: 640px) {
              .developer-page-nav,
              .user-page-nav {
                padding: 10px 16px;
                gap: 8px;
              }
              .developer-page-nav .nav-links-row .nav-link,
              .user-page-nav .nav-links-row .nav-link {
                margin-left: 12px !important;
                font-size: 0.9rem;
              }
              .developer-page-nav .nav-links-row .nav-link:first-of-type,
              .user-page-nav .nav-links-row .nav-link:first-of-type {
                margin-left: 12px !important;
              }
            }
          `}
        </style>
        <nav style={deployPageTopBarStyle} className={isDeveloperPage ? "developer-page-nav" : "user-page-nav"}>
          <img src="/fairrates-logo.png" alt="fairrates" style={deployPageLogoStyle} className="nav-logo" />

          <div className="nav-links-row">
            {sectionLinks.map(({ to, label }, index) => (
              <Link
                key={label}
                to={to}
                style={{
                  ...deployPageNavLink,
                  marginLeft: index === 0 ? 24 : 32,
                  fontWeight: isNavLinkActive(to) ? 600 : 400,
                }}
                className="nav-link"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="wallet-wrap">
            <WalletConnect />
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav style={topBarStyle}>
      <img src="/fairrates-logo.png" alt="fairrates" style={logoStyle} />

      {sectionLinks.map(({ to, label }) => (
        <Link key={label} to={to} style={navLink} className="nav-link">
          {label}
        </Link>
      ))}

      <WalletConnect />
    </nav>
  );
} 