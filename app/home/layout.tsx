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
          backgroundColor: "#020104", 
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Cinematic Ambient Core Background Lighting Glow */}
        <div 
          style={{ 
            position: "absolute", 
            bottom: "-5%", 
            left: "50%", 
            transform: "translateX(-50%)", 
            width: "90vw", 
            height: "40vh", 
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 80%)", 
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