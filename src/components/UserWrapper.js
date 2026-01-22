import React from "react";
import { Routes, Route } from "react-router-dom";
import { TopBar } from "./TopBar";
import { UserDashboard } from "../pages/UserDashboard";
import { UserAuctionPage } from "../pages/UserAuctionPage";
import { FaucetPage } from "../pages/FaucetPage";

export function UserWrapper() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/user", label: "Participate" },
    { to: "/user/faucet", label: "Faucet" },
  ];
  
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar sectionLinks={links} />
      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="auction/:auctionAddress" element={<UserAuctionPage />} />
        <Route path="faucet" element={<FaucetPage />} />
        <Route path="*" element={<UserDashboard />} />
      </Routes>
    </div>
  );
} 