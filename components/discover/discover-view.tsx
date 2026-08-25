"use client";

import React, { useState, useEffect } from "react";
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
      { label: "Mind Blowing", emoji: "🤯", params: "&with_genres=878,9648" },
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
      { label: "Around 2 hours", emoji: "🍿", params: "&with_runtime.lte=135&with_runtime.gte=90" },
      { label: "2+ hours", emoji: "🛋️", params: "&with_runtime.gte=135" },
      { label: "I don't care", emoji: "🤷", params: "" }
    ]
  },
  {
    id: "type",
    title: "What are you looking for?",
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
      { label: "Something familiar", emoji: "🏠", params: "&sort_by=popularity.desc&vote_count.gte=5000" },
      { label: "Critically acclaimed", emoji: "🏆", params: "&sort_by=vote_average.desc&vote_count.gte=2000" },
      { label: "Hidden gem", emoji: "💎", params: "&sort_by=vote_average.desc&vote_count.gte=100&vote_count.lte=1500" },
      { label: "Surprise me", emoji: "✨", params: "&sort_by=popularity.desc" }
    ]
  }
];

const RIGHT_PANEL_STATES = [
  { emoji: "🎬", title: "Tell me what you're feeling.", sub: "Your next watch will appear here." },
  { emoji: "🤔", title: "Interesting choice...", sub: "Let's narrow it down." },
  { emoji: "🎯", title: "Your taste is becoming clearer...", sub: "Just a bit more." },
  { emoji: "✨", title: "Almost there...", sub: "Calibrating the DoBinge Neural Core." }
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
        setStep(step + 1); // Move to loading/result state
        fetchRecommendation(newAnswers, 1);
      }
    }, 300);
  };

  const fetchRecommendation = async (currentAnswers: any[], pageNum: number) => {
    setIsFetching(true);
    try {
      const typeOption = currentAnswers[2];
      let mediaType = typeOption.type;
      
      // If "Anything" is selected, randomly choose movie or tv to keep queries simple
      if (mediaType === "multi") {
        mediaType = Math.random() > 0.5 ? "movie" : "tv";
      }

      // Combine all TMDB params
      const combinedParams = currentAnswers.map(a => a.params).join("");
      
      const res = await fetch(`${proxyUrl}/api/discover/${mediaType}?language=en-US&page=${pageNum}${combinedParams}`);
      if (!res.ok) throw new Error("Recommendation fetch failed");
      
      const data = await res.json();
      const results = (data.results || []).map((item: any) => ({ ...item, mediaType }));

      // Filter out items without posters
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
      // Fetch next page of results
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

  // Generate dynamic explanation based on answers
  const whyThisText = answers.length === 4 
    ? `Because you wanted something ${answers[0].label.toLowerCase()}, ${answers[1].label.toLowerCase()}, and ${answers[3].label.toLowerCase()}.`
    : "Curated by the DoBinge Neural Core.";

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen relative z-10 text-white font-sans">
      
      {/* ── 🌌 AMBIENT LEFT LIGHTING ── */}
      <div style={{ position: "absolute", top: "20%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: -1 }} />

      {/* =========================================
          LEFT SECTION — QUICK QUESTIONS
          ========================================= */}
      <div className="w-full lg:w-[40%] flex flex-col pt-12 lg:pt-32 px-6 lg:px-16 z-20 pb-12 lg:pb-0">
        
        {step < QUESTIONS.length && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 8px 0" }}>Find Something To Watch</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 500, margin: 0 }}>Answer a few quick questions. We'll find your next binge.</p>
          </motion.div>
        )}

        <div style={{ position: "relative", flex: 1 }}>
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#a855f7", letterSpacing: "0.1em" }}>0{step + 1} / 0{QUESTIONS.length}</span>
                  <div style={{ flex: 1, height: "2px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <motion.div initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} style={{ height: "100%", backgroundColor: "#a855f7" }} transition={{ duration: 0.5 }} />
                  </div>
                </div>

                <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                  {QUESTIONS[step].title}
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                  {QUESTIONS[step].options.map((opt, idx) => {
                    const isSelected = answers[step]?.label === opt.label;
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleSelectOption(opt)}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(168, 85, 247, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px", padding: "16px", borderRadius: "16px",
                          backgroundColor: isSelected ? "rgba(168, 85, 247, 0.15)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? "rgba(168, 85, 247, 0.5)" : "rgba(255,255,255,0.05)"}`,
                          cursor: "pointer", textAlign: "left", backdropFilter: "blur(12px)", transition: "all 0.2s ease"
                        }}
                      >
                        <span style={{ fontSize: "24px" }}>{opt.emoji}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#fff" : "rgba(255,255,255,0.8)" }}>{opt.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="completion-left"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "20px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#4ade80" }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Preferences Locked</span>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {answers.map((a, i) => (
                    <span key={i} style={{ padding: "6px 12px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                      {a.emoji} {a.label}
                    </span>
                  ))}
                </div>

                <motion.button 
                  onClick={resetQuestions}
                  whileHover={{ color: "#fff" }}
                  style={{ alignSelf: "flex-start", marginTop: "16px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Change Answers
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================
          RIGHT SECTION — LIVE RECOMMENDATION
          ========================================= */}
      <div className="w-full lg:w-[60%] flex flex-col items-center justify-center p-6 lg:p-12 min-h-[60vh] lg:min-h-screen relative z-10 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#08070D]/30">
        
        {/* Soft gradient blending left to right on desktop */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#000000] to-transparent z-10 pointer-events-none" />

        {/* Dynamic Backdrop Mask when recommendation is loaded */}
        <AnimatePresence>
          {step >= QUESTIONS.length && currentRec?.backdrop_path && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
              style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
            >
              <img src={getBackdropUrl(currentRec.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)", maskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #08070D 0%, transparent 100%)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 20 }}>
          <AnimatePresence mode="wait">
            
            {/* PROGRESSIVE TEXT STATES */}
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.5 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}
              >
                <span style={{ fontSize: "56px", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}>{RIGHT_PANEL_STATES[step].emoji}</span>
                <h3 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em" }}>{RIGHT_PANEL_STATES[step].title}</h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{RIGHT_PANEL_STATES[step].sub}</p>
              </motion.div>
            ) : 

            /* LOADING STATE */
            isFetching && recommendations.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "24px" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: "48px", height: "48px", border: "3px solid transparent", borderTopColor: "#a855f7", borderRightColor: "#a855f7", borderRadius: "50%" }} />
                <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Scanning the DoBinge Neural Core</p>
              </motion.div>
            ) : 
            
            /* RESULT STATE (THE RECOMMENDATION) */
            currentRec ? (
              <motion.div 
                key={`rec-${currentRec.id}`}
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                
                {/* Mobile Poster (Hidden on Desktop) */}
                <div className="flex lg:hidden w-full aspect-[2/3] max-w-[240px] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4">
                  {currentRec.poster_path ? <img src={getPosterUrl(currentRec.poster_path)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/30 font-bold">No Poster</div>}
                </div>

                <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                  
                  {/* Desktop Poster */}
                  <div className="hidden lg:block w-[180px] shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] bg-[#160B24]">
                    {currentRec.poster_path ? <img src={getPosterUrl(currentRec.poster_path)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white/30 font-bold">No Poster</div>}
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 style={{ margin: "0 0 12px 0", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
                      {currentRec.title || currentRec.name}
                    </h2>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>
                      <span style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "6px", color: "#fff" }}>{currentRec.release_date?.split("-")[0] || currentRec.first_air_date?.split("-")[0] || "TBA"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> {currentRec.vote_average?.toFixed(1) || "NR"}</span>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{currentRec.media_type === "tv" ? "TV Series" : "Movie"}</span>
                    </div>

                    <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {currentRec.overview || "No description available."}
                    </p>

                    {/* AI Match Explanation */}
                    <div style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(192, 132, 252, 0.2)", padding: "12px 16px", borderRadius: "12px", backdropFilter: "blur(10px)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", marginTop: "6px", boxShadow: "0 0 10px #a855f7", flexShrink: 0 }} />
                      <div>
                        <span style={{ display: "block", fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Why This?</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>{whyThisText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
                  <motion.button 
                    onClick={() => onSelectMedia?.(currentRec)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ flex: "1 1 auto", padding: "14px 24px", borderRadius: "30px", backgroundColor: "#ffffff", color: "#000000", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
                  >
                    More Info
                  </motion.button>
                  <motion.button 
                    onClick={() => alert("Watch routing currently unavailable.")}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }}
                    style={{ flex: "1 1 auto", padding: "14px 24px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Watch
                  </motion.button>
                  <motion.button 
                    onClick={handleNotForMe}
                    whileHover={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.95 }}
                    style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: "30px", background: "none", color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid transparent", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Let's try another
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600 }}>We couldn't find an exact match for those criteria.<br/>Let's try modifying your answers.</p>
                <button onClick={resetQuestions} style={{ marginTop: "16px", padding: "10px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Start Over</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}