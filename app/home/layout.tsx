"use client";

import React from "react";
import { ViewProvider } from "@/context/ViewContext";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewProvider>
      <div 
        style={{ 
          width: "100vw", 
          height: "100vh", 
          backgroundColor: "#000000", // 🚨 ABSOLUTE VOID: Pitch Black
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* 🚨 HARD FIX: SVG Noise Filter completely eradicated. Pure black restored. */}

        {/* Unified Main Workspace Container */}
        <main 
          style={{ 
            flex: 1, 
            width: "100%", 
            height: "100%", 
            overflowY: "auto", 
            position: "relative", 
            zIndex: 2,
            boxSizing: "border-box"
          }} 
          className="hide-scrollbar"
        >
          {children}
        </main>
      </div>
    </ViewProvider>
  );
}