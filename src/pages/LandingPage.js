import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { FONT_FAMILY } from "../styles.js";

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("landing-page-active");
    return () => {
      document.body.classList.remove("landing-page-active");
    };
  }, []);

  const links = [
    { to: "https://docs.fairblock.network/docs/fairrates", label: "How it works" },
  ];

  const pageContainer = {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
  };

  const mainContent = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    flex: 1,
    minHeight: "calc(100vh - var(--header-height, 80px))",
    width: "100%",
    overflow: "hidden",
  };

  const leftContent = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: "80px 64px",
    maxWidth: "600px",
  };

  const rightContent = {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    minHeight: "calc(100vh - var(--header-height, 80px))",
  };

  const videoBackground = {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    width: "auto",
    minWidth: "100%",
    objectFit: "cover",
    display: "block",
  };

  const heroHeading = {
    fontSize: "clamp(1.75rem, 3vw, 3rem)",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: "32px",
    color: "#000000",
    fontFamily: "'Charter', serif",
    whiteSpace: "nowrap",
  };

  const heroSubContainer = {
    marginBottom: "40px",
  };

  const heroSub = {
    fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
    lineHeight: 1.6,
    margin: "0 0 20px",
    color: "#333333",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: 274,
  };

  const primaryBtn = {
    background: "#000000",
    color: "#FFFFFF",
    border: "none",
    padding: "14px 32px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 400,
    cursor: "pointer",
    transition: "opacity .18s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    width: "fit-content",
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
            font-family: 'Charter';
            src: url('/fonts/charter_italic.woff2') format('woff2');
            font-weight: 400;
            font-style: italic;
          }
          
          @font-face {
            font-family: 'Charter';
            src: url('/fonts/charter_bold_italic.woff2') format('woff2');
            font-weight: 700;
            font-style: italic;
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
          
          body.landing-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
          }
          
          .landing-main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            overflow: hidden;
          }
          
          .landing-right-content {
            width: 100%;
            height: 100%;
            min-height: calc(100vh - var(--header-height, 80px));
            position: relative;
            overflow: hidden;
          }
          
          @media (max-width: 1024px) {
            .landing-main-content {
              min-height: calc(100vh - var(--header-height, 75px)) !important;
            }
            
            .landing-right-content {
              min-height: calc(100vh - var(--header-height, 75px)) !important;
            }
          }
          
          @media (max-width: 768px) {
            .landing-main-content {
              min-height: calc(100vh - var(--header-height, 70px)) !important;
            }
            
            .landing-right-content {
              min-height: calc(100vh - var(--header-height, 70px)) !important;
            }
          }
          
          @media (max-width: 480px) {
            .landing-main-content {
              min-height: calc(100vh - var(--header-height, 65px)) !important;
            }
            
            .landing-right-content {
              min-height: calc(100vh - var(--header-height, 65px)) !important;
            }
          }
          
          .landing-right-content video {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: auto;
            min-width: 100%;
            object-fit: cover;
            display: block;
          }
          
          @media (max-width: 768px) {
            .landing-main-content {
              grid-template-columns: 1fr;
            }
            
            .landing-left-content {
              padding: 40px 24px !important;
            }
            
            .landing-right-content {
              min-height: 50vh;
              width: 100%;
              height: 50vh;
            }
            
            .landing-right-content video {
              position: absolute;
              right: 0;
              top: 0;
              height: 100%;
              width: auto;
              min-width: 100%;
              object-fit: cover;
            }
          }
          
          @media (max-width: 480px) {
            .landing-right-content {
              min-height: 40vh;
            }
          }
        `}
      </style>
      <div style={pageContainer}>
        <TopBar sectionLinks={links} isLandingPage={true} />

        <div style={mainContent} className="landing-main-content">
          <div style={leftContent} className="landing-left-content">
            <h1 style={heroHeading}>
              Fixed rates, not fixed games.
            </h1>

            <div style={heroSubContainer}>
              <p style={heroSub}>
                <strong>One rate</strong>: Fixed-rate for all suppliers and borrowers through sealed auctions.
              </p>
              <p style={heroSub}>
                <strong>Zero game</strong>: Fair price discovery. No centralized auctioneers or blackbox mechanisms powered by confidential computing
              </p>
            </div>

            <button
              style={primaryBtn}
              onClick={() => navigate("/user")}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Borrow or Supply
            </button>
          </div>

          <div style={rightContent} className="landing-right-content">
            <video
              autoPlay
              loop
              muted
              playsInline
              style={videoBackground}
            >
              <source src="/bg.mov" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </>
  );
} 