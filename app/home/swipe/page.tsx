"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// Ensure these files actually exist in your project structure!
import { processSwipe, SwipeActionType } from "@/lib/controllers/swipeController";
import { useAuthModal } from "@/context/AuthModalContext";
import { getGuestData, addGuestInteraction } from "@/lib/store/guestStore";

// 🚨 FIXED: We import our existing ModalContext instead of using props
import { useModal } from "@/context/ModalContext";

interface MovieItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  media_type?: string;
}

type MediaTab = "movies" | "series" | "anime";

// 🚨 FIXED: Removed custom props. A page.tsx component cannot accept custom props.
export default function SwipePage() {
  const [activeTab, setActiveTab] = useState<MediaTab>("movies");
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isMemoryLoaded, setIsMemoryLoaded] = useState(false);
  
  const [showPreferenceMenu, setShowPreferenceMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // GLOBAL CONTEXTS
  const { requireAuth } = useAuthModal();
  const { setSelectedMedia } = useModal(); // 🚨 FIXED: Tapping into global modal state

  // EXCLUSION MEMORY MATRIX
  const interactedIdsRef = useRef<Set<number>>(new Set());

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacityLeftText = useTransform(x, [0, -150], [0, 0.35]);
  const opacityRightText = useTransform(x, [0, 150], [0, 0.35]);

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // ── 1. ESTABLISH OMNI-CHANNEL MEMORY (GUEST + SUPABASE) ──
  useEffect(() => {
    const loadOmniChannelMemory = async () => {
      const memorySet = new Set<number>();

      // A. Load Local Guest Memory First
      const guestData = getGuestData();
      guestData.interactions.forEach((item: any) => memorySet.add(item.media_id));

      // B. Load Supabase Memory if Authenticated
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData?.user) {
        const { data, error } = await supabase
          .from("interactions")
          .select("media_id")
          .eq("user_id", authData.user.id);
          
        if (!error && data) {
          data.forEach((item) => memorySet.add(item.media_id));
        }
      }

      interactedIdsRef.current = memorySet;
      setIsMemoryLoaded(true); 
    };
    loadOmniChannelMemory();
  }, []);

  // ── 2. RECOMMENDATION ENGINE (STRICT FILTERING VIA EDGE) ──
  const fetchSwipeData = useCallback(async (tab: MediaTab, targetPage: number, isLoadMore: boolean) => {
    if (!proxyUrl) return;

    if (isLoadMore) setIsFetchingNext(true);
    else setLoading(true);

    try {
      const pageOffset = Math.floor(interactedIdsRef.current.size / 20);
      let fetchPage = targetPage === 1 ? targetPage + pageOffset : targetPage;
      let validMovies: MovieItem[] = [];

      while (validMovies.length < 10 && fetchPage <= 100) {
        let endpoint = `${proxyUrl}/api/discover/movie?sort_by=popularity.desc&page=${fetchPage}&vote_count.gte=150`;
        if (tab === "series") endpoint = `${proxyUrl}/api/discover/tv?sort_by=popularity.desc&page=${fetchPage}&vote_count.gte=50`;
        if (tab === "anime") endpoint = `${proxyUrl}/api/discover/movie?sort_by=popularity.desc&page=${fetchPage}&with_genres=16&with_original_language=ja`;

        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (!data.results || data.results.length === 0) break;

        const structuralResults = data.results.map((item: any) => ({
          ...item,
          media_type: tab === "series" ? "tv" : "movie"
        }));

        // CRITICAL: Exclude EVERYTHING in the merged memory matrix
        const unseenCards = structuralResults.filter((movie: MovieItem) => !interactedIdsRef.current.has(movie.id));
        validMovies = [...validMovies, ...unseenCards];
        
        fetchPage++;
      }

      setPage(fetchPage);
      setMovies((prev) => isLoadMore ? [...prev, ...validMovies] : validMovies);
    } catch (err) {
      console.error("Discovery Engine Fault:", err);
    } finally {
      setLoading(false);
      setIsFetchingNext(false);
    }
  }, [proxyUrl]);

  useEffect(() => {
    if (!isMemoryLoaded) return; 
    setMovies([]);
    fetchSwipeData(activeTab, 1, false);
  }, [activeTab, isMemoryLoaded, fetchSwipeData]);

  // ── 3. DYNAMIC CONTROLLER EXECUTION FLOW ──
  const executeController = async (action: SwipeActionType) => {
    if (movies.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const currentMovie = movies[0];
    const mediaType = currentMovie.media_type || "movie";

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await processSwipe(action, currentMovie.id, mediaType);
      } else {
        if (action === "DISLIKE") addGuestInteraction(currentMovie.id, mediaType, "disliked");
        if (action === "WATCHED_NOT_LIKED") addGuestInteraction(currentMovie.id, mediaType, "watched");
      }

      interactedIdsRef.current.add(currentMovie.id);

      if (movies.length <= 4 && !isFetchingNext) {
        setIsFetchingNext(true);
        fetchSwipeData(activeTab, page, true);
      }

      setShowPreferenceMenu(false);
      setMovies((prev) => prev.slice(1));
      x.set(0); 
      y.set(0);

    } catch (error) {
      console.error("Action rejected by server:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwipeAction = (direction: "left" | "right" | "info" | "undo" | "watched_click" | "like_confirm" | "dislike_confirm" | "up") => {
    if (movies.length === 0) return;
    
    // 🚨 FIXED: Dispatch to global Modal state
    if (direction === "info") {
      setSelectedMedia({ id: movies[0].id, mediaType: movies[0].media_type || "movie" });
      return;
    }
    if (direction === "undo") return setShowPreferenceMenu(false);
    if (direction === "up" || direction === "watched_click") return setShowPreferenceMenu(true);

    if (direction === "left") return executeController("DISLIKE"); 
    if (direction === "right") return requireAuth(() => executeController("WATCHLIST")); 
    if (direction === "like_confirm") return requireAuth(() => executeController("WATCHED_LIKED")); 
    if (direction === "dislike_confirm") return executeController("WATCHED_NOT_LIKED"); 
  };

  const handleDragEnd = (event: any, info: any) => {
    const horizontalThreshold = 120;
    const verticalThreshold = 100;

    if (info.offset.x > horizontalThreshold) handleSwipeAction("right");
    else if (info.offset.x < -horizontalThreshold) handleSwipeAction("left");
    else if (info.offset.y < -verticalThreshold) handleSwipeAction("up");
    else if (info.offset.y > verticalThreshold) handleSwipeAction("watched_click");
    else { x.set(0); y.set(0); }
  };

  const getPosterUrl = (path: string | null | undefined) => path && proxyUrl ? `${proxyUrl}/image/t/p/w600_and_h900_bestv2${path}` : "";

  if ((loading || !isMemoryLoaded) && movies.length === 0) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Calibrating Swipe Engine...
        </span>
      </div>
    );
  }

  const visibleCards = movies.slice(0, 5);

  return (
    <div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", backgroundColor: "transparent", boxSizing: "border-box" }}>
      
      {/* ── TOP CAPSULE SUB-NAV ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", marginTop: "4px", zIndex: 100 }}>
        <span onClick={() => setActiveTab("movies")} style={{ padding: "8px 24px", borderRadius: "24px", backgroundColor: activeTab === "movies" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.03)", color: activeTab === "movies" ? "#E9D5FF" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: activeTab === "movies" ? 800 : 700, textTransform: "uppercase", border: activeTab === "movies" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.3s" }}>Movies</span>
        <span onClick={() => setActiveTab("series")} style={{ padding: "8px 24px", borderRadius: "24px", backgroundColor: activeTab === "series" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.03)", color: activeTab === "series" ? "#E9D5FF" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: activeTab === "series" ? 800 : 700, textTransform: "uppercase", border: activeTab === "series" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.3s" }}>Series</span>
        <span onClick={() => setActiveTab("anime")} style={{ padding: "8px 24px", borderRadius: "24px", backgroundColor: activeTab === "anime" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.03)", color: activeTab === "anime" ? "#E9D5FF" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: activeTab === "anime" ? 800 : 700, textTransform: "uppercase", border: activeTab === "anime" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.3s" }}>Anime</span>
      </div>

      {/* ── VOID TEXTS ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        <motion.div style={{ position: "absolute", top: "35%", left: "calc(50% - 320px)", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: opacityLeftText }}>
          <span style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif", fontSize: "28px", color: "#ffffff", letterSpacing: "0.05em" }}>Skip</span>
          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>← Swipe Left</span>
        </motion.div>
        <motion.div style={{ position: "absolute", top: "35%", right: "calc(50% - 320px)", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: opacityRightText }}>
          <span style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif", fontSize: "28px", color: "#ffffff", letterSpacing: "0.05em" }}>Watchlist</span>
          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Swipe Right →</span>
        </motion.div>
      </div>

      {/* ── SPATIAL CARD DECK ENGINE ── */}
      <div style={{ position: "relative", width: "310px", height: "460px", perspective: "1000px", zIndex: 10 }}>
        <AnimatePresence>
          {visibleCards.map((movie, index) => {
            const isFront = index === 0;
            const offsetMultiplier = Math.ceil(index / 2);
            const direction = index % 2 === 0 ? -1 : 1; 

            return (
              <motion.div
                key={movie.id} 
                drag={isFront} 
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} 
                dragElastic={0.7} 
                onDragEnd={handleDragEnd}
                style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "28px", overflow: "hidden", backgroundColor: "#050208", x: isFront ? x : 0, y: isFront ? y : 0, rotate: isFront ? rotate : 0, zIndex: 50 - index, transformOrigin: "bottom center", boxShadow: "0 20px 50px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.08)" }}
                animate={{ x: isFront ? 0 : direction * offsetMultiplier * 50, y: isFront ? 0 : offsetMultiplier * 18, rotate: isFront ? 0 : direction * offsetMultiplier * 6, scale: isFront ? 1 : 1 - offsetMultiplier * 0.05, opacity: isFront ? 1 : 1 - offsetMultiplier * 0.15 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <img src={getPosterUrl(movie.poster_path || movie.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 45%, transparent 100%)", pointerEvents: "none" }}>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "8px", lineHeight: "1.1", color: "#fff" }}>{movie.title || movie.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: "12px" }}>
                    <span>{movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "2026"}</span>
                    <span>&bull;</span><span style={{ color: "#c084fc", background: "rgba(168,85,247,0.15)", padding: "4px 8px", borderRadius: "10px" }}>Trending</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4, marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.overview}</p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#fbbf24" }}>★ {movie.vote_average ? movie.vote_average.toFixed(1) : "7.5"}</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#ef4444" }}>🍅 78%</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#22c55e" }}>💚 4.5</span>
                  </div>

                  <div 
                    onPointerDown={(e) => e.stopPropagation()} 
                    onClick={() => handleSwipeAction("info")} 
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backdropFilter: "blur(10px)", pointerEvents: "auto", cursor: "pointer", boxSizing: "border-box", transition: "background-color 0.2s" }}
                  >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Watch Trailer
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── BUTTONS BAR SYSTEM DOCK ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "44px", zIndex: 100, position: "relative" }}>
        <AnimatePresence mode="wait">
          {!showPreferenceMenu ? (
            <motion.div key="standard-dock" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button onClick={() => handleSwipeAction("undo")} style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 25, 0.6)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "transform 0.2s" }}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg></button>
              <button onClick={() => handleSwipeAction("left")} style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 25, 0.6)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", cursor: "pointer", opacity: isProcessing ? 0.5 : 1, transition: "transform 0.2s" }} disabled={isProcessing}><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
              <button onClick={() => handleSwipeAction("watched_click")} style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(192, 132, 252, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C084FC", cursor: "pointer", boxShadow: "0 0 15px rgba(168, 85, 247, 0.25)", transition: "transform 0.2s" }}><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></button>
              <button onClick={() => handleSwipeAction("info")} style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 25, 0.6)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7", cursor: "pointer", transition: "transform 0.2s" }}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></button>
              <button onClick={() => handleSwipeAction("right")} style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 25, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec4899", cursor: "pointer", opacity: isProcessing ? 0.5 : 1, transition: "transform 0.2s" }} disabled={isProcessing}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
            </motion.div>
          ) : (
            <motion.div key="preference-dock" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ display: "flex", alignItems: "center", gap: "16px", backgroundColor: "rgba(255, 255, 255, 0.03)", padding: "6px 16px", borderRadius: "30px", border: "1px solid rgba(255, 255, 255, 0.06)", backdropFilter: "blur(20px)" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", paddingLeft: "4px" }}>Did you like it?</span>
              <button onClick={() => handleSwipeAction("dislike_confirm")} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171", fontSize: "11px", fontWeight: 800, cursor: "pointer", opacity: isProcessing ? 0.5 : 1, transition: "transform 0.2s" }} disabled={isProcessing}>Dislike</button>
              <button onClick={() => handleSwipeAction("like_confirm")} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(34, 197, 94, 0.4)", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontSize: "11px", fontWeight: 800, cursor: "pointer", boxShadow: "0 0 10px rgba(34, 197, 94, 0.2)", opacity: isProcessing ? 0.5 : 1, transition: "transform 0.2s" }} disabled={isProcessing}>Like</button>
              <button onClick={() => handleSwipeAction("undo")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", transition: "transform 0.2s" }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}