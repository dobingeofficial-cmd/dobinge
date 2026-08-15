"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

interface MovieItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  media_type?: string;
  original_language?: string;
  genre_ids?: number[];
}

interface OmniverseModalProps {
  context: { title: string; data: MovieItem[] };
  filter: "all" | "movie" | "tv" | "anime";
  region: "all" | "in" | "en" | "ja" | "ko";
  onClose: () => void;
  onFilterChange: (filter: "all" | "movie" | "tv" | "anime") => void;
  onRegionChange: (region: "all" | "in" | "en" | "ja" | "ko") => void;
  onSelectMedia: (media: any) => void;
  filteredData: MovieItem[];
}

export default function OmniverseModal({
  context,
  filter,
  region,
  onClose,
  onFilterChange,
  onRegionChange,
  onSelectMedia,
  filteredData
}: OmniverseModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ position: "fixed", inset: 0, backgroundColor: "#08070D", zIndex: 1000, overflowY: "auto", padding: "0 24px 60px 24px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "24px", position: "sticky", top: 0, paddingTop: "24px", backgroundColor: "rgba(8,7,13,0.9)", backdropFilter: "blur(20px)", zIndex: 100, paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <motion.div 
          onClick={onClose}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          style={{ width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "#fff" }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </motion.div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff" }}>{context.title}</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em" }}>Exploring The Omniverse</p>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value as any)}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", padding: "8px 36px 8px 16px", borderRadius: "14px", fontSize: "12px", fontWeight: 800, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", backdropFilter: "blur(10px)"
              }}
            >
              <option value="all" style={{ background: "#08070D" }}>🌍 All Regions</option>
              <option value="in" style={{ background: "#08070D" }}>🇮🇳 India</option>
              <option value="en" style={{ background: "#08070D" }}>🇺🇸 Global</option>
              <option value="ja" style={{ background: "#08070D" }}>🇯🇵 Japan</option>
              <option value="ko" style={{ background: "#08070D" }}>🇰🇷 South Korea</option>
            </select>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.5)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(255,255,255,0.1)" }} />

          <div style={{ display: "flex", gap: "8px", backgroundColor: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { id: "all", label: "Everything" },
              { id: "movie", label: "Movies" },
              { id: "tv", label: "TV Shows" },
              { id: "anime", label: "Anime" }
            ].map(f => (
              <div 
                key={f.id}
                onClick={() => onFilterChange(f.id as any)}
                style={{
                  padding: "6px 16px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s",
                  backgroundColor: filter === f.id ? "rgba(168, 85, 247, 0.2)" : "transparent",
                  color: filter === f.id ? "#fff" : "rgba(255,255,255,0.5)",
                  boxShadow: filter === f.id ? "0 4px 15px rgba(168, 85, 247, 0.2)" : "none"
                }}
              >
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div style={{ width: "100%", height: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <span style={{ fontSize: "40px", opacity: 0.5 }}>🪐</span>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No signals found in this region.</p>
          <button onClick={() => { onFilterChange("all"); onRegionChange("all"); }} style={{ padding: "8px 24px", borderRadius: "20px", border: "1px solid rgba(168, 85, 247, 0.3)", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#c084fc", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>Reset Filters</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "32px 20px", marginTop: "32px" }}>
          <AnimatePresence>
            {filteredData.map((movie, idx) => (
              <motion.div key={`${movie.id}-${idx}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <PremiumMediaCard media={movie as any} onClick={() => onSelectMedia({ ...movie, mediaType: movie.media_type || "movie" })} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}