"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function FloatingNav() {
  const pathname = usePathname() || "/home"; 

  const navItems = [
    { 
      id: "home", 
      path: "/home", 
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
    },
    { 
      id: "search", 
      path: "/home/search", 
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> 
    },
    { 
      id: "swipe", 
      path: "/home/swipe", 
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
    },
    { 
      id: "saved", 
      path: "/home/saved", 
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> 
    },
    { 
      id: "profile", 
      path: "/home/profile", 
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> 
    }
  ];

  return (
    <div style={{
      position: "fixed",
      zIndex: 2147483647, /* Maximum CSS supremacy */
      top: "50%",
      left: "24px",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column", /* Absolute lock to vertical stack */
      gap: "36px",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto",
      willChange: "transform"
    }}>
      {navItems.map((item) => {
        const isActive = item.path === "/home" ? pathname === "/home" : pathname.startsWith(item.path);

        return (
          <Link key={item.id} href={item.path} style={{ textDecoration: "none", outline: "none" }}>
            <motion.div
              whileHover={{ scale: 1.15, color: "rgba(255, 255, 255, 0.9)" }}
              whileTap={{ scale: 0.9 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                color: isActive ? "#c084fc" : "rgba(255, 255, 255, 0.35)",
                filter: isActive ? "drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))" : "none",
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