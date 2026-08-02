"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingNavProps {
  activeTab: "home" | "search" | "swipe" | "saved" | "profile" | "more";
  setActiveTab: (tab: "home" | "search" | "swipe" | "saved" | "profile" | "more") => void;
}

export default function FloatingNav({ activeTab, setActiveTab }: FloatingNavProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems = [
    { id: "home", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: "search", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { id: "swipe", icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
    { id: "saved", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> },
    { id: "profile", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "more", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", justifyContent: isMobile ? "space-around" : "center",
      gap: isMobile ? "0" : "20px", padding: isMobile ? "12px 20px" : "24px 0px", width: isMobile ? "100%" : "44px", boxSizing: "border-box",
      backgroundColor: "transparent", border: "none"
    }}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const isSwipe = item.id === "swipe";

        return (
          <motion.div
            key={item.id} whileHover={{ scale: 1.15, y: isMobile ? -3 : 0 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(item.id as any)}
            style={{
              position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              width: isSwipe ? "40px" : "32px", height: isSwipe ? "40px" : "32px", borderRadius: "50%",
              color: isActive ? (isSwipe ? "#ffffff" : "#C084FC") : "rgba(255, 255, 255, 0.4)",
              background: isSwipe && isActive ? "linear-gradient(135deg, #A855F7 0%, #C084FC 100%)" : "transparent",
              boxShadow: isSwipe && isActive ? "0 10px 20px rgba(168, 85, 247, 0.4)" : "none", transition: "color 0.2s ease", zIndex: 10
            }}
          >
            {item.icon}
            {isActive && !isSwipe && (
              <motion.div layoutId="activeNavGlow" style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "rgba(168, 85, 247, 0.15)", filter: "blur(8px)", zIndex: -1 }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}