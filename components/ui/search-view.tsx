"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoviePoster {
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
  media_type?: string;
}

interface SearchViewProps {
  aiQueryContext?: {
    type: "recommendations" | "discover";
    anchorMovieId?: number;
    anchorTitle?: string;
    queryParams?: string;
  } | null;
  onSelectMedia?: (media: any) => void;
}

export default function SearchView({ aiQueryContext, onSelectMedia }: SearchViewProps) {
  const [results, setResults] = useState<MoviePoster[]>([]);
  const [searchHeadline, setSearchHeadline] = useState("Explore The Omniverse");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fallback string for proxy routing
  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // ── 📡 BALANCED REGIONAL TRENDING PIPELINE (EDGE ROUTED) ──
  const fetchBalancedTrending = async () => {
    if (!proxyUrl) return;
    setLoading(true);
    try {
      // 🎯 HARD FIX: Parallel Request Matrix routed through Cloudflare Gateway
      const [hollywoodRes, bollywoodRes, southIndianRes] = await Promise.all([
        fetch(`${proxyUrl}/api/discover/movie?with_original_language=en&sort_by=popularity.desc&page=1`),
        fetch(`${proxyUrl}/api/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1`),
        fetch(`${proxyUrl}/api/discover/movie?with_original_language=te|ta|ml|kn&sort_by=popularity.desc&page=1`)
      ]);

      const [hollywoodData, bollywoodData, southIndianData] = await Promise.all([
        hollywoodRes.json(),
        bollywoodRes.json(),
        southIndianRes.json()
      ]);

      const hollywoodList = hollywoodData.results || [];
      const bollywoodList = bollywoodData.results || [];
      const southIndianList = southIndianData.results || [];

      // Interleave Splicing Engine to enforce clean, premium visual distribution
      const balancedArray: MoviePoster[] = [];
      const maxLength = Math.max(hollywoodList.length, bollywoodList.length, southIndianList.length);

      for (let i = 0; i < maxLength; i++) {
        // High priority rotation: 1 Hollywood -> 1 Bollywood -> 1 South Indian regional title
        if (hollywoodList[i]) balancedArray.push({ ...hollywoodList[i], media_type: "movie" });
        if (bollywoodList[i]) balancedArray.push({ ...bollywoodList[i], media_type: "movie" });
        if (southIndianList[i]) balancedArray.push({ ...southIndianList[i], media_type: "movie" });
      }

      setResults(balancedArray);
      setSearchHeadline("Explore The Omniverse");
    } catch (err) {
      console.error("DoBinge Regional Aggregator Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── 📡 CORE ADAPTIVE DATA FETCH ENGINE ──
  const fetchMovies = async (endpoint: string, headlineText: string) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setSearchHeadline(headlineText);
      }
    } catch (err) {
      console.error("DoBinge Engine Fetch Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── 🔄 CONTEXT EFFECT OBSERVER ──
  useEffect(() => {
    if (!proxyUrl) return;

    if (aiQueryContext) {
      if (aiQueryContext.type === "recommendations" && aiQueryContext.anchorMovieId) {
        // 🎯 HARD FIX: Edge Routing
        const endpoint = `${proxyUrl}/api/movie/${aiQueryContext.anchorMovieId}/recommendations?page=1`;
        fetchMovies(endpoint, `Vibe Anchor: ${aiQueryContext.anchorTitle}`);
      } else if (aiQueryContext.type === "discover" && aiQueryContext.queryParams) {
        // 🎯 HARD FIX: Edge Routing
        const endpoint = `${proxyUrl}/api/discover/movie?sort_by=popularity.desc&page=1${aiQueryContext.queryParams}`;
        fetchMovies(endpoint, "Alchemical Taste Profile");
      }
    } else {
      // Execute our newly designed multi-region dashboard matrix
      fetchBalancedTrending();
    }
  }, [aiQueryContext, proxyUrl]);

  // ── 🔍 TEXT MANIFOLD SEARCH SUBMISSION ──
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyUrl || !searchQuery.trim()) return;

    // 🎯 HARD FIX: Edge Routing
    const endpoint = `${proxyUrl}/api/search/multi?query=${encodeURIComponent(searchQuery)}&page=1`;
    fetchMovies(endpoint, `Results for "${searchQuery}"`);
  };

  // 🎯 HARD FIX: Piped image loaders through Cloudflare Gateway
  const getPosterImageUrl = (movie: MoviePoster) => {
    if (movie.poster_path && typeof movie.poster_path === "string" && movie.poster_path !== "null") {
      return `${proxyUrl}/image/t/p/w500${movie.poster_path}`;
    }
    if (movie.backdrop_path && typeof movie.backdrop_path === "string" && movie.backdrop_path !== "null") {
      return `${proxyUrl}/image/t/p/w500${movie.backdrop_path}`;
    }
    return null;
  };

  return (
    <div style={{ width: "100%", minHeight: "100%", padding: "24px 28px 40px 0", boxSizing: "border-box" }}>
      
      {/* Search Input Control Console */}
      <div style={{ marginBottom: "32px", width: "100%", maxWidth: "500px" }}>
        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles manually or use the AI Vibe Engine..."
            style={{
              flex: 1, padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(20, 20, 25, 0.6)", backdropFilter: "blur(20px)", color: "#ffffff",
              fontSize: "12px", outline: "none", transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)"}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"}
          />
          <button
            type="submit"
            style={{
              padding: "0 22px", borderRadius: "14px", border: "none", backgroundColor: "#8B5CF6",
              color: "#ffffff", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.05em", cursor: "pointer", transition: "background-color 0.2s"
            }}
          >
            BOOM
          </button>
        </form>
      </div>

      {/* Dynamic Section Headline */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, textTransform: "capitalize" }}>
          {searchHeadline}
        </h2>
        {aiQueryContext && (
          <span style={{ fontSize: "9px", fontWeight: 900, color: "#A78BFA", backgroundColor: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Context Active
          </span>
        )}
      </div>

      {/* Media Grid Manifest Viewport */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Aligning Grid Nodes...
          </span>
        </div>
      ) : (
        <motion.div 
          layout
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))", gap: "24px 16px" }}
        >
          <AnimatePresence mode="popLayout">
            {results.map((movie) => {
              const displayTitle = movie.title || movie.name || movie.original_title || movie.original_name || "Untitled Production";
              const rawDate = movie.release_date || movie.first_air_date;
              const displayYear = rawDate ? rawDate.split("-")[0] : "";
              const calculatedMediaType = movie.media_type || "movie";
              const imageUrl = getPosterImageUrl(movie);
              const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "NR";

              return (
                <motion.div
                  key={`${movie.id}-${calculatedMediaType}-${displayTitle}`}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 10 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                  onClick={() => onSelectMedia?.({ ...movie, media_type: calculatedMediaType })}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    backgroundColor: "#0B090C",
                    aspectRatio: "2/3",
                    cursor: "pointer",
                    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {/* ── BACKGROUND POSTER ── */}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex", flexDirection: "column",
                      justifyContent: "space-between", padding: "24px 16px", boxSizing: "border-box",
                      background: "linear-gradient(135deg, rgba(25, 20, 35, 0.7) 0%, rgba(10, 10, 15, 0.9) 100%)",
                      position: "relative"
                    }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "20px" }}>
                        <p style={{
                          margin: 0, fontSize: "12px", fontWeight: 900, color: "#ffffff",
                          letterSpacing: "-0.02em", lineHeight: "1.4",
                          background: "linear-gradient(to bottom right, #ffffff 30%, rgba(255,255,255,0.6) 100%)",
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                          textAlign: "center"
                        }}>
                          {displayTitle}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── CINEMATIC GRADIENT OVERLAY ── */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)", pointerEvents: "none" }} />
                  
                  {/* ── TOP RIGHT: RATING ── */}
                  {rating !== "NR" && (
                    <div style={{ position: "absolute", top: "10px", right: "12px", display: "flex", alignItems: "flex-start", gap: "2px", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                      <span style={{ color: "#ffffff", fontSize: "18px", fontWeight: 300, lineHeight: 1 }}>{rating}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff" style={{ marginTop: "2px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  )}

                  {/* ── BOTTOM CONTENT: TITLE & METADATA PILLS ── */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 10 }}>
                    <h3 style={{ 
                      margin: 0, color: "#ffffff", fontSize: "14px", fontWeight: 700, lineHeight: 1.2,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      textShadow: "0 2px 10px rgba(0,0,0,0.8)"
                    }}>
                      {displayTitle}
                    </h3>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {displayYear && (
                        <span style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: "10px", fontWeight: 600, padding: "4px 8px", borderRadius: "12px", letterSpacing: "0.03em" }}>
                          {displayYear}
                        </span>
                      )}
                      <span style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: "10px", fontWeight: 600, padding: "4px 8px", borderRadius: "12px", letterSpacing: "0.03em", textTransform: "capitalize" }}>
                        {calculatedMediaType === "tv" ? "Series" : "Movie"}
                      </span>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}