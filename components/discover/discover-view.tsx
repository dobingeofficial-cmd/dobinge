"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

// Core mood nodes from our neural architecture
const MOOD_NODES = [
  { id: "Rainy Vibes", emoji: "🌧", floatClass: "float-slow" },
  { id: "Mind Blowing", emoji: "🤯", floatClass: "float-medium" },
  { id: "Zombie Lover", emoji: "🧟", floatClass: "float-fast" },
  { id: "Comfort Watch", emoji: "🛋", floatClass: "float-slow" },
  { id: "Plot Twist", emoji: "🧩", floatClass: "float-medium" },
  { id: "Breakup", emoji: "💔", floatClass: "float-fast" },
  { id: "Weekend Binge", emoji: "🍿", floatClass: "float-slow" },
  { id: "Sci-Fi Fantasy", emoji: "🛸", floatClass: "float-medium" },
  { id: "Anime Fan", emoji: "⛩️", floatClass: "float-fast" },
];

export default function DiscoverView() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12vh", paddingBottom: "100px", zIndex: 10 }}>
      
      {/* ── 🌌 AMBIENT SPATIAL LIGHTING ── */}
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "400px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: -1 }} />

      {/* ── 🔍 LIQUID GLASS SEARCH BAR ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "90%", maxWidth: "700px", position: "relative", zIndex: 20 }}
      >
        <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: "24px", color: "rgba(255,255,255,0.4)" }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Actors, directors, movies, anime..."
            style={{ width: "100%", padding: "24px 24px 24px 64px", fontSize: "18px", fontWeight: 500, color: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "40px", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", outline: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)", transition: "all 0.3s ease" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(168, 85, 247, 0.2), inset 0 1px 2px rgba(255,255,255,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)"; }}
          />
        </div>
      </motion.div>

      {/* ── 🪐 FLOATING MOOD CONSTELLATION ── */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
        style={{ width: "100%", maxWidth: "900px", marginTop: "8vh", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", padding: "0 20px", zIndex: 10 }}
      >
        {MOOD_NODES.map((node, idx) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.05, ease: "easeOut" }}
            className={node.floatClass}
          >
            <motion.button
              whileHover={{ scale: 1.08, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(168, 85, 247, 0.4)", boxShadow: "0 15px 30px rgba(168, 85, 247, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 28px", borderRadius: "40px", backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", backdropFilter: "blur(12px)", cursor: "pointer", color: "#ffffff", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
            >
              <span style={{ fontSize: "20px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{node.emoji}</span>
              <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em" }}>{node.id}</span>
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}