"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoodType {
  id: string;
  emoji: string;
  query: string;
  subtitle: string;
}

interface MoodSidebarProps {
  sortedMoods: MoodType[];
  selectedMood: MoodType;
  handleMoodSelect: (mood: MoodType) => void;
  featuredMoodBg: any | null;
  aiMatchPercent: number;
  getTitleCount: (id: string) => string;
  getBackdropUrl: (path: string | null) => string;
}

export default function MoodSidebar({
  sortedMoods,
  selectedMood,
  handleMoodSelect,
  featuredMoodBg,
  aiMatchPercent,
  getTitleCount,
  getBackdropUrl
}: MoodSidebarProps) {
  return (
    <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", height: "600px" }}>
        <div style={{ flexShrink: 0, height: "48px", display: "flex", alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>What's Your Mood?</h3>
          </motion.div>
        </div>

        <div className="no-scrollbar" style={{ 
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", 
          padding: "4px 4px 40px 4px", WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" 
        }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={`featured-${selectedMood.id}`}
              initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              style={{ width: "100%", height: "190px", borderRadius: "24px", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", flexShrink: 0, border: "1px solid rgba(168, 85, 247, 0.4)", backgroundColor: "#08070D" }}
            >
              {featuredMoodBg && (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} src={getBackdropUrl(featuredMoodBg.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,7,13,0.95) 0%, rgba(8,7,13,0.4) 40%, rgba(8,7,13,0.1) 100%)" }} />
              {selectedMood.id !== "All" && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(168, 85, 247, 0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(192, 132, 252, 0.3)", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                  <span style={{ fontSize: "14px" }}>✨</span>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>AI Match {aiMatchPercent}%</span>
                </motion.div>
              )}
              <div style={{ position: "absolute", bottom: "16px", left: "20px", right: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(8,7,13, 0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 10px 20px rgba(0,0,0,0.5)", flexShrink: 0 }}>
                  {selectedMood.emoji}
                </motion.div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <motion.h4 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ margin: "0 0 2px 0", fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>{selectedMood.id}</motion.h4>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ margin: 0, fontSize: "11px", color: "#a855f7", fontWeight: 700, letterSpacing: "0.05em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{selectedMood.subtitle}</motion.p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sortedMoods.filter((m: any) => m.id !== selectedMood.id).map((mood: any) => (
              <motion.div key={`list-${mood.id}`} onClick={() => handleMoodSelect(mood)} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }} whileTap={{ scale: 0.98 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{mood.emoji}</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{mood.id}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{mood.subtitle.split(' • ')[0]} • {mood.subtitle.split(' • ')[1] || "Curated"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: "12px" }}>{getTitleCount(mood.id)}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}