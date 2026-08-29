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
    }, 400); // Slightly longer for the premium tap animation to finish
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
    <div className="flex w-full h-full min-h-0">
      
      {/* =========================================
          LEFT PANEL — QUICK QUESTIONS (40%)
          ========================================= */}
      <div className="flex-none w-[40%] pr-8 border-r border-white/5 h-full flex flex-col justify-center relative">
        
        <motion.button
          onClick={() => router.push('/home')}
          whileHover={{ x: -4, color: "#ffffff" }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-0 left-0 flex items-center gap-2 bg-transparent border-none text-white/50 text-[11px] font-extrabold uppercase tracking-widest cursor-pointer transition-colors hover:text-white"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </motion.button>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 m-0 mb-2">
            Find Something To Watch
          </h1>
          <p className="text-sm font-semibold text-white/50 m-0">
            Tell us what you're feeling. We'll find the rest.
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: -20, filter: "blur(5px)" }} 
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, x: 20, filter: "blur(5px)" }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* Glowing Progress Bar */}
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-purple-400 tracking-widest">
                    0{step + 1} / 0{QUESTIONS.length}
                  </span>
                  <div className="flex-1 max-w-[140px] h-1 bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <motion.div 
                      initial={{ width: `${(step / QUESTIONS.length) * 100}%` }} 
                      animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} 
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_#a855f7]"
                      transition={{ duration: 0.5, ease: "easeInOut" }} 
                    />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white m-0">
                  {QUESTIONS[step].title}
                </h2>

                {/* Option Grid - Changed to 2 columns for a premium card feel */}
                <div className="grid grid-cols-2 gap-3">
                  {QUESTIONS[step].options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-white cursor-pointer backdrop-blur-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] text-left"
                    >
                      <span className="text-2xl drop-shadow-md">{opt.emoji}</span>
                      <span className="text-sm font-bold tracking-wide">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 text-emerald-400 mb-5">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm font-black uppercase tracking-widest">Preferences Locked</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {answers.map((a, i) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                      {a.label}
                    </span>
                  ))}
                </div>

                <motion.button 
                  onClick={resetQuestions} 
                  whileHover={{ color: "#fff", x: 4 }} 
                  className="flex items-center gap-2 bg-transparent border-none text-white/40 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors p-0"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
      <div className="flex-1 pl-8 flex flex-col relative h-full min-h-0">
        
        {/* Soft Ambient Blend against the left border */}
        <div className="absolute top-0 left-0 w-[150px] h-full bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none z-0" />

        <div className="no-scrollbar flex-1 overflow-y-auto relative z-10 pb-[100px] min-h-0">
          <AnimatePresence mode="wait">
            
            {step < QUESTIONS.length ? (
              <motion.div
                key={`state-${step}`}
                initial={{ opacity: 0, y: 15, filter: "blur(10px)" }} 
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, y: -15, filter: "blur(10px)" }} 
                transition={{ duration: 0.5 }}
                className="h-full flex flex-col justify-center items-center text-center gap-4 pb-[10%]"
              >
                <motion.span 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-6xl drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                >
                  {RIGHT_PANEL_REACTIONS[step].emoji}
                </motion.span>
                <h3 className="m-0 text-3xl font-black text-white tracking-widest uppercase mt-4">
                  {RIGHT_PANEL_REACTIONS[step].title}
                </h3>
                <p className="m-0 text-base text-white/40 font-semibold">
                  {RIGHT_PANEL_REACTIONS[step].sub}
                </p>
              </motion.div>
            ) : 

            isFetching && recommendations.length === 0 ? (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="h-full flex flex-col justify-center items-center text-center gap-6 pb-[10%]"
              >
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                  className="w-14 h-14 border-4 border-white/5 border-t-purple-500 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.3)]" 
                />
                <p className="m-0 text-xs text-purple-400 font-black uppercase tracking-[0.2em] animate-pulse">
                  Synthesizing Grid...
                </p>
              </motion.div>
            ) : 

            recommendations.length > 0 ? (
              <motion.div 
                key="grid-results"
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full pt-4"
              >
                <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="m-0 text-3xl font-black tracking-tight text-white">Top Neural Matches</h2>
                    <p className="m-0 mt-1 text-xs text-purple-400 font-bold tracking-widest uppercase">
                      Curated exclusively for this moment.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
                  {recommendations.map((media, idx) => (
                    <motion.div 
                      key={`${media.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (idx % 20) * 0.05, duration: 0.5, type: "spring", bounce: 0.3 }}
                      onClick={() => onSelectMedia?.({ ...media, mediaType: media.media_type || "movie" })}
                      className="cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <PremiumMediaCard media={media as any} />
                    </motion.div>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-12 pb-12">
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        const next = fetchPage + 1;
                        setFetchPage(next);
                        fetchRecommendation(answers, next);
                      }} 
                      disabled={isFetching} 
                      className="px-10 py-4 rounded-full border border-purple-400/40 bg-purple-600/15 text-white text-xs font-black tracking-widest uppercase cursor-pointer backdrop-blur-xl shadow-[0_10px_30px_rgba(168,85,247,0.15)] transition-all disabled:opacity-50"
                    >
                      {isFetching ? "Expanding Core..." : "Load More Matches"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col justify-center items-center text-center pb-[10%]">
                <span className="text-5xl mb-6 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🛸</span>
                <p className="m-0 text-white/50 text-sm font-bold leading-relaxed">
                  We drifted too far into the void.<br/>No exact matches found for those criteria.
                </p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetQuestions} 
                  className="mt-8 px-8 py-3 rounded-full bg-white/5 text-white border border-white/10 text-xs font-black cursor-pointer uppercase tracking-widest backdrop-blur-md hover:bg-white/10 transition-colors"
                >
                  Let's Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cinematic Fog Fade for smooth scrolling cutoff */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#05000a] to-transparent pointer-events-none z-20" />

      </div>
    </div>
  );
}