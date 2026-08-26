"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HydratedMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genre_ids?: number[];
  original_language?: string;
}

interface SavedMedia {
  media_id: number;
  interaction_type: string;
  media_data: HydratedMedia; 
  created_at: string;
}

type FilterType = "all" | "movie" | "tv" | "anime";

export default function DevelopersPickView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const router = useRouter();
  const supabase = createClient();

  const [collection, setCollection] = useState<SavedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";
  const devUuid = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DEVELOPER_UUID : "";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

  // ── 1. BULLETPROOF HYDRATION & HEALING ENGINE ──
  useEffect(() => {
    let isMounted = true;

    const fetchDeveloperVault = async () => {
      // 🚨 Fallback: If devUuid isn't set, use the current logged-in user so it doesn't break during testing
      const { data: authData } = await supabase.auth.getUser();
      const targetUuid = devUuid || authData?.user?.id;

      if (!targetUuid) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 1. Pull the Developer's interactions from Supabase
        const { data, error } = await supabase
          .from("interactions")
          .select("*")
          .eq("user_id", targetUuid)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          if (isMounted) setCollection([]);
          return;
        }

        // 2. Pass through the Healing Pipeline
        if (isMounted) {
          const healedData = await healDataPipeline(data);
          // Only show items that were actually watchlisted or liked by the developer
          const developerPicks = healedData.filter((item: any) => 
            item.interaction_type === "watchlist" || item.interaction_type === "liked"
          );
          setCollection(developerPicks as SavedMedia[]);
        }
      } catch (error) {
        console.error("Developer Vault Initialization Failed:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDeveloperVault();
    return () => { isMounted = false; };
  }, [devUuid, supabase, proxyUrl, tmdbKey]);

  const parseMedia = (raw: any) => {
    if (!raw) return null;
    let parsed = raw;
    try {
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
    } catch (e) {
      return null;
    }
    return parsed;
  };

  const healDataPipeline = async (rawData: any[]) => {
    const healed = await Promise.all(rawData.map(async (d: any) => {
      let recoveredMedia = d.media_data || d.mediaData || d.media || null;
      recoveredMedia = parseMedia(recoveredMedia);
      
      const mediaId = d.media_id || d.mediaId || d.id;
      
      const rawAction = String(d.action_type || d.interaction_type || "watchlist").toUpperCase();
      let realTab = "watchlist";
      if (rawAction === "WATCHLIST" || rawAction === "DOWN") realTab = "watchlist";
      else if (rawAction === "WATCHED_LIKED" || rawAction === "LIKE" || rawAction === "DOUBLETAP" || rawAction === "LIKED") realTab = "liked";
      else realTab = "watched";

      if (!recoveredMedia && mediaId) {
        try {
          const endpoint = d.media_type === "tv" ? "tv" : "movie";
          if (proxyUrl) {
            let res = await fetch(`${proxyUrl}/api/${endpoint}/${mediaId}?language=en-US`);
            if (res.ok) recoveredMedia = { ...(await res.json()), media_type: d.media_type };
          }
          if (!recoveredMedia && tmdbKey) {
            let res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${mediaId}?api_key=${tmdbKey}`);
            if (res.ok) recoveredMedia = { ...(await res.json()), media_type: d.media_type };
          }
        } catch (e) {
          console.warn("Auto-heal skipped for", mediaId);
        }
      }

      if (!recoveredMedia) {
        recoveredMedia = { id: mediaId, title: "Data Recovering...", poster_path: null, media_type: d.media_type || "movie" };
      }

      return {
        ...d,
        media_data: recoveredMedia,
        media_id: mediaId,
        interaction_type: realTab,
        created_at: d.created_at || new Date().toISOString()
      };
    }));
    
    return healed;
  };

  // ── 2. THE FILTER ENGINE ──
  const filteredCollection = collection.filter((item) => {
    const media = item.media_data;
    if (!media) return false;
    
    if (activeFilter === "all") return true;
    
    const isAnime = media.media_type === "tv" && (media.original_language === "ja" || media.genre_ids?.includes(16));
    
    if (activeFilter === "movie") return media.media_type === "movie";
    if (activeFilter === "tv") return media.media_type === "tv" && !isAnime;
    if (activeFilter === "anime") return isAnime;
    
    return true;
  });

  const getPosterUrl = (path: string | null) => {
    if (!path) return "";
    return proxyUrl ? `${proxyUrl}/image/t/p/w500${path}` : `https://image.tmdb.org/t/p/w500${path}`;
  };

  return (
    <div style={{ width: "100%", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      
      {/* ── HEADER & FILTERS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", paddingRight: "32px" }}>
        <div>
          <motion.button onClick={() => router.push('/home')} whileHover={{ x: -4, color: "#ffffff" }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", padding: 0, marginBottom: "16px", transition: "color 0.2s" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg> Back
          </motion.button>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em", color: "#ffffff" }}>
            Developer's Pick
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "rgba(168, 85, 247, 0.9)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Your collection, reimagined.
          </p>
        </div>

        {/* Liquid Glass Filter */}
        <div style={{ display: "flex", gap: "8px", backgroundColor: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          {[
            { id: "all", label: "All" },
            { id: "movie", label: "Movies" },
            { id: "tv", label: "TV Shows" },
            { id: "anime", label: "Anime" }
          ].map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "8px 16px",
                borderRadius: "18px",
                backgroundColor: activeFilter === filter.id ? "rgba(168, 85, 247, 0.2)" : "transparent",
                color: activeFilter === filter.id ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: `1px solid ${activeFilter === filter.id ? "rgba(192, 132, 252, 0.4)" : "transparent"}`,
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── THE CINEMATIC WALL ENGINE ── */}
      <div style={{ flex: 1, position: "relative" }}>
        
        {/* Ambient Fog Edges */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100px", height: "100%", background: "linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 100%)", pointerEvents: "none", zIndex: 10 }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "100%", background: "linear-gradient(to left, rgba(0,0,0,1) 0%, transparent 100%)", pointerEvents: "none", zIndex: 10 }} />

        {isLoading ? (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "40px", height: "40px", border: "3px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
            <p style={{ marginTop: "16px", fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>Accessing Vault...</p>
          </div>
        ) : filteredCollection.length === 0 ? (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <span style={{ fontSize: "48px", filter: "drop-shadow(0 0 20px rgba(168,85,247,0.3))" }}>✨</span>
            <h2 style={{ margin: "16px 0 8px 0", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em" }}>The Vault is Empty</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Save movies, shows, or anime and they'll appear here.</p>
            <motion.button onClick={() => router.push('/home')} whileHover={{ scale: 1.05, backgroundColor: "#ffffff" }} whileTap={{ scale: 0.95 }} style={{ padding: "12px 28px", borderRadius: "30px", backgroundColor: "#e2e8f0", color: "#000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>Explore</motion.button>
          </div>
        ) : (
          
          /* 🚨 ANTI-CLIPPING SCROLL CONTAINER */
          <div className="no-scrollbar" style={{ width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden", display: "flex", alignItems: "center", padding: "60px 200px 60px 40px" }}>
            <div style={{ display: "flex", gap: "16px", height: "100%" }}>
              
              {filteredCollection.map((item, idx) => {
                const media = item.media_data;
                const isHovered = hoveredId === media.id;
                const isDimmed = hoveredId !== null && hoveredId !== media.id;

                return (
                  <motion.div
                    key={`${media.id}-${idx}`}
                    onHoverStart={() => setHoveredId(media.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type })}
                    animate={{ 
                      scale: isHovered ? 1.06 : 1, 
                      opacity: isDimmed ? 0.3 : 1,
                      filter: isDimmed ? "grayscale(80%) blur(2px)" : "grayscale(0%) blur(0px)",
                      y: idx % 2 === 0 ? 0 : 20 
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "relative",
                      height: "100%",
                      aspectRatio: "2/3.2", 
                      borderRadius: "24px",
                      backgroundColor: "#160B24",
                      cursor: "pointer",
                      zIndex: isHovered ? 50 : 1,
                      border: isHovered ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: isHovered ? "0 40px 80px rgba(168, 85, 247, 0.4), inset 0 2px 20px rgba(255,255,255,0.2)" : "0 20px 40px rgba(0,0,0,0.8)",
                      overflow: "hidden" 
                    }}
                  >
                    {media.poster_path ? (
                      <img 
                        src={getPosterUrl(media.poster_path)} 
                        alt="" 
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: isHovered ? "scale(1.02)" : "scale(1)" }} 
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 800 }}>NO POSTER</div>
                    )}
                    
                    <div style={{ position: "absolute", inset: 0, background: isHovered ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 30%, transparent 100%)" : "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)", transition: "background 0.4s" }} />

                    <AnimatePresence>
                      {isHovered && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }}
                          style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 20px", display: "flex", flexDirection: "column", gap: "6px" }}
                        >
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#fff", lineHeight: 1.2, textShadow: "0 2px 10px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {media.title || media.name}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                            <span>{media.release_date?.split("-")[0] || media.first_air_date?.split("-")[0] || "TBA"}</span>
                            <span style={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: "2px" }}><svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> {media.vote_average?.toFixed(1) || "NR"}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}