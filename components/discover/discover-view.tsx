"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

// --- TYPES & CONSTANTS ---
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

const TYPES = [
  { id: "movie", label: "Movie", icon: "🎬" },
  { id: "tv", label: "TV Show", icon: "📺" },
  { id: "anime", label: "Anime", icon: "⛩️" }
];

const GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }, { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" }
];

const YEARS = [
  { id: "all", label: "Any Year" },
  { id: "2020s", label: "2020 - 2026" },
  { id: "2010s", label: "2010 - 2019" },
  { id: "2000s", label: "2000 - 2009" },
  { id: "classic", label: "Pre-2000s" }
];

const RATINGS = [
  { id: 0, label: "Any" }, { id: 6, label: "6.0+" }, { id: 7, label: "7.0+" }, 
  { id: 7.5, label: "7.5+" }, { id: 8, label: "8.0+" }, { id: 8.5, label: "8.5+" }
];

const SORTS = [
  { id: "popularity.desc", label: "Most Popular" },
  { id: "vote_average.desc", label: "Highest Rated" },
  { id: "primary_release_date.desc", label: "Newest First" },
  { id: "primary_release_date.asc", label: "Oldest First" }
];

const TRAITS = [
  "🧠 The concept", "❤️ The emotions", "🔥 The action", "🎭 The characters",
  "🌌 The atmosphere", "📖 The story", "😂 The humor", "😱 The suspense"
];

export default function DiscoverView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const router = useRouter();
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // --- CONTROL STATE ---
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["movie"]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  
  const [lovedQuery, setLovedQuery] = useState("");
  const [lovedResults, setLovedResults] = useState<any[]>([]);
  const [lovedTitles, setLovedTitles] = useState<any[]>([]);
  const [isSearchingLoved, setIsSearchingLoved] = useState(false);
  
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  // --- RESULTS STATE ---
  const [status, setStatus] = useState<"idle" | "calibrating" | "success" | "error">("idle");
  const [recommendations, setRecommendations] = useState<MovieItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // --- HANDLERS ---
  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) && prev.length > 1 ? prev.filter(t => t !== id) : prev.includes(id) ? prev : [...prev, id]);
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]);
  };

  const resetAll = () => {
    setSelectedTypes(["movie"]);
    setSelectedGenres([]);
    setSelectedYear("all");
    setMinRating(0);
    setSortBy("popularity.desc");
    setLovedTitles([]);
    setSelectedTraits([]);
    setStatus("idle");
    setRecommendations([]);
    setHasScanned(false);
  };

  // --- LOVED TITLES SEARCH (Debounced) ---
  useEffect(() => {
    if (lovedQuery.length < 2) {
      setLovedResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearchingLoved(true);
      try {
        const res = await fetch(`${proxyUrl}/api/search/multi?query=${encodeURIComponent(lovedQuery)}&language=en-US`);
        const data = await res.json();
        const valid = (data.results || []).filter((r: any) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path).slice(0, 4);
        setLovedResults(valid);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingLoved(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [lovedQuery, proxyUrl]);

  const addLovedTitle = (item: any) => {
    if (!lovedTitles.find(t => t.id === item.id)) {
      setLovedTitles(prev => [...prev, item]);
      if (!selectedTypes.includes(item.media_type)) {
        setSelectedTypes(prev => [...prev, item.media_type]);
      }
    }
    setLovedQuery("");
    setLovedResults([]);
  };

  const removeLovedTitle = (id: number) => {
    setLovedTitles(prev => prev.filter(t => t.id !== id));
  };

  // --- THE CORE RECOMMENDATION ENGINE ---
  const fetchMatches = async (pageNum: number, isLoadMore = false) => {
    setIsScanning(true);
    setHasScanned(true);

    try {
      let pooledResults: any[] = [];
      let totalPages = 1;
      const isAnimeSelected = selectedTypes.includes("anime");
      const baseTypes = selectedTypes.filter(t => t !== "anime");
      if (isAnimeSelected && !baseTypes.includes("tv")) baseTypes.push("tv");
      if (baseTypes.length === 0) baseTypes.push("movie");

      // LOGIC A: Base it on Loved Titles
      if (lovedTitles.length > 0) {
        const fetches = lovedTitles.map(title => 
          fetch(`${proxyUrl}/api/${title.media_type}/${title.id}/recommendations?language=en-US&page=${pageNum}`)
            .then(r => r.json())
            .then(data => {
               totalPages = Math.max(totalPages, data.total_pages || 1);
               return (data.results || []).map((i: any) => ({ ...i, media_type: title.media_type }));
            })
        );
        const nestedResults = await Promise.all(fetches);
        pooledResults = nestedResults.flat();
      } 
      // LOGIC B: Standard Discover Engine
      else {
        const fetches = baseTypes.map(type => {
          let query = `language=en-US&page=${pageNum}&sort_by=${sortBy}&vote_average.gte=${minRating}`;
          
          let typeGenres = [...selectedGenres];
          if (isAnimeSelected && type === "tv") typeGenres.push(16);
          
          if (typeGenres.length > 0) query += `&with_genres=${typeGenres.join(",")}`;
          if (isAnimeSelected && type === "tv") query += `&with_original_language=ja`;

          if (selectedYear !== "all") {
            const dateKey = type === "movie" ? "primary_release_date" : "first_air_date";
            if (selectedYear === "2020s") query += `&${dateKey}.gte=2020-01-01`;
            if (selectedYear === "2010s") query += `&${dateKey}.gte=2010-01-01&${dateKey}.lte=2019-12-31`;
            if (selectedYear === "2000s") query += `&${dateKey}.gte=2000-01-01&${dateKey}.lte=2009-12-31`;
            if (selectedYear === "classic") query += `&${dateKey}.lte=1999-12-31`;
          }

          return fetch(`${proxyUrl}/api/discover/${type}?${query}`)
            .then(r => r.json())
            .then(data => {
               totalPages = Math.max(totalPages, data.total_pages || 1);
               return (data.results || []).map((i: any) => ({ ...i, media_type: type }));
            });
        });
        const nestedResults = await Promise.all(fetches);
        pooledResults = nestedResults.flat();
      }

      // LOCAL FILTERING
      let filtered = pooledResults.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id) 
      );

      if (lovedTitles.length > 0) {
        filtered = filtered.filter(item => {
          if (item.vote_average < minRating) return false;
          if (selectedGenres.length > 0) {
            if (!selectedGenres.some(g => item.genre_ids?.includes(g))) return false;
          }
          if (selectedYear !== "all") {
            const yearStr = item.release_date || item.first_air_date;
            if (!yearStr) return false;
            const year = parseInt(yearStr.split("-")[0]);
            if (selectedYear === "2020s" && year < 2020) return false;
            if (selectedYear === "2010s" && (year < 2010 || year >= 2020)) return false;
            if (selectedYear === "2000s" && (year < 2000 || year >= 2010)) return false;
            if (selectedYear === "classic" && year >= 2000) return false;
          }
          return true;
        });
      }

      // Final Sort
      filtered.sort((a, b) => {
        if (sortBy.includes("vote_average")) return b.vote_average - a.vote_average;
        if (sortBy.includes("release_date.desc")) {
          const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
          const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
          return dateB - dateA;
        }
        return b.popularity - a.popularity;
      });

      const validResults = filtered.filter(i => i.poster_path);
      
      if (isLoadMore) {
        setRecommendations(prev => {
          const existing = new Set(prev.map(r => r.id));
          return [...prev, ...validResults.filter(r => !existing.has(r.id))];
        });
      } else {
        setRecommendations(validResults);
      }

      setHasMore(pageNum < totalPages && validResults.length > 0);
      setPage(pageNum);
      
      if (!isLoadMore) {
        setStatus(validResults.length > 0 ? "success" : "error");
      }

    } catch (err) {
      console.error(err);
      if (!isLoadMore) setStatus("error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleInitialScan = () => {
    setStatus("calibrating");
    fetchMatches(1, false);
  };
  
  const loadMore = () => fetchMatches(page + 1, true);

  // --- UI HELPERS ---
  const heroMatch = recommendations.length > 0 ? recommendations[0] : null;
  const gridMatches = recommendations.length > 1 ? recommendations.slice(1) : [];

  const getReasonString = () => {
    const parts = [];
    if (selectedTraits.length > 0) parts.push(selectedTraits[0].toLowerCase());
    if (selectedGenres.length > 0) parts.push("the specific genre vibe");
    if (lovedTitles.length > 0) parts.push(`similarities to ${lovedTitles[0].title || lovedTitles[0].name}`);
    
    if (parts.length === 0) return "Curated purely on global cinematic resonance.";
    return `Because you wanted something with ${parts.join(" and ")}.`
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      
      {/* Background Ambience */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(100px)", pointerEvents: "none", zIndex: 0
      }} />

      {/* =========================================
          LEFT PANEL — NEURAL CONTROLS (38%)
          ========================================= */}
      <div className="no-scrollbar" style={{
        flex: "0 0 38%", minWidth: "350px", maxWidth: "450px",
        background: "rgba(5,0,10,0.4)", // Border removed completely
        display: "flex", flexDirection: "column", height: "100%",
        overflowY: "auto", position: "relative", zIndex: 20
      }}>
        
        {/* Sticky Header */}
        <div style={{ padding: "40px 40px 20px 40px", position: "sticky", top: 0, background: "linear-gradient(to bottom, rgba(5,0,10,1) 80%, transparent)", zIndex: 30 }}>
          <motion.button onClick={() => router.push('/home')} whileHover={{ x: -4, color: "#fff" }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", padding: 0, marginBottom: "24px" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg> Home
          </motion.button>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Discovery Engine</h1>
          <p style={{ fontSize: "12px", color: "rgba(168,85,247,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Tell us what you're looking for. We'll find the rest.</p>
        </div>

        <div style={{ padding: "0 40px 40px 40px", display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* 1. LOVED RECENTLY ANCHOR (Moved to Top) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px", borderRadius: "16px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <label style={{ fontSize: "12px", fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>❤️ Start with something you loved</label>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "0 0 8px 0" }}>Tell DoBinge what you've enjoyed before.</p>
            
            {lovedTitles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {lovedTitles.map(t => (
                  <span key={t.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                    ❤️ {t.title || t.name} 
                    <button onClick={() => removeLovedTitle(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0, marginLeft: "4px" }}>✕</button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Search a movie, TV show, or anime..." value={lovedQuery} onChange={(e) => setLovedQuery(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
              <AnimatePresence>
                {lovedResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#110b18", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", overflow: "hidden", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>
                    {lovedResults.map(res => (
                      <div key={res.id} onClick={() => addLovedTitle(res)} style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                        {res.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${res.poster_path}`} style={{ width: "24px", height: "36px", borderRadius: "4px" }} /> : <div style={{ width: "24px", height: "36px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>{res.title || res.name}</span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{res.media_type} • {res.release_date?.split('-')[0] || res.first_air_date?.split('-')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {lovedTitles.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: "16px" }}>
                <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>What did you love about it? (Optional)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {TRAITS.map(t => (
                    <button key={t} onClick={() => toggleTrait(t)} style={{ padding: "6px 10px", borderRadius: "12px", background: selectedTraits.includes(t) ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid", borderColor: selectedTraits.includes(t) ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)", color: selectedTraits.includes(t) ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* 2. TYPE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>What are we watching?</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => toggleType(t.id)} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: selectedTypes.includes(t.id) ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: selectedTypes.includes(t.id) ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.05)", color: selectedTypes.includes(t.id) ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", transition: "all 0.2s" }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. GENRE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>What kind of experience?</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {GENRES.map(g => (
                <button key={g.id} onClick={() => toggleGenre(g.id)} style={{ padding: "8px 14px", borderRadius: "20px", background: selectedGenres.includes(g.id) ? "rgba(168,85,247,0.15)" : "transparent", border: "1px solid", borderColor: selectedGenres.includes(g.id) ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)", color: selectedGenres.includes(g.id) ? "#fff" : "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. & 5. YEAR & RATING ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Release Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", fontWeight: 700, outline: "none", cursor: "pointer", appearance: "none" }}>
                {YEARS.map(y => <option key={y.id} value={y.id} style={{ background: "#0a0510" }}>{y.label}</option>)}
              </select>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Minimum Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={{ padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", fontWeight: 700, outline: "none", cursor: "pointer", appearance: "none" }}>
                {RATINGS.map(r => <option key={r.id} value={r.id} style={{ background: "#0a0510" }}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* 6. SORT BY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sort By</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {SORTS.map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: "8px 14px", borderRadius: "20px", background: sortBy === s.id ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid", borderColor: sortBy === s.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)", color: sortBy === s.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* FIND MY WATCH CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.3)" }} whileTap={{ scale: 0.98 }}
              onClick={handleInitialScan}
              style={{ width: "100%", padding: "18px", borderRadius: "16px", background: "linear-gradient(135deg, #a855f7, #7e22ce)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", boxShadow: "0 10px 20px rgba(168,85,247,0.2)" }}
            >
              {isScanning && !hasScanned ? "Calibrating..." : "Find My Watch"}
            </motion.button>

            <button onClick={resetAll} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s" }}>
              Reset Configuration
            </button>
          </div>

        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — LIVE RECOMMENDATION (62%)
          ========================================= */}
      <div className="no-scrollbar" style={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10, overflowY: "auto", paddingBottom: "60px" }}>
        
        <AnimatePresence mode="wait">
          
          {/* IDLE EMPTY STATE */}
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: 0.4 }}>
              <span style={{ fontSize: "56px", marginBottom: "24px" }}>🎬</span>
              <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "0.05em", color: "#fff", textTransform: "uppercase" }}>Your Next Watch<br/>Will Appear Here</h3>
              <p style={{ margin: "12px 0 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Tell us what you're looking for on the left.</p>
            </motion.div>
          )}

          {/* CALIBRATING STATE */}
          {status === "calibrating" && (
            <motion.div key="calibrating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: "48px", height: "48px", border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#a855f7", borderRadius: "50%", marginBottom: "24px" }} />
              <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} style={{ margin: 0, fontSize: "12px", fontWeight: 900, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Calibrating...
              </motion.p>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {status === "success" && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%" }}>
              
              {/* PRIMARY HERO MATCH */}
              {heroMatch && (
                <div style={{ marginBottom: "48px" }}>
                  <h2 style={{ margin: "0 0 16px 0", fontSize: "13px", fontWeight: 900, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>Top Neural Match</h2>
                  <motion.div style={{ position: "relative", width: "100%", height: "480px", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }}>
                    <img src={`https://image.tmdb.org/t/p/original${heroMatch.backdrop_path || heroMatch.poster_path}`} alt={heroMatch.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,0,10,1) 0%, transparent 100%)" }} />
                    
                    <div style={{ position: "absolute", bottom: 0, left: 0, padding: "48px", width: "100%", boxSizing: "border-box" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "10px", fontWeight: 800, backdropFilter: "blur(10px)" }}>★ {heroMatch.vote_average?.toFixed(1)}</span>
                        <span style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "10px", fontWeight: 800, backdropFilter: "blur(10px)" }}>{heroMatch.release_date?.split('-')[0] || heroMatch.first_air_date?.split('-')[0] || "N/A"}</span>
                        <span style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", backdropFilter: "blur(10px)" }}>{heroMatch.media_type}</span>
                      </div>

                      <h1 style={{ margin: "0 0 12px 0", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 900, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.8)", lineHeight: 1.1 }}>{heroMatch.title || heroMatch.name}</h1>
                      <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#a855f7", fontWeight: 800, fontStyle: "italic" }}>"{getReasonString()}"</p>
                      <p style={{ margin: "0 0 32px 0", fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: "80%", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.6 }}>{heroMatch.overview}</p>
                      
                      <div style={{ display: "flex", gap: "16px" }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelectMedia?.({ ...heroMatch, mediaType: heroMatch.media_type || "movie" })} style={{ padding: "14px 32px", borderRadius: "30px", background: "#fff", color: "#000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
                          Explore Title
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetAll} style={{ padding: "14px 32px", borderRadius: "30px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", backdropFilter: "blur(10px)" }}>
                          Not For Me
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* SECONDARY ROW */}
              {gridMatches.length > 0 && (
                <div>
                  <h2 style={{ margin: "0 0 24px 0", fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>Other High-Probability Matches</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" }}>
                    {gridMatches.map((media, idx) => (
                      <motion.div key={`${media.id}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || "movie" })} whileHover={{ scale: 1.05, y: -5 }} style={{ width: "100%", aspectRatio: "2/3", borderRadius: "12px", overflow: "hidden", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.4)" }}>
                        <PremiumMediaCard media={media as any} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* LOAD MORE BUTTON */}
              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", paddingBottom: "24px" }}>
                  <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }} whileTap={{ scale: 0.95 }} onClick={loadMore} disabled={isScanning} style={{ padding: "14px 36px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#fff", fontSize: "12px", fontWeight: 900, cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {isScanning ? "Scanning Deep Core..." : "Load More"}
                  </motion.button>
                </div>
              )}

            </motion.div>
          )}

          {/* ERROR STATE */}
          {status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <span style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🛰️</span>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600 }}>We drifted too far into the void.<br/>No exact matches found for these strict parameters.</p>
              <button onClick={() => setStatus("idle")} style={{ marginTop: "24px", padding: "10px 20px", borderRadius: "20px", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>Adjust Calibration</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}