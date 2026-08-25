"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}

// 🚨 SMART QUERY DICTIONARY: Rebuilt to guarantee massive, high-quality TMDB payloads
const QUESTIONS = [
  {
    id: "mood",
    title: "What are you in the mood for?",
    options: [
      { label: "Feel Good", emoji: "😊", genre: "35,10751" },
      { label: "Mind Blowing", emoji: "🧠", genre: "878,9648" },
      { label: "Dark & Scary", emoji: "😱", genre: "27,53" },
      { label: "Romantic", emoji: "❤️", genre: "10749" },
      { label: "Emotional", emoji: "🥹", genre: "18" },
      { label: "Intense", emoji: "🔥", genre: "28,80" },
      { label: "Relaxing", emoji: "🌙", genre: "99" },
      { label: "Surprise Me", emoji: "✨", genre: "" }
    ]
  },
  {
    id: "time",
    title: "How much time do you have?",
    options: [
      { label: "Under 90 mins", emoji: "⏱️" },
      { label: "About 2 hours", emoji: "🍿" },
      { label: "2+ hours", emoji: "🛋️" },
      { label: "I don't care", emoji: "🤷" }
    ]
  },
  {
    id: "type",
    title: "What do you want to watch?",
    options: [
      { label: "Movie", emoji: "🎬", type: "movie" },
      { label: "TV Show", emoji: "📺", type: "tv" },
      { label: "Anime", emoji: "⛩️", type: "tv", isAnime: true },
      { label: "Anything", emoji: "🎲", type: "multi" }
    ]
  },
  {
    id: "vibe",
    title: "How adventurous are you feeling?",
    options: [
      { label: "Familiar", emoji: "🏠" },
      { label: "Something New", emoji: "🚀" },
      { label: "Hidden Gem", emoji: "💎" },
      { label: "Surprise Me", emoji: "✨" }
    ]
  }
];

const RIGHT_PANEL_REACTIONS = [
  { emoji: "🎬", title: "YOUR NEXT WATCH WILL APPEAR HERE", sub: "Answer a few questions and we'll populate the grid." },
  { emoji: "🧠", title: "NICE CHOICE.", sub: "Let's dial it in." },
  { emoji: "⏳", title: "WE'RE GETTING CLOSER.", sub: "Just a couple more details." },
  { emoji: "✨", title: "ALMOST THERE.", sub: "Cross-referencing the DoBinge Neural Core." }
];

export default function DiscoverView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<MovieItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchPage, setFetchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  const handleSelectOption = (option: any) => {
    const newAnswers = [...answers];
    newAnswers[step] = option;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(step + 1); 
        fetchRecommendation(newAnswers, 1);
      }
    }, 300); 
  };

  // 🚨 SMART QUERY BUILDER: Dynamically parses requirements to prevent 0-result API crashes
  const fetchRecommendation = async (currentAnswers: any[], pageNum: number) => {
    setIsFetching(true);
    try {
      const mood = currentAnswers[0];
      const time = currentAnswers[1];
      const type = currentAnswers[2];
      const vibe = currentAnswers[3];

      let mediaType = type.type;
      if (mediaType === "multi") mediaType = Math.random() > 0.5 ? "movie" : "tv";

      let query = `language=en-US&page=${pageNum}`;

      if (mood.genre) query += `&with_genres=${mood.genre}`;
      if (type.isAnime) query += `&with_original_language=ja`;

      // Safely apply runtimes (TV shows break if you use movie runtimes)
      if (mediaType === "movie") {
        if (time.label.includes("Under 90")) query += "&with_runtime.lte=90";
        if (time.label.includes("About 2 hours")) query += "&with_runtime.gte=90&with_runtime.lte=140";
        if (time.label.includes("2+ hours")) query += "&with_runtime.gte=140";
      } else {
        if (time.label.includes("Under 90")) query += "&with_episode_runtime.lte=60";
      }

      // Vibe routing logic
      if (vibe.label === "Familiar") query += "&sort_by=popularity.desc&vote_count.gte=3000";
      if (vibe.label === "Something New") {
        query += mediaType === "movie" 
          ? "&sort_by=popularity.desc&primary_release_date.gte=2023-01-01" 
          : "&sort_by=popularity.desc&first_air_date.gte=2023-01-01";
      }
      if (vibe.label === "Hidden Gem") query += "&sort_by=vote_average.desc&vote_average.gte=6.5&vote_count.gte=100&vote_count.lte=1500";
      if (vibe.label === "Surprise Me") {
         query += `&sort_by=popularity.desc`;
         if (pageNum === 1) query = query.replace(`page=1`, `page=${Math.floor(Math.random() * 10) + 1}`);
      }
      
      const res = await fetch(`${proxyUrl}/api/discover/${mediaType}?${query}`);
      if (!res.ok) throw new Error("Recommendation fetch failed");
      
      const data = await res.json();
      const results = (data.results || []).map((item: any) => ({ ...item, mediaType }));
      const validResults = results.filter((item: any) => item.poster_path);

      // Disable load more button if TMDB runs out of pages
      setHasMore(data.page < data.total_pages && validResults.length > 0);

      if (pageNum === 1) {
        setRecommendations(validResults);
      } else {
        setRecommendations(prev => {
           // Prevent duplicate posters when loading new pages
           const existingIds = new Set(prev.map(r => r.id));
           const newUnique = validResults.filter((r: any) => !existingIds.has(r.id));
           return [...prev, ...newUnique];
        });
      }
    } catch (err) {
      console.error("DoBinge Engine Fault:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const resetQuestions = () => {
    setStep(0);
    setAnswers([]);
    setRecommendations([]);
    setFetchPage(1);
    setHasMore(true);
  };

  return (
    // 🚨 CSS LOCK: minHeight: 0 prevents the child grid from stretching the parent.
    <div style={{ display: "flex", width: "100%", height: "100%", minHeight: 0 }}>
      
      {/* =========================================
          LEFT PANEL — QUICK QUESTIONS (38%)
          ========================================= */}
      {/* 🚨 PERMANENTLY FROZEN Left Side */}
      <div style={{ flex: "0 0 38%", paddingRight: "4%", borderRight: "1px solid rgba(255,255,255,0.05)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#ffffff", margin: "0 0 8px 0" }}>
            Find Something To Watch
          </h1>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Tell us what you're feeling. We'll find the rest.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.3 }}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#a855f7", letterSpacing: "0.15em" }}>
                    0{step + 1} / 0{QUESTIONS.length}
                  </span>
                  <div style={{ flex: 1, maxWidth: "120px", height: "2px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                    <motion.div initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} style={{ height: "100%", backgroundColor: "#a855f7" }} transition={{ duration: 0.4 }} />
                  </div>
                </div>

                <h2 style={{ fontSize: "clamp(22px, 2vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", margin: 0 }}>
                  {QUESTIONS[step].title}
                </h2>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {QUESTIONS[step].options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 22px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", fontSize: "14px", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(12px)", transition: "background-color 0.2s, border-color 0.2s" }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4ade80", marginBottom: "20px" }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferences Locked</span>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px" }}>
                  {answers.map((a, i) => (
                    <span key={i} style={{ padding: "8px 14px", borderRadius: "20px", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)", fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
                      {a.label}
                    </span>
                  ))}
                </div>

                <motion.button onClick={resetQuestions} whileHover={{ color: "#fff" }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "8px", padding: 0 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Change Answers
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — ISOLATED SCROLLING GRID (62%)
          ========================================= */}
      {/* 🚨 CSS LOCK: The wrapper is flex:1 and strictly minHeight: 0 to enforce internal scrolling */}
      <div style={{ flex: 1, paddingLeft: "4%", display: "flex", flexDirection: "column", position: "relative", height: "100%", minHeight: 0 }}>
        
        <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "100%", background: "linear-gradient(to right, rgba(168, 85, 247, 0.05) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        {/* 🚨 THE ISOLATED SCROLL BOX: This is the ONLY element that will scroll */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 10, paddingBottom: "100px", minHeight: 0 }}>
          <AnimatePresence mode="wait">
            
            {/* STATE: CONVERSATIONAL PROMPTS */}
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.4 }}
                style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "16px", paddingBottom: "10%" }}
              >
                <span style={{ fontSize: "56px", filter: "drop-shadow(0 0 30px rgba(168,85,247,0.3))" }}>{RIGHT_PANEL_REACTIONS[step].emoji}</span>
                <h3 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>{RIGHT_PANEL_REACTIONS[step].title}</h3>
                <p style={{ margin: 0, fontSize: "16px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{RIGHT_PANEL_REACTIONS[step].sub}</p>
              </motion.div>
            ) : 

            /* STATE: NEURAL CORE SCANNING */
            isFetching && recommendations.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "56px", height: "56px", border: "4px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>Synthesizing Grid...</p>
              </motion.div>
            ) : 

            /* STATE: THE RESULT GRID */
            recommendations.length > 0 ? (
              <motion.div 
                key="grid-results"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ width: "100%", paddingTop: "10px" }}
              >
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>Top Neural Matches</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "rgba(168, 85, 247, 0.9)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Curated exclusively for this moment.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "24px" }}>
                  {recommendations.map((media, idx) => (
                    <motion.div 
                      key={`${media.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (idx % 20) * 0.05, duration: 0.4 }}
                      onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || "movie" })}
                      style={{ cursor: "pointer" }}
                    >
                      <PremiumMediaCard media={media as any} />
                    </motion.div>
                  ))}
                </div>

                {/* 🚨 FULLY FUNCTIONAL PAGINATION BUTTON */}
                {hasMore && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }} whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        const next = fetchPage + 1;
                        setFetchPage(next);
                        fetchRecommendation(answers, next);
                      }} 
                      disabled={isFetching} 
                      style={{ padding: "14px 36px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", backdropFilter: "blur(12px)", boxShadow: "0 10px 20px rgba(168, 85, 247, 0.2)", transition: "all 0.2s" }}
                    >
                      {isFetching ? "Expanding Core..." : "Load More Matches"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: "10%" }}>
                <span style={{ fontSize: "40px", marginBottom: "16px" }}>🛸</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600 }}>We drifted too far into the void.<br/>No exact matches found for those criteria.</p>
                <button onClick={resetQuestions} style={{ marginTop: "24px", padding: "12px 28px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>Let's Try Again</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}