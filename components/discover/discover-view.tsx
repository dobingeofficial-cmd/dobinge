"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

interface MovieItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  media_type?: string;
  genre_ids?: number[];
}

const TMDB_GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 12, name: "Adventure", emoji: "🗺️" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 80, name: "Crime", emoji: "🕵️" },
  { id: 99, name: "Documentary", emoji: "🎥" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 10751, name: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: 14, name: "Fantasy", emoji: "🧙‍♂️" },
  { id: 27, name: "Horror", emoji: "🧟" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
  { id: 10749, name: "Romance", emoji: "❤️" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 53, name: "Thriller", emoji: "🔪" }
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" }
];

export default function DiscoverView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const router = useRouter();
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // --- NEURAL CONTROL STATE ---
  const [type, setType] = useState<"movie" | "tv" | "anime">("movie");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearSpan, setYearSpan] = useState<"all" | "2020s" | "2010s" | "2000s" | "classic">("all");
  const [minRating, setMinRating] = useState<number>(6);
  const [sortBy, setSortBy] = useState("popularity.desc");

  // --- LOVED RECENTLY (REFERENCE) STATE ---
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceResults, setReferenceResults] = useState<any[]>([]);
  const [selectedReference, setSelectedReference] = useState<any | null>(null);
  const [isSearchingRef, setIsSearchingRef] = useState(false);

  // --- RESULTS STATE ---
  const [recommendations, setRecommendations] = useState<MovieItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Toggle Genres
  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // Debounced Reference Search
  useEffect(() => {
    if (referenceQuery.length < 2) {
      setReferenceResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearchingRef(true);
      try {
        const res = await fetch(`${proxyUrl}/api/search/multi?query=${encodeURIComponent(referenceQuery)}&language=en-US`);
        const data = await res.json();
        setReferenceResults((data.results || []).filter((r: any) => r.media_type === "movie" || r.media_type === "tv").slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingRef(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [referenceQuery, proxyUrl]);

  const selectReference = (item: any) => {
    setSelectedReference(item);
    setReferenceQuery("");
    setReferenceResults([]);
    // Auto-switch type to match the reference
    if (item.media_type === "movie" || item.media_type === "tv") {
      setType(item.media_type);
    }
  };

  // Build TMDB Query
  const fetchMatches = async (pageNum: number, isLoadMore = false) => {
    setIsScanning(true);
    setHasScanned(true);

    try {
      let results: any[] = [];
      let totalPages = 1;

      const mediaType = type === "anime" ? "tv" : type;

      // Logic A: Aura Match (Based on a specific movie/tv show)
      if (selectedReference) {
        const endpoint = selectedReference.media_type === "movie" ? "movie" : "tv";
        const res = await fetch(`${proxyUrl}/api/${endpoint}/${selectedReference.id}/recommendations?language=en-US&page=${pageNum}`);
        const data = await res.json();
        
        let rawResults = data.results || [];
        totalPages = data.total_pages;

        // Manually filter recommendations locally based on user's strict settings
        results = rawResults.filter((item: any) => {
          if (item.vote_average < minRating) return false;
          if (selectedGenres.length > 0) {
            const hasGenre = selectedGenres.some(g => item.genre_ids?.includes(g));
            if (!hasGenre) return false;
          }
          const yearStr = item.release_date || item.first_air_date;
          if (yearStr && yearSpan !== "all") {
            const year = parseInt(yearStr.split("-")[0]);
            if (yearSpan === "2020s" && year < 2020) return false;
            if (yearSpan === "2010s" && (year < 2010 || year >= 2020)) return false;
            if (yearSpan === "2000s" && (year < 2000 || year >= 2010)) return false;
            if (yearSpan === "classic" && year >= 2000) return false;
          }
          return true;
        });

      } else {
        // Logic B: Deep Discovery Engine
        let query = `language=en-US&page=${pageNum}&sort_by=${sortBy}&vote_average.gte=${minRating}`;
        
        if (selectedGenres.length > 0) query += `&with_genres=${selectedGenres.join(",")}`;
        if (type === "anime") query += `&with_genres=16&with_original_language=ja`;

        if (yearSpan === "2020s") query += type === "movie" ? "&primary_release_date.gte=2020-01-01" : "&first_air_date.gte=2020-01-01";
        if (yearSpan === "2010s") query += type === "movie" ? "&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31" : "&first_air_date.gte=2010-01-01&first_air_date.lte=2019-12-31";
        if (yearSpan === "2000s") query += type === "movie" ? "&primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31" : "&first_air_date.gte=2000-01-01&first_air_date.lte=2009-12-31";
        if (yearSpan === "classic") query += type === "movie" ? "&primary_release_date.lte=1999-12-31" : "&first_air_date.lte=1999-12-31";

        const res = await fetch(`${proxyUrl}/api/discover/${mediaType}?${query}`);
        const data = await res.json();
        results = data.results || [];
        totalPages = data.total_pages;
      }

      // Map format
      const mapped = results.map((item: any) => ({ ...item, mediaType })).filter((item: any) => item.poster_path);

      if (isLoadMore) {
        setRecommendations(prev => {
          const existing = new Set(prev.map(r => r.id));
          return [...prev, ...mapped.filter(r => !existing.has(r.id))];
        });
      } else {
        setRecommendations(mapped);
      }

      setHasMore(pageNum < totalPages && mapped.length > 0);
      setPage(pageNum);

    } catch (err) {
      console.error("Scan Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInitialScan = () => fetchMatches(1, false);
  const loadMore = () => fetchMatches(page + 1, true);

  const heroMatch = recommendations.length > 0 ? recommendations[0] : null;
  const gridMatches = recommendations.length > 1 ? recommendations.slice(1) : [];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      
      {/* Background Ambience */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(100px)", pointerEvents: "none", zIndex: 0
      }} />

      {/* =========================================
          LEFT PANEL — NEURAL CONTROL BOARD (35%)
          ========================================= */}
      <div className="no-scrollbar" style={{
        flex: "0 0 35%", minWidth: "350px", maxWidth: "450px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        background: "linear-gradient(to right, rgba(5,0,10,0.8), rgba(5,0,10,0.4))",
        backdropFilter: "blur(20px)",
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", height: "100%",
        overflowY: "auto", overflowX: "hidden"
      }}>
        
        {/* Header Sticky */}
        <div style={{ padding: "40px 40px 20px 40px", position: "sticky", top: 0, background: "linear-gradient(to bottom, rgba(5,0,10,1) 80%, transparent)", zIndex: 20 }}>
          <motion.button
            onClick={() => router.push('/home')}
            whileHover={{ x: -4, color: "#ffffff" }}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", padding: 0, transition: "color 0.2s", marginBottom: "24px" }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Home
          </motion.button>

          <h1 style={{ fontSize: "28px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "#fff" }}>
            Control Matrix
          </h1>
        </div>

        {/* Scrollable Form */}
        <div style={{ padding: "0 40px 40px 40px", display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* SECTION 1: REFERENCE (Loved Recently) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>1. Aura Match (Loved Recently)</label>
            
            {selectedReference ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "16px", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", boxShadow: "0 0 20px rgba(168,85,247,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {selectedReference.poster_path && (
                    <img src={`https://image.tmdb.org/t/p/w92${selectedReference.poster_path}`} style={{ width: "32px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{selectedReference.title || selectedReference.name}</span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Base Signal Locked</span>
                  </div>
                </div>
                <button onClick={() => setSelectedReference(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: "24px", height: "24px", borderRadius: "50%", color: "#fff", cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="Search a movie you love..." 
                  value={referenceQuery}
                  onChange={(e) => setReferenceQuery(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "16px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", outline: "none", transition: "border-color 0.3s" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(168,85,247,0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <AnimatePresence>
                  {referenceResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "rgba(10,5,15,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "16px", backdropFilter: "blur(20px)", overflow: "hidden", zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                      {referenceResults.map(res => (
                        <div key={res.id} onClick={() => selectReference(res)} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                          {res.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${res.poster_path}`} style={{ width: "24px", height: "36px", borderRadius: "4px" }} /> : <div style={{ width: "24px", height: "36px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />}
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "13px", color: "#fff", fontWeight: 700 }}>{res.title || res.name}</span>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{res.media_type} • {res.release_date?.split('-')[0] || res.first_air_date?.split('-')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* SECTION 2: FORMAT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", opacity: selectedReference ? 0.4 : 1, pointerEvents: selectedReference ? "none" : "auto" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>2. Format</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "movie", label: "Movie", icon: "🎬" },
                { id: "tv", label: "TV Series", icon: "📺" },
                { id: "anime", label: "Anime", icon: "⛩️" }
              ].map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => setType(opt.id as any)}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", background: type === opt.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: type === opt.id ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.05)", color: type === opt.id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                >
                  <span style={{ fontSize: "20px" }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: GENRES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>3. Flavors & Genres</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TMDB_GENRES.map(g => {
                const isActive = selectedGenres.includes(g.id);
                return (
                  <button 
                    key={g.id} 
                    onClick={() => toggleGenre(g.id)}
                    style={{ padding: "8px 14px", borderRadius: "20px", background: isActive ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid", borderColor: isActive ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.05)", color: isActive ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                  >
                    <span>{g.emoji}</span> {g.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 4: ERA / YEAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>4. Time Period</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { id: "all", label: "Any Time" },
                { id: "2020s", label: "2020s" },
                { id: "2010s", label: "2010s" },
                { id: "2000s", label: "2000s" },
                { id: "classic", label: "Pre-2000s" }
              ].map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => setYearSpan(opt.id as any)}
                  style={{ padding: "10px", borderRadius: "10px", background: yearSpan === opt.id ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: yearSpan === opt.id ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.05)", color: yearSpan === opt.id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: MINIMUM QUALITY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>5. Min Quality</label>
              <span style={{ fontSize: "14px", fontWeight: 900, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "10px" }}>★ {minRating.toFixed(1)}</span>
            </div>
            
            {/* Custom Range Slider using raw divs for consistent premium styling */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(val => (
                <div 
                  key={val} 
                  onClick={() => setMinRating(val)}
                  style={{ flex: 1, height: "32px", borderRadius: "6px", background: minRating >= val ? (val >= 8 ? "#4ade80" : val >= 6 ? "#a855f7" : "#ef4444") : "rgba(255,255,255,0.05)", opacity: minRating >= val ? 1 : 0.3, cursor: "pointer", transition: "all 0.2s", boxShadow: minRating === val ? "0 0 10px rgba(255,255,255,0.5)" : "none", transform: minRating === val ? "scale(1.1)" : "scale(1)" }}
                />
              ))}
            </div>
          </div>

          {/* SECTION 6: SORT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", opacity: selectedReference ? 0.4 : 1, pointerEvents: selectedReference ? "none" : "auto" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>6. Trajectory</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", fontWeight: 700, outline: "none", cursor: "pointer", appearance: "none" }}
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} style={{ background: "#05000a" }}>{opt.label}</option>)}
            </select>
          </div>

          {/* INIT BUTTON */}
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInitialScan}
            style={{ marginTop: "20px", width: "100%", padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #9333ea, #c084fc)", border: "none", color: "#fff", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", boxShadow: "0 10px 20px rgba(168,85,247,0.3)" }}
          >
            {isScanning && !hasScanned ? "Calibrating..." : "Initiate Deep Scan"}
          </motion.button>

        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — SECURE RESULTS GRID (65%)
          ========================================= */}
      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100px", height: "100%", background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 10, paddingBottom: "100px" }}>
          <AnimatePresence mode="wait">
            
            {!hasScanned ? (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}>
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} style={{ width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(168,85,247,0.3)" }}>
                  <span style={{ fontSize: "40px", filter: "drop-shadow(0 0 20px rgba(168,85,247,0.5))" }}>📡</span>
                </motion.div>
                <h3 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>Awaiting Parameters</h3>
                <p style={{ margin: 0, fontSize: "16px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Configure the matrix on the left to begin.</p>
              </motion.div>
            ) : 

            isScanning && page === 1 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "50px", height: "50px", border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                <p style={{ margin: 0, fontSize: "12px", color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>Synthesizing Results...</p>
              </motion.div>
            ) : 

            recommendations.length > 0 ? (
              <motion.div key="grid-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ width: "100%", paddingTop: "40px" }}>
                
                {/* 🚨 HERO SPOTLIGHT MATCH 🚨 */}
                {heroMatch && (
                  <div style={{ marginBottom: "48px" }}>
                    <h2 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 900, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>Top Neural Match</h2>
                    <motion.div whileHover={{ scale: 1.01 }} onClick={() => onSelectMedia?.({ ...heroMatch, mediaType: heroMatch.media_type || (type === "anime" ? "tv" : type) })} style={{ position: "relative", width: "100%", height: "400px", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
                      <img src={`https://image.tmdb.org/t/p/original${heroMatch.backdrop_path || heroMatch.poster_path}`} alt={heroMatch.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,0,10,1) 0%, transparent 100%)" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, padding: "40px", width: "100%", boxSizing: "border-box" }}>
                        <h1 style={{ margin: "0 0 12px 0", fontSize: "40px", fontWeight: 900, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>{heroMatch.title || heroMatch.name}</h1>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "80%", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>{heroMatch.overview}</p>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ padding: "8px 20px", borderRadius: "20px", background: "#fff", color: "#000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Explore Title</span>
                          <span style={{ padding: "8px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "12px", fontWeight: 900, backdropFilter: "blur(10px)" }}>★ {heroMatch.vote_average?.toFixed(1)}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* 🚨 STRICTLY SPACED GRID 🚨 */}
                {gridMatches.length > 0 && (
                  <div>
                    <h2 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>Other High-Probability Matches</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "24px" }}>
                      {gridMatches.map((media, idx) => (
                        <motion.div key={`${media.id}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (idx % 10) * 0.05, duration: 0.4 }} onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || (type === "anime" ? "tv" : type) })} whileHover={{ scale: 1.05, y: -5 }} style={{ position: "relative", width: "100%", aspectRatio: "2/3", borderRadius: "16px", overflow: "hidden", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.4)" }}>
                          <PremiumMediaCard media={media as any} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "48px", paddingBottom: "48px" }}>
                    <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }} whileTap={{ scale: 0.95 }} onClick={loadMore} disabled={isScanning} style={{ padding: "16px 40px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#fff", fontSize: "12px", fontWeight: 900, cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {isScanning ? "Scanning Deep Core..." : "Load More"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: "10%" }}>
                <span style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🛰️</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 600 }}>We drifted too far into the void.<br/>No exact matches found for these strict parameters.</p>
                <motion.button whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }} onClick={() => setHasScanned(false)} style={{ marginTop: "24px", padding: "12px 24px", borderRadius: "24px", backgroundColor: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Adjust Calibration
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to top, rgba(5,0,10,1) 0%, transparent 100%)", pointerEvents: "none", zIndex: 20 }} />
      </div>
    </div>
  );
}