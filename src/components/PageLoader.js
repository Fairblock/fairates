import React from "react";

export function PageLoader({ loading }) {
  if (!loading) return null;
  return (
    <div className="auction-loading-overlay">
      <div className="auction-loading-loader" />
    </div>
  );
}

