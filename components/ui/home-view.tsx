"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

interface MovieItem {
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
  overview?: string;
  media_type?: string;
}

interface HomeViewProps {
  onSelectMedia?: (media: any) => void;
  setView?: (view: any) => void;
}

const MOODS = [
  { id: "All", emoji: "✨", query: "", subtitle: "The Complete DoBinge Multiverse" },
  { id: "Happy", emoji: "😊", query: "&with_genres=35", subtitle: "Feel-Good • Comedy" },
  { id: "Sad", emoji: "😭", query: "&with_genres=18", subtitle: "Emotional • Heartfelt" },
  { id: "Angry", emoji: "😡", query: "&with_genres=28,53", subtitle: "Intense • Action Thriller" },
  { id: "Stressed", emoji: "😰", query: "&with_genres=35,10751", subtitle: "Lighthearted • Comfort" },
  { id: "Tired", emoji: "😴", query: "&with_genres=99,10751", subtitle: "Relaxing • Easy Watch" },
  { id: "Romantic", emoji: "😍", query: "&with_genres=10749", subtitle: "Love • Heartwarming" },
  { id: "Excited", emoji: "🤩", query: "&with_genres=28,12", subtitle: "High Energy • Adventure" },
  { id: "Scared", emoji: "👻", query: "&with_genres=27", subtitle: "Horror • Thriller" },
  { id: "Relaxed", emoji: "😌", query: "&with_genres=36,99", subtitle: "Thoughtful • Paced" },
  { id: "Hopeful", emoji: "😁", query: "&with_genres=10402", subtitle: "Feel Good • Inspiring" },
  { id: "Nostalgic", emoji: "🥹", query: "&primary_release_date.lte=2005-01-01", subtitle: "Classic • Throwback" },
  { id: "Curious", emoji: "🧠", query: "&with_genres=96,878", subtitle: "Mind-Bending Sci-Fi" },
  { id: "Family Night", emoji: "🍿", query: "&with_genres=10751", subtitle: "Wholesome • Fun" },
  { id: "Date Night", emoji: "💑", query: "&with_genres=10749,35", subtitle: "Cozy Romance • Comedy" },
  { id: "Rainy Evening", emoji: "🌧", query: "&with_genres=18,96", subtitle: "Atmospheric • Mystery" },
  { id: "Traveling", emoji: "✈", query: "&with_genres=12,35", subtitle: "Road Trip • Adventure" },
  { id: "Study Break", emoji: "📚", query: "&with_genres=16,35&with_runtime.lte=90", subtitle: "Short • Engaging" },
  { id: "Lazy Sunday", emoji: "🛋", query: "&with_genres=35,10751", subtitle: "Bingeable • Comfort" },
  { id: "Midnight Watch", emoji: "🌙", query: "&with_genres=53,27,96", subtitle: "Dark • Psychological" },
  { id: "Pizza Night", emoji: "🍕", query: "&with_genres=28,35", subtitle: "Action Comedy • Fun" },
  { id: "Under 90 Min", emoji: "⏱", query: "&with_runtime.lte=90", subtitle: "Quick Watch" },
  { id: "Weekend Binge", emoji: "📺", query: "&with_runtime.gte=150", subtitle: "Epic • Extended Cut" },
  { id: "Slow Burn", emoji: "🧘", query: "&with_genres=18,96", subtitle: "Methodical • Deep" },
  { id: "Explosive", emoji: "💥", query: "&with_genres=28,53", subtitle: "Adrenaline • Spectacle" },
  { id: "Puzzle", emoji: "🧩", query: "&with_genres=96,80", subtitle: "Mystery • Crime" },
  { id: "Found Footage", emoji: "📹", query: "&with_genres=27,53", subtitle: "Raw • Terrifying" },
  { id: "Slashers", emoji: "🔪", query: "&with_genres=27", subtitle: "Classic Horror" },
  { id: "Zombies", emoji: "🧟", query: "&with_genres=27,878", subtitle: "Post-Apocalyptic" },
  { id: "Slice of Life", emoji: "🍜", query: "&with_genres=16,35&with_original_language=ja", subtitle: "Cozy Anime" },
  { id: "Shonen", emoji: "⚔", query: "&with_genres=16,28&with_original_language=ja", subtitle: "Action Anime" },
  { id: "Underrated", emoji: "💎", query: "&vote_average.gte=7&vote_count.lte=1000", subtitle: "Hidden Gems" },
  { id: "Masterpieces", emoji: "🏆", query: "&vote_average.gte=8.5&vote_count.gte=5000", subtitle: "Critically Acclaimed" }
];

const PLATFORMS = [
  { name: "Netflix", id: 8, color: "#E50914" },
  { name: "Prime Video", id: 119, color: "#00A8E1" },
  { name: "Disney+", id: 337, color: "#113CCF" },
  { name: "Apple TV+", id: 350, color: "#FFFFFF" },
  { name: "Max", id: 1883, color: "#002BE7" },
  { name: "Hulu", id: 15, color: "#1CE783" },
  { name: "Crunchyroll", id: 283, color: "#F47521" },
  { name: "Paramount+", id: 531, color: "#0064FF" },
  { name: "Peacock", id: 384, color: "#000000" },
  { name: "Sony LIV", id: 237, color: "#FF9900" },
  { name: "JioCinema", id: 220, color: "#E31837" },
  { name: "ZEE5", id: 232, color: "#8230C6" },
  { name: "MUBI", id: 11, color: "#000000" }
];

export default function HomeView({ onSelectMedia, setView }: HomeViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "shows" | "anime">("all");

  const [trendingGlobal, setTrendingGlobal] = useState<MovieItem[]>([]);
  const [curatedList, setCuratedList] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [heroIndex, setHeroIndex] = useState(0);
  const curatedScrollRef = useRef<HTMLDivElement>(null);
  const providerScrollRef = useRef<HTMLDivElement>(null);

  const hollywoodScrollRef = useRef<HTMLDivElement>(null);
  const bollywoodScrollRef = useRef<HTMLDivElement>(null);
  const tollywoodScrollRef = useRef<HTMLDivElement>(null);

  const providerTrendingRef = useRef<HTMLDivElement>(null);
  const providerTopRatedRef = useRef<HTMLDivElement>(null);
  const providerRecentRef = useRef<HTMLDivElement>(null);

  const [hollywoodFeed, setHollywoodFeed] = useState<MovieItem[]>([]);
  const [bollywoodFeed, setBollywoodFeed] = useState<MovieItem[]>([]);
  const [tollywoodFeed, setTollywoodFeed] = useState<MovieItem[]>([]);

  // ── MOOD ENGINE STATES ──
  const [sortedMoods, setSortedMoods] = useState(MOODS);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [moodGridRecs, setMoodGridRecs] = useState<MovieItem[]>([]);
  const [moodPage, setMoodPage] = useState(1);
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [providerFeed, setProviderFeed] = useState<{ trending: MovieItem[], topRated: MovieItem[], recent: MovieItem[] } | null>(null);
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const [wildcardMovie, setWildcardMovie] = useState<MovieItem | null>(null);
  const [wildcardReason, setWildcardReason] = useState("");
  const [wildcardMoviePool, setWildcardMoviePool] = useState<MovieItem[]>([]);
  const [isWildcardTransitioning, setIsWildcardTransitioning] = useState(false);
  
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";

  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('dobinge_mood_scores') || '{}');
    const sorted = [...MOODS].sort((a, b) => {
      if (a.id === "All") return -1;
      if (b.id === "All") return 1;
      return (scores[b.id] || 0) - (scores[a.id] || 0);
    });
    setSortedMoods(sorted);
    setSelectedMood(sorted[0]);
  }, []);

  const generateAiReason = (movie: MovieItem) => {
    const reasons = [
      `Because you loved titles with a similar cinematic tone and atmosphere.`,
      `Matches your preference for highly-rated Feature Films.`,
      `A wildcard movie pick designed to break your usual algorithm loop.`,
      `Perfect movie for tonight. Highly acclaimed and unexpectedly gripping.`,
      `Based on the deep neural patterns of your film watch history.`,
      `You haven't watched a cinematic masterpiece like this recently.`,
      `Selected from the global top 1% of international cinema to match your taste.`,
      `Matches your recent Mood selections in the DoBinge Neural Core.`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  useEffect(() => {
    if (!proxyUrl) return;

    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [globalRes, animeRes, intlRes, hollywoodRes, bollywoodRes, southIndianRes, tvRes] = await Promise.all([
          fetch(`${proxyUrl}/api/trending/all/week`),
          fetch(`${proxyUrl}/api/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=100`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=hi|ko|es|fr|it|de|tr|zh&sort_by=popularity.desc&vote_count.gte=100`),
          fetch(`${proxyUrl}/api/trending/movie/week?language=en-US`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=hi&sort_by=popularity.desc&vote_count.gte=50&with_origin_country=IN`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=te|ta|ml|kn&sort_by=popularity.desc&vote_count.gte=50&with_origin_country=IN`),
          fetch(`${proxyUrl}/api/trending/tv/week?language=en-US`)
        ]);

        const globalData = await globalRes.json();
        const animeData = await animeRes.json();
        const intlData = await intlRes.json();
        const hwData = await hollywoodRes.json();
        const bwData = await bollywoodRes.json();
        const tlData = await southIndianRes.json();
        const tvData = await tvRes.json();

        const gList: MovieItem[] = (globalData.results || []).filter((item: any) => item.media_type !== "person");        
        const aList: MovieItem[] = (animeData.results || []).map((item: any) => ({ ...item, media_type: "tv" }));
        const iList: MovieItem[] = (intlData.results || []).map((item: any) => ({ ...item, media_type: "movie" }));
        const tList: MovieItem[] = (tvData.results || []).map((item: any) => ({ ...item, media_type: "tv" }));

        const hwMovies: MovieItem[] = (hwData.results || []).map((item: any) => ({ ...item, media_type: "movie" }));
        const bwMovies: MovieItem[] = (bwData.results || []).map((item: any) => ({ ...item, media_type: "movie" }));
        const tlMovies: MovieItem[] = (tlData.results || []).map((item: any) => ({ ...item, media_type: "movie" }));

        const blendedTrending: MovieItem[] = [];
        const blendedCurated: MovieItem[] = [];
        
        const maxLen = Math.max(gList.length, aList.length, iList.length, tList.length);

        for (let i = 0; i < maxLen; i++) {
          if (gList[i]) blendedTrending.push(gList[i]);
          if (tList[i]) blendedTrending.push(tList[i]);
          if (iList[i]) blendedTrending.push(iList[i]);
          if (aList[i]) blendedTrending.push(aList[i]);
        }

        for (let i = 4; i < maxLen + 4; i++) {
          if (aList[i % aList.length]) blendedCurated.push(aList[i % aList.length]);
          if (iList[i % iList.length]) blendedCurated.push(iList[i % iList.length]);
          if (gList[i % gList.length]) blendedCurated.push(gList[i % gList.length]);
        }

        setTrendingGlobal(blendedTrending);
        setCuratedList(blendedCurated);
        setHollywoodFeed(hwMovies);
        setBollywoodFeed(bwMovies);
        setTollywoodFeed(tlMovies);

        const rawMoviePool = [
          ...gList.filter(item => item.media_type === "movie" || !item.media_type),
          ...iList,
          ...hwMovies,
          ...bwMovies,
          ...tlMovies
        ];

        const uniqueMovieMap = new Map<number, MovieItem>();
        rawMoviePool.forEach(item => {
          if (item && item.id && item.backdrop_path) {
            uniqueMovieMap.set(item.id, { ...item, media_type: "movie" });
          }
        });

        const pureMoviePool = Array.from(uniqueMovieMap.values());
        setWildcardMoviePool(pureMoviePool);

        if (pureMoviePool.length > 0) {
          const initialWildcard = pureMoviePool[Math.floor(Math.random() * pureMoviePool.length)];
          setWildcardMovie(initialWildcard);
          setWildcardReason(generateAiReason(initialWildcard));
        }

      } catch (err) {
        console.error("DoBinge Unified Aggregator Failure:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [proxyUrl]);

  useEffect(() => {
    if (selectedMood.id === "All" || !proxyUrl) return;
    if (!isAiThinking && moodPage === 1 && moodGridRecs.length > 0) return;

    const fetchMoodGridData = async () => {
      setIsMoodLoading(true);
      try {
        const [movieRes, tvRes] = await Promise.all([
          fetch(`${proxyUrl}/api/discover/movie?sort_by=popularity.desc&page=${moodPage}${selectedMood.query}`),
          fetch(`${proxyUrl}/api/discover/tv?sort_by=popularity.desc&page=${moodPage}${selectedMood.query}`)
        ]);
        
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();

        const mList = (movieData.results || []).map((i: any) => ({ ...i, media_type: "movie" }));
        const tList = (tvData.results || []).map((i: any) => ({ ...i, media_type: "tv" }));

        const mixedRecs: MovieItem[] = [];
        const maxL = Math.max(mList.length, tList.length);
        for (let i = 0; i < maxL; i++) {
          if (mList[i]) mixedRecs.push(mList[i]);
          if (tList[i]) mixedRecs.push(tList[i]);
        }
        
        if (moodPage === 1) {
          setMoodGridRecs(mixedRecs);
        } else {
          setMoodGridRecs(prev => [...prev, ...mixedRecs]);
        }
      } catch (err) {
        console.error("Mood Grid Engine Fault:", err);
      } finally {
        setIsMoodLoading(false);
        setIsAiThinking(false);
      }
    };

    fetchMoodGridData();
  }, [selectedMood, moodPage, isAiThinking, proxyUrl]);

  useEffect(() => {
    if (trendingGlobal.length === 0 || activeTab !== "all" || activeProvider) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trendingGlobal.length, 9));
    }, 7000);
    return () => clearInterval(interval);
  }, [trendingGlobal, activeTab, activeProvider]);

  useEffect(() => {
    if (!activeProvider || !proxyUrl) return;
    const fetchProviderData = async () => {
      setIsProviderLoading(true);
      try {
        const [trendRes, topRes, recentRes] = await Promise.all([
          fetch(`${proxyUrl}/api/discover/movie?with_watch_providers=${activeProvider.id}&watch_region=US&sort_by=popularity.desc`),
          fetch(`${proxyUrl}/api/discover/movie?with_watch_providers=${activeProvider.id}&watch_region=US&sort_by=vote_average.desc&vote_count.gte=200`),
          fetch(`${proxyUrl}/api/discover/movie?with_watch_providers=${activeProvider.id}&watch_region=US&sort_by=primary_release_date.desc&primary_release_date.lte=2026-07-28`)
        ]);

        const tData = await trendRes.json();
        const trData = await topRes.json();
        const rData = await recentRes.json();

        setProviderFeed({
          trending: tData.results || [],
          topRated: trData.results || [],
          recent: rData.results || []
        });
      } catch (err) {
        console.error("Provider Hub Fetch Fault:", err);
      } finally {
        setIsProviderLoading(false);
      }
    };
    fetchProviderData();
  }, [activeProvider, proxyUrl]);

  const handleMoodSelect = (mood: any) => {
    if (mood.id === selectedMood.id) return;
    const scores = JSON.parse(localStorage.getItem('dobinge_mood_scores') || '{}');
    scores[mood.id] = (scores[mood.id] || 0) + 1;
    localStorage.setItem('dobinge_mood_scores', JSON.stringify(scores));

    setIsAiThinking(true);
    setSelectedMood(mood);
    setMoodPage(1);
    setActiveProvider(null);
  };

  const handleNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex((prev) => (prev + 1) % Math.min(trendingGlobal.length, 9));
  };

  const handlePrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex((prev) => (prev - 1 + Math.min(trendingGlobal.length, 9)) % Math.min(trendingGlobal.length, 9));
  };

  const scrollProviderLeft = () => providerScrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollProviderRight = () => providerScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  const getPosterUrl = (path: string | null) => path ? `${proxyUrl}/image/t/p/w500${path}` : "";
  const getBackdropUrl = (path: string | null) => path ? `${proxyUrl}/image/t/p/original${path}` : "";

  const getAiMatchScore = (id: string) => 88 + (id.length * 7) % 11;
  const getTitleCount = (id: string) => `${Math.max(1, id.length % 5)}.${id.length % 10}K titles`;

  const handleSurpriseMe = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isWildcardTransitioning || wildcardMoviePool.length === 0) return;
    
    setIsPlayingTrailer(false);
    setTrailerKey(null);
    setIsWildcardTransitioning(true);

    setTimeout(() => {
      let newPick = wildcardMovie;
      while (newPick?.id === wildcardMovie?.id && wildcardMoviePool.length > 1) {
        newPick = wildcardMoviePool[Math.floor(Math.random() * wildcardMoviePool.length)];
      }
      setWildcardMovie(newPick);
      setWildcardReason(generateAiReason(newPick!));

      setTimeout(() => {
        setIsWildcardTransitioning(false);
      }, 700); 
    }, 600); 
  };

  const handlePlayTrailer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!wildcardMovie || !proxyUrl) return;
    setIsFetchingTrailer(true);
    
    try {
      const res = await fetch(`${proxyUrl}/api/movie/${wildcardMovie.id}/videos`);
      if (!res.ok) throw new Error("Edge Response Error");
      const data = await res.json();
      
      const trailer = data.results?.find((vid: any) => vid.type === "Trailer" && vid.site === "YouTube") ||
                      data.results?.find((vid: any) => vid.site === "YouTube");
      
      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setIsPlayingTrailer(true);
      } else {
        alert("Trailer signal missing from global database.");
      }
    } catch (error) {
      console.error("Trailer Fetch Fault:", error);
      alert("Failed to initialize trailer uplink.");
    } finally {
      setIsFetchingTrailer(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="text-[11px] font-black text-white/30 tracking-[0.2em] uppercase">
          Assembling Blended Cinema Multiverse...
        </span>
      </div>
    );
  }

  const currentHero = trendingGlobal[heroIndex];
  const isMoodActive = selectedMood.id !== "All";

  const featuredMoodBg = moodGridRecs.length > 0 ? moodGridRecs[0] : null;
  const aiMatchPercent = getAiMatchScore(selectedMood.id);

  return (
    // 🚨 FIX: Replaced fixed styling with strictly constrained responsive flex containers
    <div className="w-full min-h-[calc(100vh-70px)] box-border px-4 md:px-6 lg:px-8 pb-10 text-white overflow-x-hidden">
      
      <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8 box-border items-start mt-4">

        {/* ── ⬅️ LEFT COLUMN: RESPONSIVE MOOD ENGINE ── */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0 min-w-0">
          
          {/* Top Search Button */}
          <div 
            onClick={() => setView?.("search")}
            className="w-full h-12 px-6 rounded-full bg-black/40 border border-white/5 flex items-center gap-3 text-white/50 cursor-pointer box-border"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <span className="text-[13px] font-medium">Search here</span>
          </div>

          <div className="flex flex-col h-auto lg:h-[530px] w-full">
            
            {/* Header */}
            <div className="shrink-0 px-1">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h3 className="m-0 mb-6 text-[22px] font-black tracking-[-0.02em] text-white">What's Your Mood?</h3>
              </motion.div>
            </div>

            {/* Scrollable Drawer */}
            <div className="no-scrollbar flex-1 overflow-y-auto flex flex-col gap-4 p-1 pb-10" style={{ WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" }}>
              
              {/* FEATURED HERO CARD */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`featured-${selectedMood.id}`}
                  initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className="w-full h-[190px] rounded-[24px] relative overflow-hidden shrink-0 border border-purple-500/40 bg-[#0a0512] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                >
                  {featuredMoodBg && (
                    <motion.img 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                      src={getBackdropUrl(featuredMoodBg.backdrop_path)} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05020a]/95 via-[#05020a]/40 to-[#05020a]/10" />

                  {selectedMood.id !== "All" && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                      className="absolute top-4 left-4 bg-purple-500/15 backdrop-blur-md border border-purple-400/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                    >
                      <span className="text-[14px]">✨</span>
                      <span className="text-[11px] font-black text-white tracking-[0.02em]">AI Match {aiMatchPercent}%</span>
                    </motion.div>
                  )}

                  <div className="absolute bottom-4 left-5 right-5 flex items-center gap-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                      className="w-12 h-12 rounded-full bg-[#140a1e]/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[24px] shadow-[0_10px_20px_rgba(0,0,0,0.5)] shrink-0"
                    >
                      {selectedMood.emoji}
                    </motion.div>
                    
                    <div className="flex flex-col min-w-0">
                      <motion.h4 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="m-0 mb-0.5 text-[20px] font-black text-white tracking-[-0.03em] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] truncate">
                        {selectedMood.id}
                      </motion.h4>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="m-0 text-[11px] text-purple-500 font-bold tracking-[0.05em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                        {selectedMood.subtitle}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* VERTICAL LIST OF OTHER MOODS */}
              <div className="flex flex-col gap-3 w-full">
                {sortedMoods.filter(m => m.id !== selectedMood.id).map((mood) => (
                  <motion.div
                    key={`list-${mood.id}`}
                    onClick={() => handleMoodSelect(mood)}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-4 rounded-[20px] bg-white/5 border border-white/5 cursor-pointer backdrop-blur-md transition-all duration-200 w-full"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[28px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] shrink-0">{mood.emoji}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-black text-white tracking-[-0.01em] truncate">{mood.id}</span>
                        <span className="text-[11px] font-semibold text-white/50 mt-0.5 truncate">{mood.subtitle.split(' • ')[0]} • {mood.subtitle.split(' • ')[1] || "Curated"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[10px] text-white/60 font-bold bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-full hidden sm:block">
                        {getTitleCount(mood.id)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── ➡️ RIGHT COLUMN: DYNAMIC CONTENT FRAME ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
          
          <div className="flex items-center h-12 pl-1 box-border w-full overflow-x-auto no-scrollbar">
            <div className="flex gap-6 text-[13px] font-semibold text-white/60 items-center whitespace-nowrap">
              {[
                { id: "all", label: "All" },
                { id: "movies", label: "Movies" },
                { id: "shows", label: "TV Shows" },
                { id: "anime", label: "Anime" }
              ].map((tab) => (
                <span 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSelectedMood(sortedMoods[0]); setActiveProvider(null); }} 
                  className="px-4 py-1.5 rounded-full cursor-pointer transition-all duration-300"
                  style={{ 
                    backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent", 
                    color: activeTab === tab.id ? "#ffffff" : "rgba(255,255,255,0.6)", 
                  }}
                >
                  {tab.label}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full relative min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "all" ? (
                <motion.div 
                  key="content-all" 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col gap-6 w-full"
                >
                  
                  {activeProvider ? (
                    <motion.div 
                      key="provider-hub"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="no-scrollbar w-full h-[530px] overflow-y-auto rounded-[32px] bg-[#0a050f]/60 border border-white/5 backdrop-blur-[40px] p-4 sm:p-8 box-border"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            onClick={() => setActiveProvider(null)}
                            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white cursor-pointer backdrop-blur-md shrink-0"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                          </motion.button>
                          <div className="min-w-0">
                            <h2 className="m-0 text-[22px] sm:text-[28px] font-black tracking-[-0.02em] truncate">{activeProvider.name} Hub</h2>
                            <p className="m-0 mt-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.1em] truncate" style={{ color: activeProvider.color }}>Official Provider Network</p>
                          </div>
                        </div>
                      </div>

                      {isProviderLoading || !providerFeed ? (
                        <div className="h-[300px] flex items-center justify-center">
                          <span className="text-[11px] font-extrabold text-white/40 uppercase tracking-[0.1em]">Establishing Secure Feed...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-8 w-full">
                          {[
                            { title: "Trending Now", data: providerFeed.trending, ref: providerTrendingRef },
                            { title: "Top Rated", data: providerFeed.topRated, ref: providerTopRatedRef },
                            { title: "Recently Released", data: providerFeed.recent, ref: providerRecentRef }
                          ].map((row, idx) => (
                            <div key={idx} className="w-full">
                              <div className="flex justify-between items-center mb-4 pr-2">
                                <h3 className="m-0 text-[13px] sm:text-[14px] font-extrabold text-white/80 uppercase tracking-[0.05em] truncate">{row.title}</h3>
                                <div className="flex gap-2 shrink-0">
                                  <motion.div
                                    onClick={() => row.ref.current?.scrollBy({ left: -320, behavior: "smooth" })}
                                    whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200"
                                  >
                                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                  </motion.div>
                                  <motion.div
                                    onClick={() => row.ref.current?.scrollBy({ left: 300, behavior: "smooth" })}
                                    whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200"
                                  >
                                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                  </motion.div>
                                </div>
                              </div>
                              <div ref={row.ref} className="no-scrollbar flex gap-4 overflow-x-auto pb-4 scroll-smooth box-border w-full">
                                {row.data.slice(0, 10).map((movie) => (
                                  <div key={`prov-${movie.id}`} className="w-[120px] sm:w-[130px] shrink-0">
                                    <PremiumMediaCard 
                                      media={movie as any} 
                                      onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie", media_type: movie.media_type || "movie" })} 
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col gap-3 w-full">
                      
                      <div className="w-full relative perspective-[1000px] transition-[height] duration-600 ease-[cubic-bezier(0.25,1,0.5,1)]" style={{ height: isMoodActive ? "560px" : "420px" }}>
                        <AnimatePresence mode="wait">
                          {!isMoodActive && currentHero ? (
                            <motion.div 
                              key="hero-wrapper"
                              initial={{ opacity: 0, filter: "blur(4px)" }}
                              animate={{ opacity: 1, filter: "blur(0px)" }}
                              exit={{ opacity: 0, filter: "blur(4px)" }}
                              transition={{ duration: 0.4 }}
                              className="w-full h-full absolute inset-0 rounded-[32px] overflow-hidden border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                            >
                              <AnimatePresence>
                                <motion.div 
                                  key={`hero-${currentHero.id}`}
                                  initial={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
                                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                  exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)", zIndex: -1 }}
                                  transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                                  className="absolute inset-0 w-full h-full"
                                >
                                  <img src={getBackdropUrl(currentHero.backdrop_path)} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/10 to-transparent pointer-events-none" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                  <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 max-w-[540px] pointer-events-none z-30">
                                    <span className="inline-block text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md mb-4 uppercase tracking-[0.05em]">
                                      {currentHero.media_type === "tv" ? "Global TV Sensation" : "Global Blockbuster"}
                                    </span>
                                    <h2 className="text-[2rem] sm:text-[2.8rem] font-black m-0 mb-3 tracking-[-0.03em] leading-[1.05]">{currentHero.title || currentHero.name}</h2>
                                    <p className="m-0 mb-6 text-[12px] sm:text-[13px] text-white/65 leading-relaxed line-clamp-2 sm:line-clamp-3">{currentHero.overview}</p>
                                    
                                    <motion.button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSelectMedia?.({ ...currentHero, mediaType: currentHero.media_type || "movie", media_type: currentHero.media_type || "movie" });
                                      }}
                                      whileHover={{ backgroundColor: "rgba(168, 85, 247, 0.2)", borderColor: "rgba(192, 132, 252, 0.7)", boxShadow: "inset 0 0 15px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)" }}
                                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/15 bg-white/5 text-white text-[13px] font-extrabold cursor-pointer backdrop-blur-md transition-all duration-200 pointer-events-auto"
                                    >
                                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      Info
                                    </motion.button>
                                  </div>
                                </motion.div>
                              </AnimatePresence>
                              
                              <div className="absolute top-6 right-6 sm:bottom-10 sm:top-auto sm:right-10 flex gap-3 z-30 pointer-events-auto">
                                <motion.button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrevHero(e); }}
                                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)", boxShadow: "0 0 15px rgba(255,255,255,0.2)" }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white cursor-pointer backdrop-blur-md transition-all duration-200"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </motion.button>
                                <motion.button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNextHero(e); }}
                                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)", boxShadow: "0 0 15px rgba(255,255,255,0.2)" }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white cursor-pointer backdrop-blur-md transition-all duration-200"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </motion.button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="mood-grid" 
                              initial={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} 
                              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                              exit={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} 
                              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                              className="no-scrollbar w-full h-full overflow-y-auto absolute inset-0 bg-transparent box-border pb-6 px-2 sm:px-0"
                            >
                              {isAiThinking ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-[3px] border-transparent border-t-purple-500 rounded-full" />
                                  <span className="text-[12px] font-bold text-white/60 uppercase tracking-[0.1em]">✨ Finding something you'll love...</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 pt-2">
                                    <span className="text-[40px] sm:text-[48px] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{selectedMood.emoji}</span>
                                    <div>
                                      <h2 className="m-0 text-[24px] sm:text-[28px] font-black tracking-[-0.03em]">{selectedMood.id} Picks</h2>
                                      <p className="m-0 mt-1 text-[11px] sm:text-[12px] text-purple-500 font-bold tracking-[0.05em] uppercase">Curated by DoBinge AI Engine</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                                    {moodGridRecs.map((movie, idx) => (
                                      <PremiumMediaCard 
                                        key={`grid-${movie.id}-${idx}`}
                                        media={movie as any}
                                        onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie", media_type: movie.media_type || "movie" })}
                                      />
                                    ))}
                                  </div>

                                  <div className="flex justify-center mt-10 pb-8">
                                    <motion.button
                                      whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setMoodPage(prev => prev + 1)}
                                      disabled={isMoodLoading}
                                      className="px-8 py-3.5 rounded-full border border-purple-400/40 bg-purple-500/15 text-white text-[12px] font-extrabold cursor-pointer backdrop-blur-md shadow-[0_10px_20px_rgba(168,85,247,0.2)] transition-all duration-200"
                                    >
                                      {isMoodLoading ? "Calibrating Neural Net..." : "Load More"}
                                    </motion.button>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full mt-3">
                        <div className="flex justify-between items-center mb-3 pr-1">
                          <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold tracking-[-0.02em]">Watch on Streaming Platforms</h3>
                          <div className="flex gap-2 shrink-0">
                            <motion.div onClick={() => scrollProviderLeft()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200">
                              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </motion.div>
                            <motion.div onClick={() => scrollProviderRight()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200">
                              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </motion.div>
                          </div>
                        </div>
                        
                        <div ref={providerScrollRef} className="no-scrollbar flex gap-4 overflow-x-auto pb-4 scroll-smooth w-full">
                          {PLATFORMS.map((platform) => (
                            <motion.div 
                              key={platform.id} 
                              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }} 
                              onClick={() => setActiveProvider(platform)}
                              className="w-[140px] sm:w-[160px] h-[60px] sm:h-[70px] shrink-0 rounded-[16px] bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                            >
                              <span className="text-[18px] sm:text-[20px] font-black tracking-[-0.04em] scale-125 inline-block" style={{ color: platform.color, filter: `drop-shadow(0 0 12px ${platform.color}50)` }}>
                                {platform.name}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key={`placeholder-${activeTab}`} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-[420px] rounded-[32px] flex flex-col items-center justify-center bg-[#140a1e]/40 border border-white/5 backdrop-blur-[20px]"
                >
                  <span className="text-[48px] mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {activeTab === "movies" ? "🎬" : activeTab === "shows" ? "📺" : "⚔️"}
                  </span>
                  <h2 className="m-0 text-[24px] font-black text-white tracking-[-0.02em]">
                    {activeTab === "movies" ? "Movies" : activeTab === "shows" ? "TV Shows" : "Anime"} Hub
                  </h2>
                  <p className="m-0 mt-3 text-[12px] text-white/50 uppercase tracking-[0.1em] font-bold">
                    Under Construction by DoBinge AI Engine
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ── 🎲 TONIGHT'S WILDCARD ── */}
      {activeTab === "all" && !activeProvider && wildcardMovie && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-[60vh] sm:h-[75vh] min-h-[450px] sm:min-h-[500px] mt-12 mb-4 rounded-[32px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] bg-[#05020a]"
        >
          {/* Trailer Overlay */}
          <AnimatePresence>
            {isPlayingTrailer && trailerKey && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] bg-black"
              >
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                  frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                  className="w-full h-full object-cover border-none"
                />
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPlayingTrailer(false); setTrailerKey(null); }}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md z-[110] transition-colors duration-200 pointer-events-auto hover:bg-purple-500/50"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background Layer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-${wildcardMovie.id}`}
              initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              <img src={getBackdropUrl(wildcardMovie.backdrop_path)} alt="" className="w-full h-full object-cover opacity-70" />
            </motion.div>
          </AnimatePresence>

          {/* Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,1,4,0.4)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020104]/95 via-[#020104]/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020104]/80 via-transparent to-[#020104]/80 pointer-events-none" />

          {/* TOP LEFT LABEL */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2.5 z-10 pointer-events-none">
            <span className="text-[24px]">🎲</span>
            <div>
              <h3 className="m-0 text-[16px] font-black tracking-[-0.02em] text-white">Tonight's Wildcard</h3>
              <p className="m-0 text-[10px] font-extrabold text-purple-500 uppercase tracking-[0.1em]">Global Cinema Pick</p>
            </div>
          </div>

          {/* CENTER SURPRISE BUTTON */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <motion.button
              onClick={handleSurpriseMe}
              disabled={isWildcardTransitioning}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 sm:px-9 sm:py-4 rounded-full bg-purple-500/15 border border-purple-400/40 backdrop-blur-[20px] text-white text-[12px] sm:text-[14px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] transition-colors duration-300 pointer-events-auto cursor-pointer"
            >
              {isWildcardTransitioning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-transparent border-t-white rounded-full" />
              ) : (
                <span className="text-[16px]">🎲</span>
              )}
              {isWildcardTransitioning ? "Calibrating..." : "Surprise Me"}
            </motion.button>
          </div>

          {/* BOTTOM LEFT: METADATA & TITLE */}
          <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 w-[90%] sm:max-w-[60%] z-30 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div key={`meta-${wildcardMovie.id}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <h2 className="text-[clamp(28px,4vw,56px)] font-black m-0 mb-3 leading-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] tracking-[-0.02em]">
                  {wildcardMovie.title || wildcardMovie.name}
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-bold">
                    {wildcardMovie.release_date?.split("-")[0] || wildcardMovie.first_air_date?.split("-")[0] || "2026"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                    ★ {wildcardMovie.vote_average?.toFixed(1) || "NR"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-bold uppercase">
                    Movie
                  </span>
                </div>

                <p className="m-0 text-[12px] sm:text-[13px] text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-3 w-full sm:max-w-[90%]">
                  {wildcardMovie.overview}
                </p>
                
                {/* ── ACTION BUTTONS ── */}
                <div className="flex gap-3 mt-5 pointer-events-auto relative z-50">
                  <motion.button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectMedia?.({ ...wildcardMovie, mediaType: "movie", media_type: "movie" }); }}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white text-black text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] cursor-pointer shadow-[0_8px_20px_rgba(0,0,0,0.5)] transition-all duration-200"
                  >
                    More Info
                  </motion.button>

                  <motion.button
                    onClick={handlePlayTrailer} disabled={isFetchingTrailer}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)", boxShadow: "0 10px 25px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white/5 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] cursor-pointer border border-white/20 backdrop-blur-md flex items-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-all duration-200"
                  >
                    {isFetchingTrailer ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-3 h-3 border-2 border-transparent border-t-white rounded-full" />
                    ) : (
                      <svg width="12" height="12" sm-width="14" sm-height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                    {isFetchingTrailer ? "Loading..." : "Trailer"}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: AI REASON (Floating Glass Panel - Hidden on small mobile to save space) */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 max-w-[300px] z-10 flex-col gap-6 pointer-events-none hidden lg:flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={`reason-${wildcardMovie.id}`}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="p-6 rounded-[24px] bg-[#0a0612]/55 backdrop-blur-[24px] border border-purple-500/25 shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                  <span className="text-[9px] font-extrabold text-purple-500 uppercase tracking-[0.15em]">AI Neural Match</span>
                </div>
                <p className="m-0 text-[15px] font-semibold text-white leading-relaxed tracking-[-0.01em]">
                  "{wildcardReason}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

        </motion.div>
      )}

      {/* ── ⚙️ FULL HORIZONTAL WIDE FOOTPRINT FEED SEGMENT ── */}
      {activeTab === "all" && !activeProvider && (
        <div className="w-full flex flex-col gap-8 mt-4 box-border">
          {[
            { title: "Curated Only for You", ref: curatedScrollRef, feed: curatedList },
            { title: "Trending Hollywood", ref: hollywoodScrollRef, feed: hollywoodFeed },
            { title: "Trending Bollywood", ref: bollywoodScrollRef, feed: bollywoodFeed },
            { title: "Trending Tollywood", ref: tollywoodScrollRef, feed: tollywoodFeed }
          ].map((carousel, idx) => (
            <div key={idx} className="w-full">
              <div className="flex justify-between items-center mb-4 pr-2">
                <h3 className="m-0 text-[15px] sm:text-[16px] font-extrabold tracking-[-0.02em]">{carousel.title}</h3>
                <div className="flex gap-2">
                  <motion.div 
                    onClick={() => carousel.ref.current?.scrollBy({ left: -320, behavior: "smooth" })} 
                    whileHover={{ scale: 1.08, backgroundColor: "rgba(168, 85, 247, 0.2)", borderColor: "rgba(192, 132, 252, 0.6)" }} 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200"
                  >
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </motion.div>
                  <motion.div 
                    onClick={() => carousel.ref.current?.scrollBy({ left: 300, behavior: "smooth" })} 
                    whileHover={{ scale: 1.08, backgroundColor: "rgba(168, 85, 247, 0.2)", borderColor: "rgba(192, 132, 252, 0.6)" }} 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer transition-all duration-200"
                  >
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </motion.div>
                </div>
              </div>
              
              <div 
                ref={carousel.ref} 
                className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden pt-1 pb-4 scroll-smooth box-border w-full"
              >
                {carousel.feed.map((movie, itemIdx) => (
                  <div key={`${idx}-${movie.id}-${itemIdx}`} className="w-[130px] sm:w-[150px] shrink-0">
                    <PremiumMediaCard 
                      media={movie as any}
                      onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie" })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}