"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      
      gsap.to(glowRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: "power2.out",
        force3D: true, 
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={canvasRef} 
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden", backgroundColor: "#000000" }}
    >
      {/* 🚨 ARCHITECTURE UPGRADE: True OLED Pitch Black Base */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#000000" }} />
      
      {/* 🚨 THEME UPGRADE: Static Ambient Purple & Silver Fusion */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "radial-gradient(circle at 20% 30%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(192, 192, 192, 0.04) 0%, transparent 50%)" }} />

      {/* Dynamic Mouse Glow Tracker - Concentrated Silver-Purple Core */}
      <div 
        ref={glowRef}
        style={{ 
          position: "absolute", 
          top: "-300px", 
          left: "-300px", 
          width: "600px", 
          height: "600px", 
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(220, 220, 220, 0.05) 30%, transparent 70%)", 
          filter: "blur(60px)",
          willChange: "transform" 
        }} 
      />

      {/* Cinematic Grain Overlay */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}