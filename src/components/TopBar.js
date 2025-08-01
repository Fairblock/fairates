import React from "react";
import { Link } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";
import { topBarStyle, navLink, logoStyle } from "../styles.js";

export function TopBar({ sectionLinks = [] }) {
  return (
    <nav style={topBarStyle}>
      <img src="/fairates-logo.png" alt="Fairates" style={logoStyle} />

      {sectionLinks.map(({ to, label }) => (
        <Link key={label} to={to} style={navLink} className="nav-link">
          {label}
        </Link>
      ))}

      <WalletConnect />
    </nav>
  );
} 