"use client";

import React, { useState, useEffect } from "react";
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

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      
      {/* Ambient Deep Glow Layer */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(100px)", pointerEvents: "none", zIndex: 0
      }} />

      {/* =========================================
          LEFT PANEL — QUESTION ENGINE (40%)
          ========================================= */}
      <div style={{
        flex: "0 0 40%", padding: "40px 60px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", zIndex: 10
      }}>
        
        <motion.button
          onClick={() => router.push('/home')}
          whileHover={{ x: -4, color: "#ffffff" }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "absolute", top: "40px", left: "60px",
            display: "flex", alignItems: "center", gap: "8px",
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.1em", cursor: "pointer", padding: 0, transition: "color 0.2s"
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </motion.button>

        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 900, textTransform: "uppercase",
            letterSpacing: "0.05em", margin: "0 0 12px 0",
            background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Find Something To Watch
          </h1>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Tell us what you're feeling. We'll find the rest.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -20, filter: "blur(5px)" }} 
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, x: 20, filter: "blur(5px)" }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: "32px" }}
              >
                {/* Neon Progress Indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#a855f7", letterSpacing: "0.15em" }}>
                    0{step + 1} / 0{QUESTIONS.length}
                  </span>
                  <div style={{ flex: 1, maxWidth: "140px", height: "4px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" }}>
                    <motion.div 
                      initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} 
                      animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} 
                      style={{ height: "100%", background: "linear-gradient(to right, #9333ea, #c084fc)", boxShadow: "0 0 10px #a855f7" }} 
                      transition={{ duration: 0.5, ease: "easeInOut" }} 
                    />
                  </div>
                </div>

                <h2 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", margin: 0 }}>
                  {QUESTIONS[step].title}
                </h2>

                {/* Cinematic Glass Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {QUESTIONS[step].options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.4)", boxShadow: "0 0 20px rgba(168,85,247,0.2)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        padding: "20px 24px", borderRadius: "20px",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.3)",
                        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                        color: "#ffffff", cursor: "pointer", textAlign: "left",
                        transition: "background-color 0.3s, border-color 0.3s, box-shadow 0.3s"
                      }}
                    >
                      <span style={{ fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{opt.emoji}</span>
                      <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.02em" }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#4ade80", marginBottom: "24px" }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferences Locked</span>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "40px" }}>
                  {answers.map((a, i) => (
                    <span key={i} style={{ padding: "10px 18px", borderRadius: "30px", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)", fontSize: "13px", fontWeight: 700, color: "#f3e8ff", boxShadow: "0 0 15px rgba(168,85,247,0.1)" }}>
                      {a.label}
                    </span>
                  ))}
                </div>

                <motion.button 
                  onClick={resetQuestions} 
                  whileHover={{ color: "#fff", x: 4 }} 
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                    fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s",
                    display: "flex", alignItems: "center", gap: "8px", padding: 0
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Change Answers
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — ISOLATED SCROLLING GRID (60%)
          ========================================= */}
      <div style={{ flex: 1, paddingLeft: "60px", paddingRight: "32px", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        
        <div style={{ position: "absolute", top: 0, left: 0, width: "150px", height: "100%", background: "linear-gradient(to right, rgba(168, 85, 247, 0.05) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 10, paddingBottom: "100px" }}>
          <AnimatePresence mode="wait">
            
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, y: 15, filter: "blur(10px)" }} 
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, y: -15, filter: "blur(10px)" }} 
                transition={{ duration: 0.5 }}
                style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "24px", paddingBottom: "10%" }}
              >
                <motion.span 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  style={{ fontSize: "72px", filter: "drop-shadow(0 0 40px rgba(168,85,247,0.4))" }}
                >
                  {RIGHT_PANEL_REACTIONS[step].emoji}
                </motion.span>
                <h3 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 900, color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>{RIGHT_PANEL_REACTIONS[step].title}</h3>
                <p style={{ margin: 0, fontSize: "18px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{RIGHT_PANEL_REACTIONS[step].sub}</p>
              </motion.div>
            ) : 

            isFetching && recommendations.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "32px", paddingBottom: "10%" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "70px", height: "70px", border: "4px solid rgba(255,255,255,0.05)", borderTopColor: "#a855f7", borderRadius: "50%", boxShadow: "0 0 30px rgba(168,85,247,0.3)" }} />
                <p style={{ margin: 0, fontSize: "14px", color: "#c084fc", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>Synthesizing Grid...</p>
              </motion.div>
            ) : 

            recommendations.length > 0 ? (
              <motion.div 
                key="grid-results"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ width: "100%", paddingTop: "40px" }}
              >
                <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "36px", fontWeight: 900, letterSpacing: "-0.02em" }}>Top Neural Matches</h2>
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "rgba(168, 85, 247, 0.9)", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Curated exclusively for this moment.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "32px" }}>
                  {recommendations.map((media, idx) => (
                    <motion.div 
                      key={`${media.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (idx % 20) * 0.05, duration: 0.5, type: "spring", bounce: 0.3 }}
                      onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || "movie" })}
                      whileHover={{ scale: 1.05 }}
                      style={{ cursor: "pointer" }}
                    >
                      <PremiumMediaCard media={media as any} />
                    </motion.div>
                  ))}
                </div>

                {hasMore && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "60px", paddingBottom: "60px" }}>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }} whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        const next = fetchPage + 1;
                        setFetchPage(next);
                        fetchRecommendation(answers, next);
                      }} 
                      disabled={isFetching} 
                      style={{ padding: "18px 48px", borderRadius: "40px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#fff", fontSize: "13px", fontWeight: 900, cursor: "pointer", backdropFilter: "blur(16px)", boxShadow: "0 10px 30px rgba(168, 85, 247, 0.2)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.1em" }}
                    >
                      {isFetching ? "Expanding Core..." : "Load More Matches"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: "10%" }}>
                <span style={{ fontSize: "64px", marginBottom: "24px", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.2))" }}>🛸</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "16px", fontWeight: 600, lineHeight: 1.6 }}>We drifted too far into the void.<br/>No exact matches found for those criteria.</p>
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetQuestions} style={{ marginTop: "32px", padding: "16px 36px", borderRadius: "40px", backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: 900, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", backdropFilter: "blur(12px)" }}>
                  Let's Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(to top, rgba(5,0,10,1) 0%, transparent 100%)", pointerEvents: "none", zIndex: 20 }} />

      </div>
    </div>
  );
}