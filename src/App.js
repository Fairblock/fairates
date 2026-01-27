import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { LandingPage } from "./pages/LandingPage";
import { DeployPage } from "./pages/DeployPage";
import { ManageAuctionsPage } from "./pages/ManageAuctionsPage";
import { AuctionManagementPage } from "./pages/AuctionManagementPage";
import { UserDashboard } from "./pages/UserDashboard";
import { UserAuctionPage } from "./pages/UserAuctionPage";
import { FaucetPage } from "./pages/FaucetPage";
import { InviteOnlyPage } from "./pages/InviteOnlyPage";
import { DeveloperWrapper } from "./components/DeveloperWrapper";
import { UserWrapper } from "./components/UserWrapper";
import { BackgroundManager } from "./components/BackgroundManager";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import "./App.css";

function AppContent() {
  const { toast, hideToast } = useAppContext();

  return (
    <>
      <Router>
        <BackgroundManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/invite" element={<InviteOnlyPage />} />
          <Route
            path="/developer/*"
            element={
              <ProtectedRoute>
                <DeveloperWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/*"
            element={
              <ProtectedRoute>
                <UserWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;