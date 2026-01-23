import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

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

  // If no validated invite code, redirect to invite page
  // Store the current location so we can redirect back after validation
  if (!isAuthorized) {
    return <Navigate to="/invite" state={{ from: location }} replace />;
  }

  // User has valid invite code, allow access
  return children;
}
