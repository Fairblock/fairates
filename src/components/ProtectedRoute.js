import React from "react";
import { Navigate } from "react-router-dom";
import { InviteOnlyPage } from "../pages/InviteOnlyPage";

export function ProtectedRoute({ children }) {
  // Check if user has a validated invite code
  const inviteCodeValidated = localStorage.getItem("inviteCodeValidated") === "true";
  const inviteCode = localStorage.getItem("inviteCode");

  // If no validated invite code, show invite-only page
  if (!inviteCodeValidated || !inviteCode) {
    return <InviteOnlyPage />;
  }

  // User has valid invite code, allow access
  return children;
}
