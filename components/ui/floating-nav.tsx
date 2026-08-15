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
      // Minimalist Home outline with hardcoded dimensions to prevent SVG scaling bugs
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
    <>
      <style>{`
        .dobinge-vertical-nav {
          position: fixed;
          z-index: 100000; /* Absolute supremacy over all composite GPU layers */
          display: flex;
        }
        
        /* DESKTOP LAYOUT - Locked into the 104px Grid Column */
        @media (min-width: 768px) {
          .dobinge-vertical-nav {
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            flex-direction: column;
            gap: 36px;
            width: 104px; /* Perfectly fills the nav grid track */
            align-items: center;
            justify-content: center;
          }
        }
        
        /* ULTRAWIDE LAYOUT - Docks perfectly to the left of the 1200px centered content */
        @media (min-width: 1360px) {
          .dobinge-vertical-nav {
            left: calc(50vw - 704px); /* 600px (half center content) + 104px (nav width) */
          }
        }
        
        /* MOBILE LAYOUT - Sleek frosted bottom edge */
        @media (max-width: 767px) {
          .dobinge-vertical-nav {
            bottom: 0;
            left: 0;
            width: 100%;
            flex-direction: row;
            justify-content: space-around;
            padding: 16px 0 24px 0;
            background: linear-gradient(to top, rgba(8,7,13,0.98) 0%, rgba(8,7,13,0.85) 60%, transparent 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
      
      <div className="dobinge-vertical-nav">
        {navItems.map((item) => {
          // Strict match for home so it doesn't stay lit up on sub-pages
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
    </>
  );
}