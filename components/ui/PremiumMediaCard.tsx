"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  media_type?: string;
}

interface PremiumMediaCardProps {
  media: TMDBMedia;
  onClick?: () => void;
  layoutId?: string;
}

export default function PremiumMediaCard({ media, onClick, layoutId }: PremiumMediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 🚨 HARD FIX: Bulletproof Guard Clause
  // If a ghost entry from the database is passed without media data, silently abort rendering.
  if (!media) return null;

  // ── METADATA EXTRACTION ──
  const title = media.title || media.name || media.original_title || media.original_name || "Unknown Title";
  const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : null;
  const rating = media.vote_average ? media.vote_average.toFixed(1) : "NR";
  const year = (media.release_date || media.first_air_date)?.split("-")[0] || "";
  const type = media.media_type === "tv" ? "TV Series" : media.media_type === "movie" ? "Movie" : "Anime";

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.96 }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 3",
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: "rgba(10, 6, 18, 0.8)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: isHovered ? "0 20px 40px rgba(168, 85, 247, 0.25)" : "0 10px 30px rgba(0,0,0,0.5)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        borderColor: isHovered ? "rgba(192, 132, 252, 0.5)" : "rgba(255,255,255,0.05)",
      }}
    >
      {/* ── BACKGROUND POSTER LAYER ── */}
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
            transform: isHovered ? "scale(1.08)" : "scale(1.02)",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", padding: "16px", textAlign: "center" }}>
          <span style={{ fontSize: "24px", opacity: 0.3 }}>🎬</span>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Asset Missing</span>
        </div>
      )}

      {/* ── PERSISTENT RATING BADGE ── */}
      <motion.div 
        animate={{ opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ position: "absolute", top: "10px", right: "10px", padding: "4px 8px", borderRadius: "12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "4px", zIndex: 5 }}
      >
        <span style={{ fontSize: "9px", fontWeight: 900, color: "#fbbf24" }}>★ {rating}</span>
      </motion.div>

      {/* ── LIQUID GLASS HOVER OVERLAY ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10, 6, 18, 0.98) 0%, rgba(168, 85, 247, 0.35) 45%, rgba(10, 6, 18, 0.1) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "16px",
          boxSizing: "border-box",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          {year && (
            <span style={{ fontSize: "9px", fontWeight: 800, padding: "4px 8px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", color: "#fff", letterSpacing: "0.05em" }}>
              {year}
            </span>
          )}
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px", filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))" }}>
            ★ {rating}
          </span>
        </div>

        <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
          {title}
        </h3>

        <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {type}
        </span>
      </motion.div>
    </motion.div>
  );
}