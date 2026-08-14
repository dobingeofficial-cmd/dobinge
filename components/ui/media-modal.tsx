"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface SimilarMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
}

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  tagline?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number | null;
  mediaType: "movie" | "tv";
}

export default function MediaModal({ isOpen, onClose, mediaId, mediaType }: MediaModalProps) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarMedia[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time Database Interaction Sync States
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [interactionIdMap, setInteractionIdMap] = useState<Record<string, string>>({});

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // ── 📡 REAL-TIME DATA LOOKUP ──
  const syncModalInteractions = useCallback(async () => {
    if (!mediaId) return;
    const supabase = createClient();
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: userRows, error } = await supabase
        .from("interactions")
        .select("id, interaction_type")
        .eq("user_id", authData.user.id)
        .eq("media_id", mediaId);

      if (error) return; 

      if (userRows) {
        const mappedIds: Record<string, string> = {};
        let likedState = false;
        let watchlistedState = false;
        let watchedState = false;

        userRows.forEach((row) => {
          mappedIds[row.interaction_type] = row.id;
          if (row.interaction_type === "liked") likedState = true;
          if (row.interaction_type === "watchlist") watchlistedState = true;
          // 🚨 FIXED: Properly mapped to "watched" history state
          if (row.interaction_type === "watched") watchedState = true;
        });

        setIsLiked(likedState);
        setIsWatchlisted(watchlistedState);
        setIsWatched(watchedState);
        setInteractionIdMap(mappedIds);
      }
    } catch (err) {
      console.error("DoBinge Sync Error:", err);
    }
  }, [mediaId]);

  useEffect(() => {
    if (!isOpen || !mediaId || !proxyUrl) return;

    const fetchDetails = async () => {
      setLoading(true);
      setTrailerKey(null);
      setIsPlayingTrailer(false);
      setErrorMessage("");
      
      try {
        const [detailsRes, creditsRes, videosRes, similarRes] = await Promise.all([
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}?language=en-US`),
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/credits?language=en-US`),
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/videos?language=en-US`),
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/similar?language=en-US`)
        ]);

        const detailsData = await detailsRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();
        const similarData = await similarRes.json();

        setDetails(detailsData);
        setCast(creditsData.cast || []);
        setSimilar(similarData.results || []);

        if (videosData.results) {
          const videoTracks = videosData.results;
          const officialTrailer = videoTracks.find((v: any) => v.site === "YouTube" && v.type === "Trailer" && v.name.toLowerCase().includes("official"));
          const mainTrailer = videoTracks.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
          const teaser = videoTracks.find((v: any) => v.site === "YouTube" && v.type === "Teaser");
          const featurette = videoTracks.find((v: any) => v.site === "YouTube");

          const selectedTrack = officialTrailer || mainTrailer || teaser || featurette;
          if (selectedTrack) {
            setTrailerKey(selectedTrack.key);
          }
        }

        await syncModalInteractions();
      } catch (err) {
        console.error("Media Modal Pipeline Failure:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, mediaId, mediaType, syncModalInteractions, proxyUrl]);

  // ── 🛰️ RACE-PROOF DATABASE INTERACTION GATEWAY ──
  // 🚨 FIXED: Corrected type signature to accept "watched"
  const handleInteractionToggle = async (type: "liked" | "watchlist" | "watched") => {
    if (!mediaId || isProcessing) return;
    setIsProcessing(true); 

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      setErrorMessage("Please sign in to save interactions.");
      setTimeout(() => setErrorMessage(""), 4000);
      setIsProcessing(false);
      return;
    }
    
    const user = authData.user;
    const targetExistingId = interactionIdMap[type];

    if (type === "liked") setIsLiked(!targetExistingId);
    if (type === "watchlist") setIsWatchlisted(!targetExistingId);
    if (type === "watched") setIsWatched(!targetExistingId);

    try {
      if (targetExistingId) {
        await supabase.from("interactions").delete().eq("id", targetExistingId);
        setInteractionIdMap(prev => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
      } else {
        const { data, error } = await supabase
          .from("interactions")
          .upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: mediaType,
            interaction_type: type
          }, { onConflict: 'user_id, media_id, interaction_type' })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setInteractionIdMap(prev => ({ ...prev, [type]: data.id }));
        }
      }
    } catch (error) {
      syncModalInteractions(); 
      console.error("Database interaction failed:", error);
    } finally {
      setIsProcessing(false); 
    }
  };

  if (!isOpen) return null;

  const getPosterUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/w500${path}` : "";
  const getBackdropUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/original${path}` : "";
  const getProfileUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/w185${path}` : "";

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box" }}>
        
        {/* Blurred Background Overlay */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 1, 4, 0.85)", backdropFilter: "blur(20px)" }} />

        {/* Cinematic Trailer Overlay */}
        <AnimatePresence>
          {isPlayingTrailer && trailerKey && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "absolute", inset: "40px", zIndex: 2000, backgroundColor: "#000", borderRadius: "24px", overflow: "hidden", boxShadow: "0 50px 100px rgba(0,0,0,1)" }}>
              <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none" }} />
              <button onClick={() => setIsPlayingTrailer(false)} style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚨 TIGHTENED COMPACT MODAL WRAPPER */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: "100%", maxWidth: "950px", maxHeight: "85vh", overflowY: "auto", backgroundColor: "#08070D", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", position: "relative", zIndex: 10, boxShadow: "0 50px 100px rgba(0,0,0,0.95)" }}
          className="no-scrollbar"
        >
          <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>✕</button>

          {loading || !details ? (
            <div style={{ width: "100%", height: "500px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Assembling Media Stream Node...</span>
            </div>
          ) : (
            <>
              {/* ── 🌌 HERO BLEED BACKDROP (Tightened) ── */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "450px", zIndex: 0, pointerEvents: "none" }}>
                {details.backdrop_path && (
                  <img src={getBackdropUrl(details.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #08070D 0%, transparent 100%)" }} />
              </div>

              {/* ── 🎬 MAIN CONTENT WRAPPER ── */}
              <div style={{ position: "relative", zIndex: 10, padding: "40px", display: "flex", flexDirection: "column" }}>
                
                {/* ── 🎛️ TOP ROW: IDENTITY MATRIX (Tightened Proportions) ── */}
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 220px", gap: "32px", alignItems: "flex-start" }}>
                  
                  {/* Left: Floating Poster & Trailer Button */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
                    <div style={{ padding: "6px", backgroundColor: "#EAE5D9", borderRadius: "14px", boxShadow: "0 25px 50px rgba(0,0,0,0.8)" }}>
                       <img src={getPosterUrl(details.poster_path)} alt={details.title || details.name} style={{ width: "100%", aspectRatio: "2/3", borderRadius: "10px", objectFit: "cover", border: "1px solid rgba(0,0,0,0.1)" }} />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { if (trailerKey) setIsPlayingTrailer(true); else setErrorMessage("No trailer available."); }}
                      style={{ width: "100%", padding: "12px 0", borderRadius: "30px", backgroundColor: "#ffffff", color: "#000000", fontSize: "12px", fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.5)" }}
                    >
                      Watch Trailer
                    </motion.button>
                  </div>

                  {/* Center: Metadata Core (Reduced Font Sizes) */}
                  <div style={{ display: "flex", flexDirection: "column", paddingTop: "30px" }}>
                    <h1 style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 10px 0", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>{details.title || details.name}</h1>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
                      <span>{details.release_date?.split("-")[0] || details.first_air_date?.split("-")[0]}</span>
                      <span>|</span>
                      <span>{details.runtime || details.episode_run_time?.[0] || "N/A"} min</span>
                      <span>|</span>
                      <span style={{ border: "1px solid rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "6px", fontSize: "10px" }}>12+</span>
                    </div>

                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 24px 0", maxWidth: "95%" }}>
                      {details.tagline && <span style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#fff" }}>{details.tagline}</span>}
                      {details.overview}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto" }}>
                      {details.genres.map(g => (
                        <span key={g.id} style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Glassmorphic Action Hub */}
                  <div style={{ paddingTop: "20px" }}>
                    <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px", backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                      
                      {/* Interactive Icons (Fixed Watched State) */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}>
                        <div onClick={() => handleInteractionToggle("watched")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ color: isWatched ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 8.11 1 12c1.73 3.89 6 7.5 11 7.5s9.27-3.61 11-7.5c-1.73-3.89-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                          </motion.div>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Watched</span>
                        </div>
                        <div onClick={() => handleInteractionToggle("liked")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ color: isLiked ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          </motion.div>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Like</span>
                        </div>
                        <div onClick={() => handleInteractionToggle("watchlist")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ color: isWatchlisted ? "#c084fc" : "rgba(255,255,255,0.4)" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                          </motion.div>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Watchlist</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 0" }}>
                        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rate</span>
                        <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.1)", letterSpacing: "2px" }}>★★★★★</div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button style={{ padding: "8px 0", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Add to lists</button>
                        <button style={{ padding: "8px 0", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.03)", color: "#fff", border: "1px solid rgba(255,255,255,0.05)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Review</button>
                      </div>

                      <div style={{ height: errorMessage ? "auto" : "0px", overflow: "hidden", display: "flex", justifyContent: "center", transition: "all 0.3s" }}>
                        {errorMessage && <span style={{ fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase" }}>⚠️ {errorMessage}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ⭐ RATING & REVIEWS SEPARATOR ── */}
                <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Rating & Reviews</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "24px", fontWeight: 900 }}>
                      <span>★</span> {(details.vote_average / 2).toFixed(1)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                      <b style={{ color: "#fff" }}>IMDb</b> {details.vote_average.toFixed(1)}
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                      <b style={{ color: "#ef4444" }}>🍅</b> {Math.round((details.vote_average / 10) * 100)}%
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.6)" }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      {details.vote_count}
                    </span>
                  </div>
                </div>

                {/* ── 👥 CAST & CREW ── */}
                {cast.length > 0 && (
                  <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "13px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Cast & Crew</h3>
                    <div className="no-scrollbar" style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "16px" }}>
                      {cast.slice(0, 15).map(actor => (
                        <div key={actor.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0, gap: "8px", cursor: "pointer" }}>
                          <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0b0612" }}>
                            {actor.profile_path ? (
                              <img src={getProfileUrl(actor.profile_path)} alt={actor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontSize: "16px" }}>👤</div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", lineHeight: 1.2 }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff" }}>{actor.name}</span>
                            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{actor.character}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 🎞️ SIMILAR FILMS (Fixed Broken Posters) ── */}
                {similar.length > 0 && (
                  <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Similar {mediaType === "tv" ? "Shows" : "Films"} <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>{'>'}</span></h3>
                    </div>
                    <div className="no-scrollbar" style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
                      {similar.slice(0, 10).map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ width: "120px", flexShrink: 0, cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.02)", boxShadow: "0 10px 20px rgba(0,0,0,0.5)" }}>
                             {item.poster_path ? (
                               <img src={getPosterUrl(item.poster_path)} alt={item.title || item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                             ) : (
                               // 🚨 FIXED: Premium Obsidian fallback for missing TMDB images
                               <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", textAlign: "center", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)" }}>
                                  {item.title || item.name}
                               </div>
                             )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 📖 STORYLINE (BOTTOM) ── */}
                <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Storyline</h3>
                  <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "24px" }}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 800, color: "#fff" }}>{details.title || details.name}</h4>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {details.genres[0]?.name || "Media"} Epic
                    </span>
                    <p style={{ margin: "16px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      {details.overview}
                    </p>
                  </div>
                </div>

              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}