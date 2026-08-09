"use client";

import React from "react";

interface PremiumMediaCardProps {
  media: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    media_type?: string;
    genre_ids?: number[];
  };
  onClick?: () => void;
}

export default function PremiumMediaCard({ media, onClick }: PremiumMediaCardProps) {
  // Free/₹0 Architecture: Proxying TMDB images directly to save on CDN costs
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";
  const posterUrl = media.poster_path 
    ? `${proxyUrl}/image/t/p/w500${media.poster_path}` 
    : media.backdrop_path 
    ? `${proxyUrl}/image/t/p/w500${media.backdrop_path}` 
    : "";

  const title = media.title || media.name;
  const year = media.release_date?.split("-")[0] || media.first_air_date?.split("-")[0] || "";
  const rating = media.vote_average?.toFixed(1) || "";
  const type = media.media_type === "tv" ? "TV Series" : media.media_type === "movie" ? "Movie" : media.media_type || "";

  return (
    <>
      <style>{`
        .dobinge-card {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 12px;
          background-color: #05020a;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
          will-change: transform;
          overflow: hidden; /* Enforces strict boundaries for the inner glow */
        }
        
        .dobinge-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          display: block;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dobinge-card-glow {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          /* 🚨 STRICT INSET FIX: Silver ring + minimal purple glow, perfectly contained inside the poster */
          box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.6), inset 0 0 30px rgba(168, 85, 247, 0.25);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          z-index: 2;
        }

        .dobinge-card-meta {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 40px 16px 16px 16px;
          background: linear-gradient(to top, rgba(2,1,4,0.95) 0%, rgba(2,1,4,0.6) 60%, transparent 100%);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          z-index: 3;
        }
        
        /* 🚨 TOUCH-DEVICE SAFEGUARD: Hover physics strictly bind to desktop/mouse pointers */
        @media (hover: hover) and (pointer: fine) {
          .dobinge-card:hover {
            transform: scale(1.02);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
            z-index: 50;
          }
          .dobinge-card:hover .dobinge-card-glow,
          .dobinge-card:hover .dobinge-card-meta {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="dobinge-card" onClick={onClick}>
        
        {/* DEFAULT STATE: Pure Poster Artwork */}
        {posterUrl ? (
          <img src={posterUrl} alt={title || "Media"} loading="lazy" className="dobinge-card-img" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 800, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px" }}>
            {title}
          </div>
        )}

        {/* HOVER STATE: Elegant Silver Ring + Contained Purple Glow */}
        <div className="dobinge-card-glow" />

        {/* HOVER STATE: Cinematic Metadata Reveal */}
        <div className="dobinge-card-meta">
          <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em", textShadow: "0 2px 4px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {title}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            {rating && <span style={{ color: "#fbbf24" }}>★ {rating}</span>}
            {rating && (year || type) && <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>}
            {year && <span>{year}</span>}
            {year && type && <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>}
            {type && <span style={{ textTransform: "uppercase" }}>{type}</span>}
          </div>
        </div>

        {/* ARCHITECTURAL PRESERVATION: Functional data preserved for screen readers and DOM hooks */}
        <div style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
          <span>Title: {title}</span>
          <span>Rating: {rating}</span>
          <span>Type: {type}</span>
          <span>Date: {year}</span>
        </div>
      </div>
    </>
  );
}