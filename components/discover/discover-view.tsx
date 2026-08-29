"use client";

import React, { useState } from "react";
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
}

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
  const router = useRouter();
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
    }, 350); 
  };

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

      if (mediaType === "movie") {
        if (time.label.includes("Under 90")) query += "&with_runtime.lte=90";
        if (time.label.includes("About 2 hours")) query += "&with_runtime.gte=90&with_runtime.lte=140";
        if (time.label.includes("2+ hours")) query += "&with_runtime.gte=140";
      } else {
        if (time.label.includes("Under 90")) query += "&with_episode_runtime.lte=60";
      }

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

      setHasMore(data.page < data.total_pages && validResults.length > 0);

      if (pageNum === 1) {
        setRecommendations(validResults);
      } else {
        setRecommendations(prev => {
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

  const heroMatch = recommendations.length > 0 ? recommendations[0] : null;
  const gridMatches = recommendations.length > 1 ? recommendations.slice(1) : [];

  // 🚨 BULLETPROOF INDEX CAPPING 🚨
  // This ensures that when step updates to 4, the exiting animation still safely renders index 3
  const safeStep = Math.min(step, QUESTIONS.length - 1);
  const currentQuestion = QUESTIONS[safeStep];
  const currentReaction = RIGHT_PANEL_REACTIONS[safeStep];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(100px)", pointerEvents: "none", zIndex: 0
      }} />

      {/* =========================================
          LEFT PANEL — QUESTION ENGINE (35%)
          ========================================= */}
      <div style={{
        flex: "0 0 35%", padding: "40px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", zIndex: 10
      }}>
        
        <motion.button
          onClick={() => router.push('/home')}
          whileHover={{ x: -4, color: "#ffffff" }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "absolute", top: "40px", left: "40px",
            display: "flex", alignItems: "center", gap: "8px",
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.1em", cursor: "pointer", padding: 0, transition: "color 0.2s"
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Home
        </motion.button>

        <div style={{ marginBottom: "40px", marginTop: "40px" }}>
          <h1 style={{
            fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 900, textTransform: "uppercase",
            letterSpacing: "0.02em", margin: "0 0 12px 0",
            background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0.5))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Discovery Engine
          </h1>
        </div>

        <div style={{ position: "relative" }}>
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: "32px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#a855f7", letterSpacing: "0.15em" }}>
                    0{step + 1} / 0{QUESTIONS.length}
                  </span>
                  <div style={{ flex: 1, height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                    <motion.div 
                      initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} 
                      animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} 
                      style={{ height: "100%", background: "linear-gradient(to right, #9333ea, #c084fc)", boxShadow: "0 0 10px #a855f7" }} 
                      transition={{ duration: 0.4, ease: "easeInOut" }} 
                    />
                  </div>
                </div>

                <h2 style={{ fontSize: "clamp(22px, 2vw, 28px)", fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.3 }}>
                  {currentQuestion.title}
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {currentQuestion.options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.1)", borderColor: "rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "16px", borderRadius: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "#ffffff", cursor: "pointer", textAlign: "left",
                        transition: "all 0.2s"
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>{opt.emoji}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{
                  padding: "32px",
                  borderRadius: "24px",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(20px)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a855f7", marginBottom: "24px" }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>Neural Link Active</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                    {answers.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                          {a.emoji}
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3e8ff" }}>
                          {a.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <motion.button 
                    onClick={resetQuestions} 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: "100%", padding: "16px", borderRadius: "16px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#ffffff", fontSize: "12px", fontWeight: 900,
                      textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer"
                    }}
                  >
                    Recalibrate Search
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — ISOLATED SCROLLING GRID (65%)
          ========================================= */}
      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        
        <div style={{ position: "absolute", top: 0, left: 0, width: "100px", height: "100%", background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 10, paddingBottom: "100px" }}>
          <AnimatePresence mode="wait">
            
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, filter: "blur(10px)" }} 
                animate={{ opacity: 1, filter: "blur(0px)" }} 
                exit={{ opacity: 0, filter: "blur(10px)" }} 
                style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}
              >
                <div style={{ fontSize: "64px", opacity: 0.5, filter: "drop-shadow(0 0 40px rgba(168,85,247,0.2))" }}>
                  {currentReaction.emoji}
                </div>
              </motion.div>
            ) : 

            isFetching && recommendations.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "50px", height: "50px", border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                <p style={{ margin: 0, fontSize: "12px", color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>Synthesizing Results...</p>
              </motion.div>
            ) : 

            recommendations.length > 0 ? (
              <motion.div 
                key="grid-results"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                style={{ width: "100%", paddingTop: "40px" }}
              >
                
                {heroMatch && (
                  <div style={{ marginBottom: "48px" }}>
                    <h2 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 900, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                      Top Neural Match
                    </h2>
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => onSelectMedia?.({ ...heroMatch, mediaType: heroMatch.media_type || "movie" })}
                      style={{
                        position: "relative", width: "100%", height: "400px", borderRadius: "24px", overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
                      }}
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/original${heroMatch.backdrop_path || heroMatch.poster_path}`} 
                        alt={heroMatch.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,0,10,1) 0%, transparent 100%)" }} />
                      
                      <div style={{ position: "absolute", bottom: 0, left: 0, padding: "40px", width: "100%", boxSizing: "border-box" }}>
                        <h1 style={{ margin: "0 0 12px 0", fontSize: "40px", fontWeight: 900, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
                          {heroMatch.title || heroMatch.name}
                        </h1>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "80%", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                          {heroMatch.overview}
                        </p>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ padding: "8px 20px", borderRadius: "20px", background: "#fff", color: "#000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Explore Title
                          </span>
                          <span style={{ padding: "8px 20px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: "12px", fontWeight: 900, backdropFilter: "blur(10px)" }}>
                            ★ {heroMatch.vote_average?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {gridMatches.length > 0 && (
                  <div>
                    <h2 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                      Other High-Probability Matches
                    </h2>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", 
                      gap: "24px" 
                    }}>
                      {gridMatches.map((media, idx) => (
                        <motion.div 
                          key={`${media.id}-${idx}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (idx % 10) * 0.05, duration: 0.4 }}
                          onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || "movie" })}
                          whileHover={{ scale: 1.05, y: -5 }}
                          style={{ 
                            position: "relative",
                            width: "100%", 
                            aspectRatio: "2/3", 
                            borderRadius: "16px",
                            overflow: "hidden",
                            cursor: "pointer",
                            boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
                          }}
                        >
                          <PremiumMediaCard media={media as any} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "48px", paddingBottom: "48px" }}>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        const next = fetchPage + 1;
                        setFetchPage(next);
                        fetchRecommendation(answers, next);
                      }} 
                      disabled={isFetching} 
                      style={{ padding: "16px 40px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#fff", fontSize: "12px", fontWeight: 900, cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.1em" }}
                    >
                      {isFetching ? "Scanning Deep Core..." : "Load More"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: "10%" }}>
                <span style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🛰️</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 600 }}>We drifted too far into the void.<br/>No exact matches found.</p>
                <motion.button 
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  onClick={resetQuestions} style={{ marginTop: "24px", padding: "12px 24px", borderRadius: "24px", backgroundColor: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Restart Sequence
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