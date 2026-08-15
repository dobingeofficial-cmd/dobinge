"use client";
import React from "react";

export default function SearchPage() {
  // If you have an existing SearchView component, you will import and return it here later.
  return (
    <div style={{ width: "100%", minHeight: "calc(100vh - 70px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: "48px", filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))", marginBottom: "16px" }}>🔍</span>
      <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Search Matrix</h1>
      <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Route Initialized</p>
    </div>
  );
}