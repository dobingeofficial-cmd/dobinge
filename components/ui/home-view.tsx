"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; 
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
  genre_ids?: number[];
}

interface HomeViewProps {
  onSelectMedia?: (media: MovieItem & { mediaType?: string }) => void;
  setView?: (view: string) => void;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 
  10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 
  878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adv", 
  10762: "Kids", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

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

type ProviderType = typeof PLATFORMS[0];
type MoodType = typeof MOODS[0];

export default function HomeView({ onSelectMedia, setView }: HomeViewProps) {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "shows" | "anime">("all");

  const [trendingGlobal, setTrendingGlobal] = useState<MovieItem[]>([]);
  const [curatedList, setCuratedList] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [heroIndex, setHeroIndex] = useState(0);
  const fetchedLogosRef = useRef<Set<number>>(new Set());
  const [logoCache, setLogoCache] = useState<Record<number, string | null>>({});

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

  const [sortedMoods, setSortedMoods] = useState<MoodType[]>(MOODS);
  const [selectedMood, setSelectedMood] = useState<MoodType>(MOODS[0]);
  const [moodGridRecs, setMoodGridRecs] = useState<MovieItem[]>([]);
  const [moodPage, setMoodPage] = useState(1);
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [activeProvider, setActiveProvider] = useState<ProviderType | null>(null);
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
    try {
      const scores = JSON.parse(localStorage.getItem('dobinge_mood_scores') || '{}');
      const sorted = [...MOODS].sort((a, b) => {
        if (a.id === "All") return -1;
        if (b.id === "All") return 1;
        return (scores[b.id] || 0) - (scores[a.id] || 0);
      });
      setSortedMoods(sorted);
      setSelectedMood(sorted[0]);
    } catch (e) {
      console.error("Local storage access failed", e);
    }
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
          fetch(`${proxyUrl}/api/trending/all/day`),
          fetch(`${proxyUrl}/api/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=100`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=hi|ko|es|fr|it|de|tr|zh&sort_by=popularity.desc&vote_count.gte=100`),
          fetch(`${proxyUrl}/api/trending/movie/day?language=en-US`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=hi&sort_by=popularity.desc&vote_count.gte=50&with_origin_country=IN`),
          fetch(`${proxyUrl}/api/discover/movie?with_original_language=te|ta|ml|kn&sort_by=popularity.desc&vote_count.gte=50&with_origin_country=IN`),
          fetch(`${proxyUrl}/api/trending/tv/day?language=en-US`)
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

  const currentHero = trendingGlobal[heroIndex];

  useEffect(() => {
    if (!currentHero?.id || !proxyUrl) return;

    const fetchLogo = async (hero: MovieItem) => {
      if (!hero || !hero.id || fetchedLogosRef.current.has(hero.id)) return;
      
      fetchedLogosRef.current.add(hero.id);
      
      try {
        const res = await fetch(`${proxyUrl}/api/${hero.media_type || 'movie'}/${hero.id}/images`);
        if (!res.ok) return;
        
        const data = await res.json();
        const englishLogo = data.logos?.find((l: any) => l.iso_639_1 === 'en');
        const bestLogo = englishLogo || data.logos?.[0];
        
        setLogoCache(prev => ({ ...prev, [hero.id]: bestLogo ? bestLogo.file_path : null }));
      } catch (err) {
        setLogoCache(prev => ({ ...prev, [hero.id]: null }));
      }
    };

    fetchLogo(currentHero);

    if (trendingGlobal.length > 0) {
      const nextIndex = (heroIndex + 1) % Math.min(trendingGlobal.length, 9);
      const nextHero = trendingGlobal[nextIndex];
      if (nextHero) fetchLogo(nextHero);
    }

  }, [currentHero, heroIndex, trendingGlobal, proxyUrl]);

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

  const handleMoodSelect = (mood: MoodType) => {
    if (mood.id === selectedMood.id) return;
    try {
      const scores = JSON.parse(localStorage.getItem('dobinge_mood_scores') || '{}');
      scores[mood.id] = (scores[mood.id] || 0) + 1;
      localStorage.setItem('dobinge_mood_scores', JSON.stringify(scores));
    } catch (e) {
      console.error("Local storage set failed", e);
    }
    setIsAiThinking(true);
    setSelectedMood(mood);
    setMoodPage(1);
    setActiveProvider(null);
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
      <div style={{ width: "100%", height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Assembling Blended Cinema Multiverse...
        </span>
      </div>
    );
  }

  const isMoodActive = selectedMood.id !== "All";
  const featuredMoodBg = moodGridRecs.length > 0 ? moodGridRecs[0] : null;
  const aiMatchPercent = getAiMatchScore(selectedMood.id);
  const primaryGenre = currentHero?.genre_ids?.[0] ? GENRE_MAP[currentHero.genre_ids[0]] : (currentHero?.media_type === 'tv' ? 'TV Series' : 'Movie');
  const activeLogo = currentHero ? logoCache[currentHero.id] : null;

  return (
    <>
      {/* 🚨 ARCHITECTURE UPGRADE: 7.5 Ratio Desktop Engine + Safe Hover Margins */}
      <style>{`
        .dobinge-carousel-viewport {
          position: relative;
          width: 100%;
          /* Cinematic Right Fade: Applies exclusively to the outer viewport, leaving posters sharp */
          -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        
        .dobinge-carousel-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          overflow-y: visible; /* Prevents vertical clipping of the 1.02 scale */
          scroll-behavior: smooth;
          /* Negative margin + positive padding mathematically protects hover physics */
          margin-top: -16px;
          margin-bottom: -32px;
          padding-top: 16px;
          padding-bottom: 32px;
        }

        .dobinge-carousel-item {
          flex: 0 0 auto;
          /* Desktop default: Exactly 7.5 posters mathematically calculated */
          width: calc((100% - (16px * 7)) / 7.5);
        }
        
        /* Responsive Density Breakpoints */
        @media (max-width: 1440px) { .dobinge-carousel-item { width: calc((100% - (16px * 6)) / 6.5); } }
        @media (max-width: 1024px) { .dobinge-carousel-item { width: calc((100% - (16px * 4)) / 4.5); } }
        @media (max-width: 768px) { .dobinge-carousel-item { width: calc((100% - (16px * 3)) / 3.5); } }
        @media (max-width: 640px) { .dobinge-carousel-item { width: calc((100% - (16px * 2)) / 2.5); } }
      `}</style>

      <div style={{ width: "100%", minHeight: "calc(100vh - 70px)", boxSizing: "border-box", padding: "0px 24px 40px 0px", color: "#ffffff" }}>
        
        <div style={{ width: "100%", display: "flex", gap: "32px", boxSizing: "border-box", alignItems: "flex-start" }}>

          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
              
            <div style={{ display: "flex", flexDirection: "column", height: "600px" }}>
              
              <div style={{ flexShrink: 0, height: "48px", display: "flex", alignItems: "center" }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>What's Your Mood?</h3>
                </motion.div>
              </div>

              <div className="no-scrollbar" style={{ 
                flex: 1, 
                overflowY: "auto", 
                display: "flex", 
                flexDirection: "column", 
                gap: "16px", 
                padding: "4px 4px 40px 4px", 
                WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", 
                maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" 
              }}>
                  
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`featured-${selectedMood.id}`}
                    initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    style={{ 
                      width: "100%", height: "190px", borderRadius: "24px", position: "relative", overflow: "hidden", 
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)", flexShrink: 0,
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                      backgroundColor: "#0a0512" 
                    }}
                  >
                    {featuredMoodBg && (
                      <motion.img 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                        src={getBackdropUrl(featuredMoodBg.backdrop_path)} 
                        alt="" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    )}
                    
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,2,10,0.95) 0%, rgba(5,2,10,0.4) 40%, rgba(5,2,10,0.1) 100%)" }} />

                    {selectedMood.id !== "All" && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(168, 85, 247, 0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(192, 132, 252, 0.3)", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
                      >
                        <span style={{ fontSize: "14px" }}>✨</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>AI Match {aiMatchPercent}%</span>
                      </motion.div>
                    )}

                    <div style={{ position: "absolute", bottom: "16px", left: "20px", right: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                        style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(20, 10, 30, 0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 10px 20px rgba(0,0,0,0.5)", flexShrink: 0 }}
                      >
                        {selectedMood.emoji}
                      </motion.div>
                      
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <motion.h4 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ margin: "0 0 2px 0", fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }}>
                          {selectedMood.id}
                        </motion.h4>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ margin: 0, fontSize: "11px", color: "#a855f7", fontWeight: 700, letterSpacing: "0.05em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                          {selectedMood.subtitle}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sortedMoods.filter(m => m.id !== selectedMood.id).map((mood) => (
                    <motion.div
                      key={`list-${mood.id}`}
                      onClick={() => handleMoodSelect(mood)}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px", borderRadius: "20px",
                        backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s", flexShrink: 0
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{mood.emoji}</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{mood.id}</span>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{mood.subtitle.split(' • ')[0]} • {mood.subtitle.split(' • ')[1] || "Curated"}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: "12px" }}>
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

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", paddingLeft: "4px", boxSizing: "border-box" }}>
              
              <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.6)", alignItems: "center" }}>
                {[
                  { id: "all", label: "All" },
                  { id: "movies", label: "Movies" },
                  { id: "shows", label: "TV Shows" },
                  { id: "anime", label: "Anime" }
                ].map((tab) => (
                  <motion.span 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setSelectedMood(sortedMoods[0]); setActiveProvider(null); }} 
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2, 
                      backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                      boxShadow: "0 4px 15px rgba(168, 85, 247, 0.2)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      padding: "6px 16px", 
                      backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent", 
                      borderRadius: "20px", 
                      color: activeTab === tab.id ? "#ffffff" : "rgba(255,255,255,0.6)", 
                      cursor: "pointer",
                      transition: "color 0.2s ease, background-color 0.2s ease, font-weight 0.2s ease",
                      boxShadow: activeTab === tab.id ? "0 4px 15px rgba(168, 85, 247, 0.15)" : "none",
                      fontWeight: activeTab === tab.id ? 800 : 600
                    }}
                  >
                    {tab.label}
                  </motion.span>
                ))}
              </div>

              <motion.div
                onClick={() => router.push('/discover')}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(192, 132, 252, 0.4)", boxShadow: "0 4px 20px rgba(168, 85, 247, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "280px", 
                  height: "38px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: "10px",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.2s ease"
                }}
              >
                <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.02em" }}>Eg, Something similar to Interstellar</span>
              </motion.div>
            </div>

            <div style={{ width: "100%", position: "relative" }}>
              <AnimatePresence mode="wait">
                {activeTab === "all" ? (
                  <motion.div 
                    key="content-all" 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -15 }} 
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                  >
                    
                    {activeProvider ? (
                      <motion.div 
                        key="provider-hub"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className="no-scrollbar"
                        style={{ 
                          width: "100%", 
                          height: "530px",
                          overflowY: "auto", 
                          borderRadius: "32px", 
                          backgroundColor: "rgba(10, 5, 15, 0.6)", 
                          border: "1px solid rgba(255,255,255,0.05)", 
                          backdropFilter: "blur(40px)", 
                          padding: "32px", 
                          boxSizing: "border-box" 
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <motion.button 
                              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                              onClick={() => setActiveProvider(null)}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", backdropFilter: "blur(10px)" }}
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </motion.button>
                            <div>
                              <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>{activeProvider.name} Hub</h2>
                              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: activeProvider.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Official Provider Network</p>
                            </div>
                          </div>
                        </div>

                        {isProviderLoading || !providerFeed ? (
                          <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Establishing Secure Feed...</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                            {[
                              { title: "Trending Now", data: providerFeed.trending, ref: providerTrendingRef },
                              { title: "Top Rated", data: providerFeed.topRated, ref: providerTopRatedRef },
                              { title: "Recently Released", data: providerFeed.recent, ref: providerRecentRef }
                            ].map((row, idx) => (
                              <div key={idx}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingRight: "8px" }}>
                                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.title}</h3>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <motion.div
                                      onClick={() => row.ref.current?.scrollBy({ left: -320, behavior: "smooth" })}
                                      whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
                                      style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </motion.div>
                                    <motion.div
                                      onClick={() => row.ref.current?.scrollBy({ left: 300, behavior: "smooth" })}
                                      whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
                                      style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </motion.div>
                                  </div>
                                </div>
                                
                                <div className="dobinge-carousel-viewport">
                                  <div ref={row.ref} className="no-scrollbar dobinge-carousel-track">
                                    {row.data.slice(0, 10).map((movie) => (
                                      <div key={`prov-${movie.id}`} className="dobinge-carousel-item">
                                        <PremiumMediaCard 
                                          media={movie as any} 
                                          onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie", media_type: movie.media_type || "movie" })} 
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                        
                        <div style={{ width: "100%", height: isMoodActive ? "560px" : "420px", position: "relative", perspective: "1000px", transition: "height 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}>
                          <AnimatePresence mode="wait">
                            {!isMoodActive && currentHero ? (
                              <motion.div 
                                key={`hero-${currentHero.id}`}
                                initial={{ opacity: 0, filter: "blur(4px)" }}
                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, filter: "blur(4px)", zIndex: -1 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                style={{ width: "100%", height: "100%", position: "absolute", inset: 0, borderRadius: "32px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.04)", boxShadow: "0 30px 60px rgba(0, 0, 0, 0.5)" }}
                              >
                                <img src={getBackdropUrl(currentHero.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                                
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(2,1,4,0.95) 0%, rgba(2,1,4,0.6) 40%, transparent 100%)", pointerEvents: "none" }} />
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(2,1,4,0.95) 0%, transparent 50%)", pointerEvents: "none" }} />

                                <div style={{ position: "absolute", bottom: "40px", left: "40px", maxWidth: "600px", pointerEvents: "none", zIndex: 30, display: "flex", flexDirection: "column", gap: "12px" }}>
                                  
                                  {activeLogo ? (
                                    <img 
                                      src={getPosterUrl(activeLogo)} 
                                      alt={currentHero.title || currentHero.name} 
                                      style={{ width: "auto", height: "auto", maxWidth: "60%", maxHeight: "85px", objectFit: "contain", objectPosition: "left bottom", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))" }} 
                                    />
                                  ) : (
                                    <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", lineHeight: "1.1", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
                                      {currentHero.title || currentHero.name}
                                    </h2>
                                  )}

                                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textShadow: "0 2px 10px rgba(0,0,0,0.8)", marginTop: "4px" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                      {currentHero.release_date?.split("-")[0] || currentHero.first_air_date?.split("-")[0] || "2026"}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}>
                                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                      {currentHero.vote_average?.toFixed(1) || "NR"}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                      {primaryGenre}
                                    </span>
                                  </div>
                                  
                                  <p style={{ margin: "4px 0 16px 0", fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                                    {currentHero.overview}
                                  </p>
                                  
                                  <div style={{ display: "flex", gap: "12px", pointerEvents: "auto" }}>
                                    <motion.button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        alert("This media could not be located directly on your streaming platforms. (External routing coming soon)");
                                      }}
                                      whileHover={{ scale: 1.05, backgroundColor: "#ffffff" }}
                                      whileTap={{ scale: 0.95 }}
                                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "30px", backgroundColor: "#e2e8f0", color: "#000", fontSize: "13px", fontWeight: 800, cursor: "pointer", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", transition: "background-color 0.2s" }}
                                    >
                                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                                      Play
                                    </motion.button>

                                    <motion.button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSelectMedia?.({ ...currentHero, mediaType: currentHero.media_type || "movie", media_type: currentHero.media_type || "movie" });
                                      }}
                                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                                      whileTap={{ scale: 0.95 }}
                                      style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </motion.button>
                                  </div>
                                </div>
                                
                                <div style={{ position: "absolute", bottom: "40px", right: "40px", display: "flex", gap: "8px", zIndex: 30, pointerEvents: "auto", alignItems: "center" }}>
                                  {trendingGlobal.slice(0, 9).map((_, idx) => (
                                    <motion.div 
                                      key={idx}
                                      onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }}
                                      animate={{ 
                                        width: idx === heroIndex ? 24 : 8, 
                                        backgroundColor: idx === heroIndex ? "#ffffff" : "rgba(255,255,255,0.3)" 
                                      }}
                                      transition={{ duration: 0.3 }}
                                      style={{ height: "8px", borderRadius: "4px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="mood-grid" 
                                initial={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} 
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                                exit={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} 
                                transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                                className="no-scrollbar"
                                style={{ width: "100%", height: "100%", overflowY: "auto", position: "absolute", inset: 0, backgroundColor: "transparent", boxSizing: "border-box", paddingBottom: "24px" }}
                              >
                                {isAiThinking ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "32px", height: "32px", border: "3px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>✨ Finding something you'll love...</span>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingTop: "8px" }}>
                                      <span style={{ fontSize: "48px", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}>{selectedMood.emoji}</span>
                                      <div>
                                        <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em" }}>{selectedMood.id} Picks</h2>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "rgba(168, 85, 247, 0.9)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Curated by DoBinge AI Engine</p>
                                      </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "24px" }}>
                                      {moodGridRecs.map((movie, idx) => (
                                        <PremiumMediaCard 
                                          key={`grid-${movie.id}-${idx}`}
                                          media={movie as any}
                                          onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie" })}
                                        />
                                      ))}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", paddingBottom: "32px" }}>
                                      <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setMoodPage(prev => prev + 1)}
                                        disabled={isMoodLoading}
                                        style={{ padding: "14px 36px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", backdropFilter: "blur(12px)", boxShadow: "0 10px 20px rgba(168, 85, 247, 0.2)", transition: "all 0.2s" }}
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

                        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} style={{ width: "100%", marginTop: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingRight: "4px" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}>Watch on Streaming Platforms</h3>
                            <div style={{ display: "flex", gap: "12px" }}>
                              <motion.div onClick={() => scrollProviderLeft()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}>
                                <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                              </motion.div>
                              <motion.div onClick={() => scrollProviderRight()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}>
                                <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                              </motion.div>
                            </div>
                          </div>
                          
                          <div className="dobinge-carousel-viewport">
                            <div ref={providerScrollRef} className="no-scrollbar dobinge-carousel-track">
                              {PLATFORMS.map((platform) => (
                                <motion.div 
                                  key={platform.id} 
                                  whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }} 
                                  onClick={() => setActiveProvider(platform)}
                                  style={{ width: "160px", height: "70px", flexShrink: 0, borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}
                                >
                                  <span style={{ fontSize: "20px", fontWeight: 900, color: platform.color, letterSpacing: "-0.04em", transform: "scale(1.25)", display: "inline-block", filter: `drop-shadow(0 0 12px ${platform.color}50)` }}>
                                    {platform.name}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
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
                    style={{ width: "100%", height: "420px", borderRadius: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(20, 10, 30, 0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
                  >
                    <span style={{ fontSize: "48px", marginBottom: "16px", filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))" }}>
                      {activeTab === "movies" ? "🎬" : activeTab === "shows" ? "📺" : "⚔️"}
                    </span>
                    <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                      {activeTab === "movies" ? "Movies" : activeTab === "shows" ? "TV Shows" : "Anime"} Hub
                    </h2>
                    <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                      Under Construction by DoBinge AI Engine
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* ── 🎲 TONIGHT'S WILDCARD (STRICTLY MOVIES: GLOBAL & MULTI-REGIONAL) ── */}
        {activeTab === "all" && !activeProvider && wildcardMovie && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "100%",
              height: "75vh",
              minHeight: "500px",
              marginTop: "48px",
              marginBottom: "16px",
              borderRadius: "32px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8)",
              backgroundColor: "#05020a"
            }}
          >
            <AnimatePresence>
              {isPlayingTrailer && trailerKey && (
                <motion.div
                  key="trailer-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: "absolute", inset: 0, zIndex: 100, backgroundColor: "#000" }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ objectFit: "cover", width: "100%", height: "100%", border: "none" }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPlayingTrailer(false);
                      setTrailerKey(null);
                    }}
                    style={{
                      position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px",
                      borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      backdropFilter: "blur(10px)", zIndex: 110, transition: "background-color 0.2s", pointerEvents: "auto"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.5)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)"}
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`bg-${wildcardMovie.id}`}
                initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                style={{ position: "absolute", inset: 0 }}
              >
                <img src={getBackdropUrl(wildcardMovie.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
              </motion.div>
            </AnimatePresence>

            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, rgba(2, 1, 4, 0.4) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2, 1, 4, 0.95) 0%, rgba(2, 1, 4, 0.4) 40%, transparent 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(2, 1, 4, 0.8) 0%, transparent 40%, transparent 60%, rgba(2, 1, 4, 0.8) 100%)", pointerEvents: "none" }} />

            <div style={{ position: "absolute", top: "32px", left: "32px", display: "flex", alignItems: "center", gap: "10px", zIndex: 10, pointerEvents: "none" }}>
              <span style={{ fontSize: "24px" }}>🎲</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>Tonight's Wildcard</h3>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em" }}>Global Cinema Pick</p>
              </div>
            </div>

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
              <motion.button
                onClick={handleSurpriseMe}
                disabled={isWildcardTransitioning}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "16px 36px",
                  borderRadius: "40px",
                  backgroundColor: "rgba(168, 85, 247, 0.15)",
                  border: "1px solid rgba(192, 132, 252, 0.4)",
                  backdropFilter: "blur(20px)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  cursor: isWildcardTransitioning ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)",
                  transition: "background-color 0.3s ease",
                  pointerEvents: "auto"
                }}
              >
                {isWildcardTransitioning ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "16px", height: "16px", border: "2px solid transparent", borderTopColor: "#fff", borderRadius: "50%" }} />
                ) : (
                  <span style={{ fontSize: "16px" }}>🎲</span>
                )}
                {isWildcardTransitioning ? "Calibrating..." : "Surprise Me"}
              </motion.button>
            </div>

            <div style={{ position: "absolute", bottom: "32px", left: "32px", maxWidth: "60%", zIndex: 30, pointerEvents: "none" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`meta-${wildcardMovie.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 900, margin: "0 0 12px 0", lineHeight: 1.1, textShadow: "0 10px 20px rgba(0,0,0,0.8)", letterSpacing: "-0.02em" }}>
                    {wildcardMovie.title || wildcardMovie.name}
                  </h2>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700 }}>
                      {wildcardMovie.release_date?.split("-")[0] || wildcardMovie.first_air_date?.split("-")[0] || "2026"}
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                      ★ {wildcardMovie.vote_average?.toFixed(1) || "NR"}
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                      Movie
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "90%" }}>
                    {wildcardMovie.overview}
                  </p>
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px", pointerEvents: "auto", position: "relative", zIndex: 50 }}>
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectMedia?.({ ...wildcardMovie, mediaType: "movie" });
                      }}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        padding: "12px 28px", 
                        borderRadius: "24px", 
                        backgroundColor: "#fff", 
                        color: "#000", 
                        fontSize: "11px", 
                        fontWeight: 900, 
                        textTransform: "uppercase", 
                        letterSpacing: "0.1em", 
                        cursor: "pointer", 
                        border: "1px solid transparent",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      More Info
                    </motion.button>

                    <motion.button
                      onClick={handlePlayTrailer}
                      disabled={isFetchingTrailer}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)", boxShadow: "0 10px 25px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        padding: "12px 28px", 
                        borderRadius: "24px", 
                        backgroundColor: "rgba(255,255,255,0.08)", 
                        color: "#fff", 
                        fontSize: "11px", 
                        fontWeight: 900, 
                        textTransform: "uppercase", 
                        letterSpacing: "0.1em", 
                        cursor: isFetchingTrailer ? "wait" : "pointer", 
                        border: "1px solid rgba(255,255,255,0.2)", 
                        backdropFilter: "blur(12px)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                        transition: "all 0.2s ease" 
                      }}
                    >
                      {isFetchingTrailer ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "12px", height: "12px", border: "2px solid transparent", borderTopColor: "#fff", borderRadius: "50%" }} />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      )}
                      {isFetchingTrailer ? "Loading..." : "Trailer"}
                    </motion.button>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>

            <div style={{ position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)", maxWidth: "300px", zIndex: 10, display: "flex", flexDirection: "column", gap: "24px", pointerEvents: "none" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`reason-${wildcardMovie.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  style={{ padding: "24px", borderRadius: "24px", backgroundColor: "rgba(10, 6, 18, 0.55)", backdropFilter: "blur(24px)", border: "1px solid rgba(168, 85, 247, 0.25)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>AI Neural Match</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#fff", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
                    "{wildcardReason}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* ── ⚙️ FULL HORIZONTAL WIDE FOOTPRINT FEED SEGMENT ── */}
        {activeTab === "all" && !activeProvider && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "32px", marginTop: "16px", boxSizing: "border-box" }}>
            
            {[
              { title: "Curated Only for You", ref: curatedScrollRef, feed: curatedList },
              { title: "Trending Hollywood", ref: hollywoodScrollRef, feed: hollywoodFeed },
              { title: "Trending Bollywood", ref: bollywoodScrollRef, feed: bollywoodFeed },
              { title: "Trending Tollywood", ref: tollywoodScrollRef, feed: tollywoodFeed }
            ].map((carousel, idx) => (
              <div key={idx} style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingRight: "44px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em" }}>{carousel.title}</h3>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <motion.div 
                      onClick={() => carousel.ref.current?.scrollBy({ left: -320, behavior: "smooth" })} 
                      whileHover={{ scale: 1.08, backgroundColor: "rgba(168, 85, 247, 0.2)", borderColor: "rgba(192, 132, 252, 0.6)" }} 
                      style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </motion.div>
                    <motion.div 
                      onClick={() => carousel.ref.current?.scrollBy({ left: 300, behavior: "smooth" })} 
                      whileHover={{ scale: 1.08, backgroundColor: "rgba(168, 85, 247, 0.2)", borderColor: "rgba(192, 132, 252, 0.6)" }} 
                      style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </motion.div>
                  </div>
                </div>
                
                <div className="dobinge-carousel-viewport">
                  <div 
                    ref={carousel.ref} 
                    className="no-scrollbar dobinge-carousel-track"
                  >
                    {carousel.feed.map((movie, itemIdx) => (
                      <div key={`${idx}-${movie.id}-${itemIdx}`} className="dobinge-carousel-item">
                        <PremiumMediaCard 
                          media={movie as any}
                          onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie" })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </>
  );
}