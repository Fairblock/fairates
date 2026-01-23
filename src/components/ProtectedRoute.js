import React, { useState, useEffect } from "react";
import { InviteOnlyPage } from "../pages/InviteOnlyPage";

export function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has a validated invite code
    const checkAuthorization = () => {
      const inviteCodeValidated = localStorage.getItem("inviteCodeValidated") === "true";
      const inviteCode = localStorage.getItem("inviteCode");
      setIsAuthorized(inviteCodeValidated && !!inviteCode);
      setIsChecking(false);
    };

    // Check immediately
    checkAuthorization();

    // Listen for storage changes (in case localStorage is updated in another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === "inviteCodeValidated" || e.key === "inviteCode") {
        checkAuthorization();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Show loading state briefly while checking
  if (isChecking) {
    return null; // or a loading spinner
  }

  // If no validated invite code, show invite-only page
  if (!isAuthorized) {
    return <InviteOnlyPage />;
  }

  // User has valid invite code, allow access
  return children;
}
