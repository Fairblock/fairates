import React from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { COLORS, FONT_FAMILY } from "../styles.js";

export function LandingPage() {
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Home" },
    { to: "/developer/deploy", label: "Deploy" },
    { to: "/developer/manage", label: "Manage" },
    { to: "/developer/faucet", label: "Faucet" },
  ];

  const heroWrap = {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "50px 20px 100px",
    textAlign: "center",
  };

  const heroHeading = {
    fontSize: "clamp(2rem, 6vw, 3rem)",
    fontWeight: 400,
    lineHeight: 1.1,
    marginBottom: "24px",
    color: "#fff",
    fontFamily: FONT_FAMILY,
  };

  const heroSubContainer = {
    maxWidth: "650px",
    margin: "0 auto 56px",
    textAlign: "left",
  };

  const heroSub = {
    fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
    lineHeight: 1.5,
    margin: "0 0 24px",
    color: COLORS.textMuted,
  };

  const ctaRow = {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  };

  const primaryBtn = {
    background: COLORS.accent,
    color: "#FFF",
    border: "none",
    padding: "14px 32px",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background .18s",
    fontFamily: FONT_FAMILY,
  };

  return (
    <>
      <TopBar sectionLinks={links} />

      <div style={heroWrap}>
        <h1 style={heroHeading}>
          Fixed <span style={{ color: COLORS.accent }}>rates</span>,<br />
          not fixed games.
        </h1>

        <div style={heroSubContainer}>
          <p style={heroSub}>
            <strong>One rate</strong>: Fixed-rate for all lenders and borrowers through sealed-bid auctions.
          </p>
          <p style={heroSub}>
            <strong>Zero game</strong>: Fair price discovery. No centralized auctioneers or blackbox mechanisms powered by confidential computing.
          </p>
        </div>

        <div style={ctaRow}>
          <button
            style={{ ...primaryBtn, flex: "0 0 220px" }}
            onClick={() => navigate("/user")}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.accentHover)}
            onMouseLeave={e => (e.currentTarget.style.background = COLORS.accent)}
          >
            Bid or Supply
          </button>

          <button
            style={{ ...primaryBtn, flex: "0 0 220px" }}
            onClick={() =>
              window.open(
                "https://docs.fairblock.network/docs/Fairates",
                "_blank",
                "noopener,noreferrer",
              )
            }
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.accentHover)}
            onMouseLeave={e => (e.currentTarget.style.background = COLORS.accent)}
          >
            Deep Dive
          </button>
        </div>
      </div>
    </>
  );
} 