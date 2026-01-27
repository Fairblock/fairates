import React from "react";
import { Routes, Route } from "react-router-dom";
import { TopBar } from "./TopBar";
import { DeployPage } from "../pages/DeployPage";
import { ManageAuctionsPage } from "../pages/ManageAuctionsPage";
import { AuctionManagementPage } from "../pages/AuctionManagementPage";
import { FaucetPage } from "../pages/FaucetPage";

export function DeveloperWrapper() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/user", label: "Participate" },
    { to: "/developer/deploy", label: "Deploy" },
    { to: "/developer/manage", label: "Manage" },
    { to: "/developer/faucet", label: "Faucet" },
  ];
  
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar sectionLinks={links} />
      <Routes>
        <Route path="deploy" element={<DeployPage />} />
        <Route path="auction/:aeAddress" element={<AuctionManagementPage />} />
        <Route path="manage" element={<ManageAuctionsPage />} />
        <Route path="faucet" element={<FaucetPage />} />
        <Route path="*" element={<DeployPage />} />
      </Routes>
    </div>
  );
} 