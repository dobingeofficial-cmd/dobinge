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
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";
  const posterUrl = media.poster_path 
    ? `${proxyUrl}/image/t/p/w500${media.poster_path}` 
    : media.backdrop_path 
    ? `${proxyUrl}/image/t/p/w500${media.backdrop_path}` 
    : "";

  return (
    <>
      <style>{`
        .dobinge-poster-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 16px;
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.03);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center bottom;
          z-index: 1;
          will-change: transform;
        }
        .dobinge-poster-glow {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.7), inset 0 0 40px rgba(168, 85, 247, 0.25);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* 🚨 STRICT TOUCH-DEVICE SAFEGUARD: Hover physics only execute on precise pointer devices */
        @media (hover: hover) and (pointer: fine) {
          .dobinge-poster-wrapper:hover {
            transform: scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            z-index: 10;
          }
          .dobinge-poster-wrapper:hover .dobinge-poster-glow {
            opacity: 1;
          }
        }
      `}</style>
      
      <div className="dobinge-poster-wrapper" onClick={onClick}>
        
        {/* Pure Cinematic Art */}
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={media.title || media.name || "Media Poster"} 
            loading="lazy"
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              borderRadius: "16px",
              display: "block",
              backgroundColor: "#05020a" 
            }} 
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 800 }}>
            {media.title || media.name}
          </div>
        )}

        {/* Minimalist Hover Physics: Silver Ring + Subtle Purple Inner Glow */}
        <div className="dobinge-poster-glow" />

        {/* 🚨 ARCHITECTURE SAFEGUARD: Functional metadata preserved in DOM but visually hidden */}
        <div style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
          <span>Title: {media.title || media.name}</span>
          <span>Rating: {media.vote_average}</span>
          <span>Type: {media.media_type}</span>
          <span>Date: {media.release_date || media.first_air_date}</span>
        </div>

      </div>
    </>
  );
}