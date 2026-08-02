"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      
      // 🚨 HARD FIX: Stripped invalid 'xValues/yValues'. Enforced native 3D GPU mapping.
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
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", backgroundColor: "#000000" }}
    >
      {/* Pitch Black Base */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#000000" }} />
      
      {/* Ambient Purple / Silver Gradient Base */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.3, background: "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.05) 0%, transparent 80%)" }} />

      {/* Dynamic Mouse Glow Tracker */}
      <div 
        ref={glowRef}
        style={{ 
          position: "absolute", 
          top: "-300px", 
          left: "-300px", 
          width: "600px", 
          height: "600px", 
          borderRadius: "50%", 
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)", 
          filter: "blur(60px)",
          willChange: "transform" 
        }} 
      />

      {/* Cinematic Grain Overlay */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
}