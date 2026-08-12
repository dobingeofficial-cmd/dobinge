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
          backgroundColor: "#08070D", // 🚨 OBSIDIAN CINEMA: Deep near-black base
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* 🚨 OBSIDIAN CINEMA: Static Atmospheric Depth (Plum, Indigo, Burgundy) */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "radial-gradient(circle at 15% 0%, #160B24 0%, transparent 60%), radial-gradient(circle at 85% 100%, #0D1024 0%, transparent 60%), radial-gradient(circle at 50% 50%, #180A12 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Cinematic Grain Overlay (Subtle Texture) */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, zIndex: 1, pointerEvents: "none" }} />

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