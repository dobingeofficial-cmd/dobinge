"use client";

import React from "react";
import { motion } from "framer-motion";

interface PremiumMediaCardProps {
  media: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number;
  };
  onClick?: () => void;
}

export default function PremiumMediaCard({ media, onClick }: PremiumMediaCardProps) {
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";
  const posterUrl = media.poster_path 
    ? `${proxyUrl}/image/t/p/w500${media.poster_path}` 
    : media.backdrop_path 
    ? `${proxyUrl}/image/t/p/w500${media.backdrop_path}` 
    : "";

  return (
    <motion.div
      onClick={onClick}
      whileHover="hover"
      initial="rest"
      animate="rest"
      variants={{
        rest: { scale: 1, y: 0, zIndex: 1 },
        hover: { scale: 1.05, y: -6, zIndex: 10 }
      }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "16px",
        cursor: "pointer",
        backgroundColor: "rgba(255,255,255,0.03)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      {/* Pure Cinematic Art */}
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt={media.title || media.name || "Media"} 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            borderRadius: "16px",
            display: "block" 
          }} 
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 800 }}>
          {media.title || media.name}
        </div>
      )}

      {/* Minimalist Hover Physics: Silver Ring + Subtle Purple Inner Glow */}
      <motion.div
        variants={{
          rest: { opacity: 0 },
          hover: { opacity: 1 }
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "16px",
          boxShadow: "0 0 0 2px rgba(226, 232, 240, 0.8), inset 0 0 30px rgba(168, 85, 247, 0.4)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}