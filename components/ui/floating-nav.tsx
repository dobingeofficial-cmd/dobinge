"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function FloatingNav() {
  const pathname = usePathname(); // 🚨 This detects the current URL automatically

  const navItems = [
    { 
      id: "home", 
      path: "/home", 
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },
    { 
      id: "search", 
      path: "/home/search", 
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> 
    },
    { 
      id: "swipe", 
      path: "/home/swipe", 
      icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      isFeatured: true // Makes the swipe button slightly larger
    },
    { 
      id: "saved", 
      path: "/home/saved", 
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> 
    },
    { 
      id: "profile", 
      path: "/home/profile", 
      icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
    }
  ];

  return (
    <div style={{ position: "fixed", left: "24px", top: "50%", transform: "translateY(-50%)", zIndex: 1000, display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "rgba(8,7,13,0.6)", backdropFilter: "blur(20px)", padding: "24px 12px", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }}>
      {navItems.map((item) => {
        // Strict match for home so it doesn't stay lit up on sub-pages
        const isActive = item.path === "/home" ? pathname === "/home" : pathname.startsWith(item.path);

        return (
          <Link key={item.id} href={item.path} style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: item.isFeatured ? "48px" : "40px",
                height: item.isFeatured ? "48px" : "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: isActive 
                  ? (item.isFeatured ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.1)") 
                  : "transparent",
                color: isActive 
                  ? (item.isFeatured ? "#c084fc" : "#ffffff") 
                  : "rgba(255,255,255,0.4)",
                border: isActive && item.isFeatured ? "1px solid rgba(192, 132, 252, 0.4)" : "1px solid transparent",
                boxShadow: isActive && item.isFeatured ? "0 0 20px rgba(168, 85, 247, 0.4)" : "none"
              }}
            >
              {item.icon}
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}