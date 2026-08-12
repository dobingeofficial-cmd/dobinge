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
          backgroundColor: "#000000", // 🚨 FIXED: Pitch Black
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* 🚨 THEME UPGRADE: Cinematic Ambient Purple & Silver Glow */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "radial-gradient(circle at 20% 30%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(192, 192, 192, 0.04) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />
        
        <div 
          style={{ 
            position: "absolute", 
            bottom: "-10%", 
            left: "50%", 
            transform: "translateX(-50%)", 
            width: "90vw", 
            height: "50vh", 
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, rgba(220, 220, 220, 0.02) 40%, transparent 80%)", 
            filter: "blur(60px)", 
            pointerEvents: "none", 
            zIndex: 1 
          }} 
        />

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