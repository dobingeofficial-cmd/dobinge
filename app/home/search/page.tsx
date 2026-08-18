"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/context/ModalContext";

// Reuse your existing PremiumMediaCard (ensure the path is correct based on your repo)
import PremiumMediaCard from "@/components/ui/PremiumMediaCard"; 

export default function SearchMatrix() {
  const { setSelectedMedia } = useModal();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"multi" | "movie" | "tv" | "person">("multi");

  const inputRef = useRef<HTMLInputElement>(null);
  const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";

  // 🚨 ZERO-BUDGET DEBOUNCE ENGINE: Protects API limits 🚨
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        // Switch endpoint based on active tab. 'multi' searches everything.
        const endpoint = activeTab === "multi" ? "search/multi" : `search/${activeTab}`;
        const res = await fetch(`${proxyUrl}/api/${endpoint}?query=${encodeURIComponent(query)}&page=1`);
        
        if (res.ok) {
          const data = await res.json();
          // Filter out garbage results
          const validResults = data.results.filter((item: any) => 
            item.poster_path || item.profile_path || item.backdrop_path
          );
          setResults(validResults);
        }
      } catch (error) {
        console.error("Search Matrix Error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms delay

    return () => clearTimeout(debounceTimer);
  }, [query, activeTab, proxyUrl]);

  // Suggested trending tags for the empty state
  const trendingVibes = [
    "Cyberpunk", "Space Opera", "Psychological Thriller", "Studio Ghibli", 
    "Post-Apocalyptic", "A24 Masterpieces", "Time Travel", "Cozy Anime"
  ];

  return (
    <div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      
      {/* ── 🌌 CINEMATIC AMBIENT GLOW ── */}
      <motion.div 
        animate={{ 
          opacity: isFocused ? 0.8 : 0.3,
          scale: isFocused ? 1.1 : 1,
          top: query ? "-100px" : "30vh"
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "300px",
          background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(8,7,13,0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      {/* ── 🔍 THE SEARCH PORTAL ── */}
      <motion.div 
        layout
        initial={{ y: "30vh" }}
        animate={{ y: query ? 0 : "30vh" }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
        style={{ width: "100%", maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 10 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
          
          {/* LIQUID GLASS INPUT */}
          <motion.div 
            animate={{ 
              boxShadow: isFocused 
                ? "0 0 40px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255,255,255,0.1)" 
                : "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)",
              borderColor: isFocused ? "rgba(192, 132, 252, 0.4)" : "rgba(255,255,255,0.08)",
              backgroundColor: isFocused ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)"
            }}
            style={{
              width: "100%", height: "72px", borderRadius: "36px",
              display: "flex", alignItems: "center", padding: "0 24px", gap: "16px",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              transition: "border-color 0.3s, background-color 0.3s",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <svg width="24" height="24" fill="none" stroke={isFocused ? "#c084fc" : "rgba(255,255,255,0.4)"} strokeWidth="2.5" viewBox="0 0 24 24" style={{ transition: "stroke 0.3s" }}>
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Eg. Movies similar to Interstellar..."
              style={{
                flex: 1, height: "100%", background: "transparent", border: "none", outline: "none",
                color: "#ffffff", fontSize: "20px", fontWeight: 600, letterSpacing: "-0.01em"
              }}
            />

            <AnimatePresence>
              {query && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)"
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* EMPTY STATE VIBES */}
          <AnimatePresence>
            {!query && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", maxWidth: "600px", marginTop: "16px" }}
              >
                {trendingVibes.map((vibe) => (
                  <motion.div
                    key={vibe} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(192,132,252,0.3)" }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setQuery(vibe); inputRef.current?.focus(); }}
                    style={{
                      padding: "10px 20px", borderRadius: "24px", cursor: "pointer",
                      backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.02em",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    {vibe}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── 🎬 SEARCH RESULTS ENGINE ── */}
      <AnimatePresence>
        {query && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", gap: "32px", marginTop: "48px", zIndex: 5 }}
          >
            {/* TABS */}
            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
              {[
                { id: "multi", label: "Everything" },
                { id: "movie", label: "Movies" },
                { id: "tv", label: "TV Shows" },
                { id: "person", label: "Actors & Directors" }
              ].map((tab) => (
                <div 
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  style={{ 
                    fontSize: "14px", fontWeight: activeTab === tab.id ? 800 : 600, 
                    color: activeTab === tab.id ? "#ffffff" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", position: "relative", paddingBottom: "4px", transition: "color 0.2s"
                  }}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="searchTabIndicator" style={{ position: "absolute", bottom: "-17px", left: 0, right: 0, height: "2px", backgroundColor: "#c084fc", boxShadow: "0 0 10px rgba(192, 132, 252, 0.5)" }} />
                  )}
                </div>
              ))}
            </div>

            {/* GRID & LOADER */}
            {isSearching ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: "16px" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Scanning Neural Net...</span>
              </div>
            ) : results.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "24px" }}>
                {results.map((item, idx) => (
                  <motion.div key={`${item.id}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
                    {activeTab === "person" || item.media_type === "person" ? (
                      // Simplistic Person Card
                      <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {item.profile_path ? (
                          <img src={`${proxyUrl}/image/t/p/w500${item.profile_path}`} style={{ width: "100%", height: "80%", objectFit: "cover" }} alt={item.name} />
                        ) : (
                          <div style={{ width: "100%", height: "80%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111" }}><span style={{ fontSize: "40px" }}>👤</span></div>
                        )}
                        <div style={{ padding: "12px", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{item.known_for_department}</span>
                        </div>
                      </div>
                    ) : (
                      <PremiumMediaCard media={item} onClick={() => setSelectedMedia({ ...item, mediaType: item.media_type || activeTab })} />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: "16px" }}>
                <span style={{ fontSize: "48px", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}>🕳️</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "-0.02em" }}>No signals found in the multiverse.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}