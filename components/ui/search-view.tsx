"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

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
  genre_ids?: number[];
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

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  // ── 📡 BALANCED REGIONAL TRENDING PIPELINE (EDGE ROUTED) ──
  const fetchBalancedTrending = async () => {
    if (!proxyUrl) return;
    setLoading(true);
    try {
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

      const balancedArray: MoviePoster[] = [];
      const maxLength = Math.max(hollywoodList.length, bollywoodList.length, southIndianList.length);

      for (let i = 0; i < maxLength; i++) {
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
        const endpoint = `${proxyUrl}/api/movie/${aiQueryContext.anchorMovieId}/recommendations?page=1`;
        fetchMovies(endpoint, `Vibe Anchor: ${aiQueryContext.anchorTitle}`);
      } else if (aiQueryContext.type === "discover" && aiQueryContext.queryParams) {
        const endpoint = `${proxyUrl}/api/discover/movie?sort_by=popularity.desc&page=1${aiQueryContext.queryParams}`;
        fetchMovies(endpoint, "Alchemical Taste Profile");
      }
    } else {
      fetchBalancedTrending();
    }
  }, [aiQueryContext, proxyUrl]);

  // ── 🔍 TEXT MANIFOLD SEARCH SUBMISSION ──
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyUrl || !searchQuery.trim()) return;

    const endpoint = `${proxyUrl}/api/search/multi?query=${encodeURIComponent(searchQuery)}&page=1`;
    fetchMovies(endpoint, `Results for "${searchQuery}"`);
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
          /* 🚨 ARCHITECTURE UPGRADE: Responsive CSS grid with vertical padding to prevent hover scale clipping */
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
            gap: "32px 16px",
            paddingTop: "8px",
            paddingBottom: "32px"
          }}
        >
          <AnimatePresence mode="popLayout">
            {results.map((movie) => {
              const calculatedMediaType = movie.media_type || "movie";

              return (
                <motion.div
                  key={`${movie.id}-${calculatedMediaType}-${movie.title || movie.name}`}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {/* 🚨 THE GLOBAL STANDARD: We now import the single source of truth */}
                  <PremiumMediaCard 
                    media={{ ...movie, media_type: calculatedMediaType } as any}
                    onClick={() => onSelectMedia?.({ ...movie, mediaType: calculatedMediaType, media_type: calculatedMediaType })}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}