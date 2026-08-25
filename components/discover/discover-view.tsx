"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      { label: "Feel Good", emoji: "😊", params: "&with_genres=35,10751" },
      { label: "Mind Blowing", emoji: "🧠", params: "&with_genres=878,9648" },
      { label: "Dark & Scary", emoji: "😱", params: "&with_genres=27,53" },
      { label: "Romantic", emoji: "❤️", params: "&with_genres=10749" },
      { label: "Emotional", emoji: "🥹", params: "&with_genres=18" },
      { label: "Intense", emoji: "🔥", params: "&with_genres=28,80" },
      { label: "Relaxing", emoji: "🌙", params: "&with_genres=99" },
      { label: "Surprise Me", emoji: "✨", params: "" }
    ]
  },
  {
    id: "time",
    title: "How much time do you have?",
    options: [
      { label: "Under 90 mins", emoji: "⏱️", params: "&with_runtime.lte=90" },
      { label: "About 2 hours", emoji: "🍿", params: "&with_runtime.lte=135&with_runtime.gte=90" },
      { label: "2+ hours", emoji: "🛋️", params: "&with_runtime.gte=135" },
      { label: "I don't care", emoji: "🤷", params: "" }
    ]
  },
  {
    id: "type",
    title: "What do you want to watch?",
    options: [
      { label: "Movie", emoji: "🎬", type: "movie", params: "" },
      { label: "TV Show", emoji: "📺", type: "tv", params: "" },
      { label: "Anime", emoji: "⛩️", type: "tv", params: "&with_genres=16&with_original_language=ja" },
      { label: "Anything", emoji: "🎲", type: "multi", params: "" }
    ]
  },
  {
    id: "vibe",
    title: "How adventurous are you feeling?",
    options: [
      { label: "Familiar", emoji: "🏠", params: "&sort_by=popularity.desc&vote_count.gte=5000" },
      { label: "Something New", emoji: "🚀", params: "&sort_by=popularity.asc&vote_count.gte=100" },
      { label: "Hidden Gem", emoji: "💎", params: "&sort_by=vote_average.desc&vote_count.gte=100&vote_count.lte=1500" },
      { label: "Surprise Me", emoji: "✨", params: "&sort_by=popularity.desc" }
    ]
  }
];

const RIGHT_PANEL_REACTIONS = [
  { emoji: "🎬", title: "YOUR NEXT WATCH WILL APPEAR HERE", sub: "Answer a few questions and I'll find something for you." },
  { emoji: "🧠", title: "NICE CHOICE.", sub: "Let's dial it in." },
  { emoji: "⏳", title: "WE'RE GETTING CLOSER.", sub: "Just a couple more details." },
  { emoji: "✨", title: "ALMOST THERE.", sub: "Cross-referencing the DoBinge Neural Core." }
];

export default function DiscoverView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<MovieItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchPage, setFetchPage] = useState(1);

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  const handleSelectOption = (option: any) => {
    const newAnswers = [...answers];
    newAnswers[step] = option;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(step + 1); // Triggers loading state
        fetchRecommendation(newAnswers, 1);
      }
    }, 300); // Slight delay for premium feel
  };

  const fetchRecommendation = async (currentAnswers: any[], pageNum: number) => {
    setIsFetching(true);
    try {
      const typeOption = currentAnswers[2];
      let mediaType = typeOption.type;
      
      if (mediaType === "multi") {
        mediaType = Math.random() > 0.5 ? "movie" : "tv";
      }

      const combinedParams = currentAnswers.map(a => a.params).join("");
      
      const res = await fetch(`${proxyUrl}/api/discover/${mediaType}?language=en-US&page=${pageNum}${combinedParams}`);
      if (!res.ok) throw new Error("Recommendation fetch failed");
      
      const data = await res.json();
      const results = (data.results || []).map((item: any) => ({ ...item, mediaType }));
      const validResults = results.filter((item: any) => item.poster_path);

      if (pageNum === 1) {
        setRecommendations(validResults);
        setCurrentIndex(0);
      } else {
        setRecommendations(prev => [...prev, ...validResults]);
      }
    } catch (err) {
      console.error("DoBinge Engine Fault:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleNotForMe = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const nextPage = fetchPage + 1;
      setFetchPage(nextPage);
      fetchRecommendation(answers, nextPage);
    }
  };

  const resetQuestions = () => {
    setStep(0);
    setAnswers([]);
    setRecommendations([]);
    setCurrentIndex(0);
    setFetchPage(1);
  };

  const currentRec = recommendations[currentIndex];
  const getPosterUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/w500${path}` : "";
  const getBackdropUrl = (path: string | null) => path && proxyUrl ? `${proxyUrl}/image/t/p/original${path}` : "";

  const whyThisText = answers.length === 4 
    ? `Because you wanted something ${answers[0].label.toLowerCase()}, ${answers[3].label.toLowerCase()}, and ${answers[1].label.toLowerCase()}.`
    : "Curated by the DoBinge Neural Core.";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: "100%", minHeight: "calc(100vh - 120px)", gap: "40px", alignItems: "stretch" }}>
      
      {/* =========================================
          LEFT PANEL — QUICK QUESTIONS (40%)
          ========================================= */}
      <div style={{ flex: "1 1 38%", minWidth: "300px", display: "flex", flexDirection: "column", paddingRight: "20px" }}>
        
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#ffffff", margin: "0 0 8px 0" }}>
            Find Something To Watch
          </h1>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Tell us what you're feeling. We'll find the rest.
          </p>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.3 }}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                {/* Subtle Progress Indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#a855f7", letterSpacing: "0.15em" }}>
                    0{step + 1} / 0{QUESTIONS.length}
                  </span>
                  <div style={{ flex: 1, maxWidth: "100px", height: "2px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                    <motion.div initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} style={{ height: "100%", backgroundColor: "#a855f7" }} transition={{ duration: 0.4 }} />
                  </div>
                </div>

                <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", margin: 0 }}>
                  {QUESTIONS[step].title}
                </h2>

                {/* Compact Glass Answer Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {QUESTIONS[step].options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", fontSize: "13px", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(12px)", transition: "background-color 0.2s, border-color 0.2s" }}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4ade80", marginBottom: "16px" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferences Locked</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {answers.map((a, i) => (
                    <span key={i} style={{ padding: "6px 12px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                      {a.label}
                    </span>
                  ))}
                </div>
                <motion.button onClick={resetQuestions} whileHover={{ color: "#fff" }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Change Answers
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================
          RIGHT PANEL — LIVE RECOMMENDATION (60%)
          ========================================= */}
      <div style={{ flex: "1 1 55%", position: "relative", minHeight: "500px", display: "flex", flexDirection: "column", justifyContent: "center", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(8,7,13,0.4)", backdropFilter: "blur(20px)", overflow: "hidden", padding: "40px" }}>
        
        {/* Dynamic Backdrop for Final Recommendation */}
        <AnimatePresence>
          {step >= QUESTIONS.length && currentRec?.backdrop_path && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
              <img src={getBackdropUrl(currentRec.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 80%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,7,13,1) 0%, transparent 100%)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            
            {/* CONVERSATIONAL STATES */}
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.4 }}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}
              >
                <span style={{ fontSize: "42px", filter: "drop-shadow(0 0 20px rgba(168,85,247,0.3))" }}>{RIGHT_PANEL_REACTIONS[step].emoji}</span>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>{RIGHT_PANEL_REACTIONS[step].title}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{RIGHT_PANEL_REACTIONS[step].sub}</p>
              </motion.div>
            ) : 

            /* LOADING SPINNER */
            isFetching && recommendations.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "40px", height: "40px", border: "3px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>Synthesizing Match...</p>
              </motion.div>
            ) : 

            /* THE FINAL RECOMMENDATION (ONE STRONG CARD) */
            currentRec ? (
              <motion.div 
                key={`rec-${currentRec.id}`}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "row", gap: "32px", width: "100%", alignItems: "center" }}
              >
                {/* Large DoBinge Poster Standard */}
                <div style={{ width: "240px", flexShrink: 0, aspectRatio: "2/3", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 60px rgba(0,0,0,0.8)", backgroundColor: "#160B24" }}>
                  {currentRec.poster_path ? (
                    <img src={getPosterUrl(currentRec.poster_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 800 }}>NO POSTER</div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <h2 style={{ margin: "0 0 12px 0", fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.1, textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
                    {currentRec.title || currentRec.name}
                  </h2>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
                    <span style={{ color: "#ffffff" }}>{currentRec.release_date?.split("-")[0] || currentRec.first_air_date?.split("-")[0] || "TBA"}</span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}>★ {currentRec.vote_average?.toFixed(1) || "NR"}</span>
                    <span>•</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{currentRec.media_type === "tv" ? "TV SHOW" : "MOVIE"}</span>
                  </div>

                  {/* AI Match Explanation */}
                  <div style={{ marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", marginTop: "6px", boxShadow: "0 0 10px #a855f7", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                      "{whyThisText}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <motion.button 
                      onClick={() => onSelectMedia?.(currentRec)}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.95 }}
                      style={{ padding: "12px 28px", borderRadius: "30px", backgroundColor: "#ffffff", color: "#000000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", border: "none", cursor: "pointer" }}
                    >
                      More Info
                    </motion.button>
                    
                    <motion.button 
                      onClick={() => alert("Watch routing currently unavailable.")}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }}
                      style={{ padding: "12px 28px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", backdropFilter: "blur(10px)" }}
                    >
                      Watch
                    </motion.button>
                    
                    <motion.button 
                      onClick={handleNotForMe}
                      whileHover={{ color: "#fff" }} whileTap={{ scale: 0.95 }}
                      style={{ marginLeft: "auto", padding: "12px 0", background: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                    >
                      Not for me {'>'}
                    </motion.button>
                  </div>

                </div>
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "32px", marginBottom: "12px" }}>🛸</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600 }}>We drifted too far into the void.<br/>No exact match found.</p>
                <button onClick={resetQuestions} style={{ marginTop: "20px", padding: "10px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: "11px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>Let's Try Again</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}