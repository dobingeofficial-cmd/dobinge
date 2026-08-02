"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData, saveGuestData } from "@/lib/store/guestStore";

type Tab = "movies" | "series" | "anime" | "watched";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type?: string;
}

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selections, setSelections] = useState({
    movies: [] as MediaItem[],
    series: [] as MediaItem[],
    anime: [] as MediaItem[],
    watched: [] as MediaItem[],
  });

  // ── TMDB EDGE HYDRATION ENGINE ──
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchTrending(activeTab);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(searchQuery, activeTab);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeTab]);

  const fetchTrending = async (tab: Tab) => {
    setIsSearching(true);
    // 🎯 HARD FIX: Using our unblockable Cloudflare Gateway instead of raw API keys
    const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
    if (!proxyUrl) {
      console.error("DoBinge Gateway Offline.");
      setIsSearching(false);
      return;
    }

    try {
      let endpoint = `${proxyUrl}/api/trending/movie/week`;
      if (tab === "series") endpoint = `${proxyUrl}/api/trending/tv/week`;
      if (tab === "anime") endpoint = `${proxyUrl}/api/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`;
      if (tab === "watched") endpoint = `${proxyUrl}/api/trending/all/week`; 

      const res = await fetch(endpoint);
      const data = await res.json();
      const formatted = (data.results || []).map((item: any) => ({ ...item, media_type: item.media_type || (tab === "series" ? "tv" : "movie") }));
      setResults(formatted.filter((i: MediaItem) => i.poster_path));
    } catch (err) {
      console.error("Hydration Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const executeSearch = async (query: string, tab: Tab) => {
    setIsSearching(true);
    const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
    if (!proxyUrl) {
      setIsSearching(false);
      return;
    }

    try {
      let endpoint = `${proxyUrl}/api/search/movie?query=${encodeURIComponent(query)}`;
      if (tab === "series") endpoint = `${proxyUrl}/api/search/tv?query=${encodeURIComponent(query)}`;
      if (tab === "anime") endpoint = `${proxyUrl}/api/search/tv?query=${encodeURIComponent(query)}&with_genres=16`;
      if (tab === "watched") endpoint = `${proxyUrl}/api/search/multi?query=${encodeURIComponent(query)}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      const formatted = (data.results || []).map((item: any) => ({ ...item, media_type: item.media_type || (tab === "series" ? "tv" : "movie") }));
      setResults(formatted.filter((i: MediaItem) => i.poster_path));
    } catch (err) {
      console.error("Search Engine Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (item: MediaItem) => {
    setSelections((prev) => {
      const currentList = prev[activeTab];
      const exists = currentList.find((i) => i.id === item.id);
      if (exists) return { ...prev, [activeTab]: currentList.filter((i) => i.id !== item.id) };
      return { ...prev, [activeTab]: [...currentList, item] };
    });
  };

  // ── OMNI-CHANNEL PERSISTENCE PROTOCOL (HARD LOOP FIX) ──
  const finalizeOnboarding = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const isExplicitGuest = typeof window !== "undefined" && localStorage.getItem("dobinge_guest_mode") === "true";
      const extractIds = (items: MediaItem[]) => items.map(i => i.id.toString());

      if (session?.user && !isExplicitGuest) {
        // ── 1. AUTHENTICATED PIPELINE ──
        const { data: existingPref } = await supabase.from("user_preferences").select("*").eq("user_id", session.user.id).single();
        
        await supabase.from("user_preferences").upsert({
          user_id: session.user.id,
          favorite_genres: existingPref?.favorite_genres || [],
          mood_preferences: existingPref?.mood_preferences || [],
          favorite_movies: extractIds(selections.movies),
          favorite_tv: extractIds(selections.series),
          favorite_anime: extractIds(selections.anime),
          updated_at: new Date().toISOString()
        });

        if (selections.watched.length > 0) {
          const historyPayload = selections.watched.map((item) => ({
            user_id: session.user.id, media_id: item.id, media_type: item.media_type || "movie", interaction_type: "watched"
          }));
          await supabase.from("interactions").upsert(historyPayload, { onConflict: 'user_id,media_id,interaction_type' });
        }
      } else {
        // ── 2. GUEST PIPELINE ──
        const guestData = getGuestData();
        guestData.favorites.movies = extractIds(selections.movies);
        guestData.favorites.tv = extractIds(selections.series);
        guestData.favorites.anime = extractIds(selections.anime);
        
        selections.watched.forEach(item => {
          const exists = guestData.interactions.some(i => i.media_id === item.id && i.interaction_type === "watched");
          if (!exists) guestData.interactions.push({ media_id: item.id, media_type: item.media_type || "movie", interaction_type: "watched" });
        });
        saveGuestData(guestData);
      }

      // ── 3. 🚨 ONBOARDING MEMORY LOCK ──
      // This permanently locks the user out of the onboarding loop on future visits
      if (typeof window !== "undefined") {
        localStorage.setItem("dobinge_onboarded", "true");
      }

      // ── 4. STRICT ROUTING TO PAGE 5 (Home) FOR EVERYONE ──
      window.location.href = "/home";

    } catch (error) {
      console.error("Data Synchronization Fault:", error);
      
      // Fallback: Ensure lock is still applied even if DB fails, to prevent infinite loops
      if (typeof window !== "undefined") {
        localStorage.setItem("dobinge_onboarded", "true");
      }
      window.location.href = "/home"; 
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSelections = selections.movies.length + selections.series.length + selections.anime.length + selections.watched.length;
  // Fallback for styling so we don't crash if env missing during render
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  return (
    <div style={{ position: "relative", width: "100vw", minHeight: "100vh", backgroundColor: "#040206", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 120px", boxSizing: "border-box" }}>
      
      {/* ── AMBIENT NEON GLOW ── */}
      <div style={{ position: "fixed", top: "-10%", right: "-10%", width: "120%", height: "120%", background: "radial-gradient(circle at 70% 20%, rgba(168, 85, 247, 0.08) 0%, rgba(4, 2, 6, 0) 60%)", pointerEvents: "none", zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <h1 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", textAlign: "center" }}>
          Curate Your <span style={{ color: "#a855f7" }}>Universe</span>
        </h1>
        <p style={{ margin: "0 0 32px 0", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, textAlign: "center" }}>
          Select your absolute favorites. Titles marked as 'Already Watched' will automatically sync to your History.
        </p>

        {/* ── LIQUID GLASS TAB BAR ── */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", width: "100%", paddingBottom: "12px", marginBottom: "20px", scrollbarWidth: "none" }} className="hide-scrollbar">
          {(["movies", "series", "anime", "watched"] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(""); }} style={{ padding: "10px 20px", borderRadius: "20px", whiteSpace: "nowrap", backgroundColor: activeTab === tab ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.03)", border: activeTab === tab ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255,255,255,0.05)", color: activeTab === tab ? "#e9d5ff" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.2s ease" }}>
              {tab === "watched" ? "Already Watched" : tab}
              {selections[tab].length > 0 && <span style={{ marginLeft: "8px", padding: "2px 6px", borderRadius: "10px", backgroundColor: "#a855f7", color: "#fff", fontSize: "9px" }}>{selections[tab].length}</span>}
            </button>
          ))}
        </div>

        {/* ── SEARCH BAR ── */}
        <div style={{ position: "relative", width: "100%", marginBottom: "32px" }}>
          <input type="text" placeholder={`Search ${activeTab === 'watched' ? 'any title' : activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "16px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", fontSize: "14px", fontWeight: 600, outline: "none", backdropFilter: "blur(20px)", boxSizing: "border-box" }} />
        </div>

        {/* ── CINEMATIC POSTER GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px", width: "100%" }}>
          <AnimatePresence mode="popLayout">
            {results.map((item) => {
              const isSelected = selections[activeTab].some((i) => i.id === item.id);
              return (
                <motion.div key={`${activeTab}-${item.id}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => toggleSelection(item)} style={{ position: "relative", aspectRatio: "2/3", borderRadius: "16px", overflow: "hidden", cursor: "pointer", border: isSelected ? "2px solid #a855f7" : "2px solid transparent", boxShadow: isSelected ? "0 0 20px rgba(168, 85, 247, 0.4)" : "none", transition: "all 0.2s ease" }}>
                  {/* 🎯 HARD FIX: Piped image through Cloudflare Gateway */}
                  <img src={`${proxyUrl}/image/t/p/w342${item.poster_path}`} alt={item.title || item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {isSelected && <div style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}><svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}>
                    <span style={{ display: "block", color: "#fff", fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title || item.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── FLOATING FINALIZE BUTTON ── */}
      <AnimatePresence>
        {totalSelections > 0 && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} style={{ position: "fixed", bottom: "40px", zIndex: 50, width: "100%", maxWidth: "340px", padding: "0 24px", boxSizing: "border-box" }}>
            <button onClick={finalizeOnboarding} disabled={isProcessing} style={{ width: "100%", padding: "18px 0", borderRadius: "24px", border: "none", background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", color: "#ffffff", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isProcessing ? "not-allowed" : "pointer", boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
              {isProcessing ? "Synchronizing Neural Core..." : `Continue to Discover (${totalSelections})`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}