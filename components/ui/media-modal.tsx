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

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  vote_average: number;
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
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time Database Interaction Sync States
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [interactionIdMap, setInteractionIdMap] = useState<Record<string, string>>({});

  const castScrollRef = useRef<HTMLDivElement>(null);

  // 🎯 HARD FIX: Define the Gateway URL for the component
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
          if (row.interaction_type === "disliked" || row.interaction_type === "watched") watchedState = true;
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
      setIsSynopsisExpanded(false);
      setErrorMessage("");
      
      try {
        // 🎯 HARD FIX: Route details, credits, and videos through the Edge Gateway
        const [detailsRes, creditsRes, videosRes] = await Promise.all([
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}?language=en-US`),
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/credits?language=en-US`),
          fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/videos?language=en-US`)
        ]);

        const detailsData = await detailsRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();

        setDetails(detailsData);
        setCast(creditsData.cast || []);

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
  const handleInteractionToggle = async (type: "liked" | "watchlist" | "disliked") => {
    if (!mediaId || isProcessing) return;
    setIsProcessing(true); // Lock to prevent rapid-click race conditions

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      setErrorMessage("Please sign in to save your interactions.");
      setTimeout(() => setErrorMessage(""), 4000);
      setIsProcessing(false);
      return;
    }
    
    const user = authData.user;
    const targetExistingId = interactionIdMap[type];

    // Optimistic UI Instantly Updates the Button
    if (type === "liked") setIsLiked(!targetExistingId);
    if (type === "watchlist") setIsWatchlisted(!targetExistingId);
    if (type === "disliked") setIsWatched(!targetExistingId);

    try {
      if (targetExistingId) {
        // Delete targeted row
        await supabase.from("interactions").delete().eq("id", targetExistingId);
        setInteractionIdMap(prev => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
      } else {
        // Safe insert utilizing new composite key
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
      syncModalInteractions(); // Silent UI revert on failure
      console.error("Database interaction failed:", error);
    } finally {
      setIsProcessing(false); // Unlock
    }
  };

  const executeCastNavigation = (direction: "prev" | "next") => {
    if (!castScrollRef.current) return;
    const offset = direction === "prev" ? -320 : 320;
    castScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!isOpen) return null;

  // 🎯 HARD FIX: Piped image loaders through Cloudflare Gateway
  const getPosterUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/w500${path}` : "";
  const getProfileUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/w185${path}` : "";

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box" }}>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 1, 4, 0.85)", backdropFilter: "blur(20px)" }} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: "100%", maxWidth: "1050px", maxHeight: "85vh", overflowY: "auto", background: "linear-gradient(135deg, rgba(20, 20, 25, 0.78) 0%, rgba(10, 10, 12, 0.5) 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px", padding: "32px", boxSizing: "border-box", position: "relative", zIndex: 10, boxShadow: "0 50px 100px rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", gap: "24px" }}
          className="no-scrollbar"
        >
          <button onClick={onClose} style={{ position: "absolute", top: "24px", right: "24px", width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>✕</button>

          {loading || !details ? (
            <div style={{ width: "100%", height: "380px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Assembling Media Stream Node...</span>
            </div>
          ) : (
            <>
              {/* HEADER OVERVIEW */}
              <div>
                <h1 style={{ fontSize: "2.1rem", fontWeight: 950, margin: "0 0 6px 0", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{details.title || details.name}</h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                  <span style={{ color: "#c084fc" }}>{details.release_date?.split("-")[0] || details.first_air_date?.split("-")[0]}</span>
                  <span>&bull;</span>
                  <span>{details.runtime || details.episode_run_time?.[0] || 120} min</span>
                  <span>&bull;</span>
                  <span style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "1px 6px", borderRadius: "5px", fontSize: "9px" }}>PC-13</span>
                  <span>&bull;</span>
                  <span>{details.genres.map(g => g.name).join(", ")}</span>
                </div>
              </div>

              {/* TWO-COLUMN TOP SPLIT HOVER CONTAINER */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: "32px", alignItems: "start", width: "100%" }}>
                
                {/* ⬅️ LEFT COLUMN: OVERVIEW INFO */}
                <div style={{ display: "flex", gap: "20px", alignItems: "start" }}>
                  <img src={getPosterUrl(details.poster_path)} alt="" style={{ width: "145px", height: "auto", borderRadius: "16px", boxShadow: "0 15px 30px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }} />
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)" }}>
                      <span style={{ display: "flex", flexDirection: "column" }}>IMDb<b style={{ color: "#fbbf24", fontSize: "13px", marginTop: "2px" }}>{details.vote_average.toFixed(1)}</b></span>
                      <span style={{ display: "flex", flexDirection: "column" }}>Tomatoes<b style={{ color: "#ef4444", fontSize: "13px", marginTop: "2px" }}>78%</b></span>
                      <span style={{ display: "flex", flexDirection: "column" }}>L-Boxd<b style={{ color: "#22c55e", fontSize: "13px", marginTop: "2px" }}>4.2</b></span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Synopsis</h4>
                      <div style={{ position: "relative", maxHeight: isSynopsisExpanded ? "260px" : "60px", overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: "1.45" }}>
                          {details.overview || "No synopsis pathway logged within database indices."}
                        </p>
                        {!isSynopsisExpanded && (
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24px", background: "linear-gradient(to top, #130a21 0%, transparent 100%)" }} />
                        )}
                      </div>
                      {details.overview && details.overview.length > 100 && (
                        <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#c084fc", fontSize: "10px", fontWeight: 800, padding: 0, cursor: "pointer", marginTop: "4px" }}>
                          {isSynopsisExpanded ? "READ LESS ▴" : "READ MORE ▾"}
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available On</h4>
                      <div style={{ width: "22px", height: "22px", borderRadius: "5px", backgroundColor: "#E50914", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "11px", color: "#fff", boxShadow: "0 4px 10px rgba(229,9,20,0.25)" }}>N</div>
                    </div>
                  </div>
                </div>

                {/* ➡️ RIGHT COLUMN: HARD-FIXED YOUTUBE IFRAME (NO-REFERRER) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                  {trailerKey ? (
                    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)", position: "relative" }}>
                      <iframe 
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0&modestbranding=1&playsinline=1`} 
                        title="Official Media Trailer" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="no-referrer"
                        allowFullScreen 
                        style={{ width: "100%", height: "100%", border: "none" }} 
                      />
                    </div>
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "rgba(255,255,255,0.3)" }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414m-2.222-1.114l1.114-1.114a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>No official trailer available.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* ── 🎛️ FIXED RED ZONE: MULTI-SELECT ACTION DOCK ── */}
              <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "12px", 
                    width: "100%", 
                    paddingTop: "16px", 
                    borderTop: "1px solid rgba(255,255,255,0.04)"
                  }}
                >
                  <motion.button 
                    onClick={() => handleInteractionToggle("liked")} 
                    whileTap={{ scale: 0.99 }}
                    style={{ height: "46px", borderRadius: "14px", border: isLiked ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255,255,255,0.08)", backgroundColor: isLiked ? "rgba(239, 68, 68, 0.12)" : "rgba(255,255,255,0.02)", color: isLiked ? "#f87171" : "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
                  >
                    ❤️ {isLiked ? "Liked" : "Like"}
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.99 }}
                    style={{ height: "46px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
                  >
                    💬 Comment
                  </motion.button>
                  <motion.button 
                    onClick={() => handleInteractionToggle("watchlist")} 
                    whileTap={{ scale: 0.99 }}
                    style={{ height: "46px", borderRadius: "14px", border: isWatchlisted ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255,255,255,0.08)", backgroundColor: isWatchlisted ? "rgba(168, 85, 247, 0.12)" : "rgba(255,255,255,0.02)", color: isWatchlisted ? "#c084fc" : "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
                  >
                    ➕ {isWatchlisted ? "On Watchlist" : "Add to Watchlist"}
                  </motion.button>
                  <motion.button 
                    onClick={() => handleInteractionToggle("disliked")} 
                    whileTap={{ scale: 0.99 }}
                    style={{ height: "46px", borderRadius: "14px", border: isWatched ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255,255,255,0.08)", backgroundColor: isWatched ? "rgba(34, 197, 94, 0.12)" : "rgba(255,255,255,0.02)", color: isWatched ? "#4ade80" : "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
                  >
                    ✅ {isWatched ? "Watched" : "Mark Watched"}
                  </motion.button>
                </div>
                
                {/* 📡 INLINE GLASS DATA FEEDBACK TOAST */}
                <div style={{ height: errorMessage ? "auto" : "0px", overflow: "hidden", display: "flex", justifyContent: "center", transition: "all 0.3s" }}>
                  {errorMessage && (
                    <span style={{ fontSize: "10px", marginTop: "8px", fontWeight: 800, color: "#a855f7", letterSpacing: "0.05em", textTransform: "uppercase", background: "rgba(168, 85, 247, 0.1)", padding: "4px 12px", borderRadius: "6px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                      ⚠️ {errorMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* ── 👥 CAST SECTION ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cast</h3>
                  <div style={{ display: "flex", gap: "6px", zIndex: 10 }}>
                    <button onClick={() => executeCastNavigation("prev")} style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", color: "#ffffff", fontSize: "9px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}>◀ Previous</button>
                    <button onClick={() => executeCastNavigation("next")} style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", color: "#ffffff", fontSize: "9px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}>Next ▶</button>
                  </div>
                </div>
                
                <div 
                  ref={castScrollRef}
                  className="no-scrollbar" 
                  style={{ display: "flex", gap: "14px", overflowX: "hidden", overflowY: "hidden", paddingBottom: "4px", scrollBehavior: "smooth" }}
                >
                  {cast.slice(0, 15).map((actor) => (
                    <motion.div key={actor.id} whileHover={{ y: -3 }} style={{ width: "95px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px", cursor: "pointer" }}>
                      <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#0b0612" }}>
                        {actor.profile_path ? (
                          <img src={getProfileUrl(actor.profile_path)} alt={actor.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "rgba(255,255,255,0.1)" }}>👤</div>
                        )}
                      </div>
                      <div style={{ padding: "0 1px", lineHeight: 1.1 }}>
                        <p style={{ margin: 0, fontSize: "10.5px", fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{actor.name}</p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "9.5px", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{actor.character}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}