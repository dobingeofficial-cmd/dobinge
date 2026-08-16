"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; 
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

import OmniverseModal from "@/components/home/omniverse-modal";
import MoodSidebar from "@/components/home/mood-sidebar";
import ProviderHub from "@/components/home/provider-hub";
import WildcardSection from "@/components/home/wildcard-section";

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
  original_language?: string; 
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
  { name: "Netflix", id: 8, color: "#E50914", logo: "/platforms/netflix.png.png" },
  { name: "Prime Video", id: 119, color: "#00A8E1", logo: "/platforms/prime-video.png.png" },
  { name: "Disney+", id: 337, color: "#113CCF", logo: "/platforms/disney.png.png" },
  { name: "Apple TV+", id: 350, color: "#FFFFFF", logo: "/platforms/apple-tv.png.png" },
  { name: "Max", id: 1883, color: "#002BE7", logo: "/platforms/max.png.png" },
  { name: "Hulu", id: 15, color: "#1CE783", logo: "/platforms/hulu.png.png" },
  { name: "Crunchyroll", id: 283, color: "#F47521", logo: "/platforms/crunchyroll.png.png" },
  { name: "Paramount+", id: 531, color: "#0064FF", logo: "/platforms/paramount.png.png" },
  { name: "Peacock", id: 384, color: "#FFFFFF", logo: "/platforms/peacock.png.png" },
  { name: "JioCinema", id: 220, color: "#E31837", logo: "/platforms/jiocinema.png.png" },
  { name: "MUBI", id: 11, color: "#000000", logo: "/platforms/mubi.png.png" }
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

  const [wildcardMovie, setWildcardMovie] = useState<MovieItem | null>(null);
  const [wildcardReason, setWildcardReason] = useState("");
  const [wildcardMoviePool, setWildcardMoviePool] = useState<MovieItem[]>([]);
  const [isWildcardTransitioning, setIsWildcardTransitioning] = useState(false);
  
  const [viewAllContext, setViewAllContext] = useState<{ title: string; data: MovieItem[] } | null>(null);
  const [viewAllFilter, setViewAllFilter] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [viewAllRegion, setViewAllRegion] = useState<"all" | "in" | "en" | "ja" | "ko">("all");

  const [hoveredBackdrop, setHoveredBackdrop] = useState<string | null>(null);

  const proxyUrl: string = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";

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
    if (trendingGlobal.length === 0 || activeTab !== "all" || activeProvider || viewAllContext) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trendingGlobal.length, 9));
    }, 7000);
    return () => clearInterval(interval);
  }, [trendingGlobal, activeTab, activeProvider, viewAllContext]);

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

  const getFilteredOmniverse = () => {
    if (!viewAllContext) return [];
    return viewAllContext.data.filter(item => {
      const isAnime = item.original_language === "ja" && (item.genre_ids?.includes(16) || item.media_type === "tv");
      
      let typeMatch = true;
      if (viewAllFilter === "movie") typeMatch = item.media_type === "movie" && !isAnime;
      if (viewAllFilter === "tv") typeMatch = item.media_type === "tv" && !isAnime;
      if (viewAllFilter === "anime") typeMatch = isAnime;

      let regionMatch = true;
      const lang = item.original_language || "en";
      if (viewAllRegion === "in") regionMatch = ["hi", "te", "ta", "ml", "kn", "bn"].includes(lang);
      if (viewAllRegion === "en") regionMatch = lang === "en";
      if (viewAllRegion === "ja") regionMatch = lang === "ja";
      if (viewAllRegion === "ko") regionMatch = lang === "ko";

      return typeMatch && regionMatch;
    });
  };

  const filteredOmniverse = getFilteredOmniverse();

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

  const getGridHook = (title: string, idx: number) => {
    const hooks = {
      "Curated Only for You": ["Based on your recent binge history", "Because you added Sci-Fi to your watchlist", "98% Neural Match", "Because you liked Interstellar"],
      "Trending Hollywood": ["Global Top 1% this week", "Because you follow Christopher Nolan", "Trending among users with your taste", "Critically acclaimed blockbuster"],
      "Trending Bollywood": ["Because you watched Jawan", "Top grossing in your region", "Highly rated Action Drama", "Based on your interest in Hindi Cinema"],
      "Trending Tollywood": ["Because you liked RRR", "South Indian Blockbuster", "High-octane action pick", "Trending pan-India"]
    };
    return (hooks as any)[title]?.[idx] || "Curated by DoBinge AI Engine";
  };

  const activeAmbilight = hoveredBackdrop || currentHero?.backdrop_path;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none", overflow: "hidden", backgroundColor: "transparent" }}>
        <AnimatePresence>
          {activeAmbilight && (
            <motion.img
              key={activeAmbilight}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              src={getBackdropUrl(activeAmbilight)}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(120px) saturate(120%)",
                transform: "scale(1.2)",
                willChange: "opacity, transform"
              }}
            />
          )}
        </AnimatePresence>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #08070D 85%)" }} />
      </div>

      <style>{`
        .dobinge-carousel-viewport {
          position: relative;
          width: 100%;
        }
        
        .dobinge-carousel-track {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-behavior: smooth;
          margin-top: -16px;
          margin-bottom: -32px;
          padding-top: 16px;
          padding-bottom: 32px;
        }

        .dobinge-carousel-item {
          flex: 0 0 auto;
          width: calc((100% - (20px * 4)) / 5);
        }
        
        @media (max-width: 1440px) { .dobinge-carousel-item { width: calc((100% - (20px * 3)) / 4.2); } }
        @media (max-width: 1024px) { .dobinge-carousel-item { width: calc((100% - (20px * 2)) / 3.2); } }
        @media (max-width: 768px) { .dobinge-carousel-item { width: calc((100% - (20px * 1)) / 2.2); } }
        @media (max-width: 640px) { .dobinge-carousel-item { width: calc((100% - (20px * 0)) / 1.5); } }
      `}</style>

      {viewAllContext && (
        <OmniverseModal
          context={viewAllContext as any}
          filter={viewAllFilter}
          region={viewAllRegion}
          onClose={() => { setViewAllContext(null); setViewAllFilter("all"); setViewAllRegion("all"); }}
          onFilterChange={setViewAllFilter}
          onRegionChange={setViewAllRegion}
          onSelectMedia={(media: any) => onSelectMedia?.(media)}
          filteredData={filteredOmniverse as any}
        />
      )}

      {!viewAllContext && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          
          {/* 🚨 TIGHTENED GAP TO 20px HERE 🚨 */}
          <div style={{ width: "100%", display: "flex", gap: "20px", boxSizing: "border-box", alignItems: "flex-start" }}>

            <MoodSidebar 
              sortedMoods={sortedMoods}
              selectedMood={selectedMood}
              handleMoodSelect={handleMoodSelect}
              featuredMoodBg={featuredMoodBg}
              aiMatchPercent={aiMatchPercent}
              getTitleCount={getTitleCount}
              getBackdropUrl={getBackdropUrl}
            />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.6)", alignItems: "center" }}>
                  {[
                    { id: "all", label: "All" },
                    { id: "movies", label: "Movies" },
                    { id: "shows", label: "TV Shows" },
                    { id: "anime", label: "Anime" }
                  ].map((tab) => (
                    <motion.span 
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as any); setSelectedMood(sortedMoods[0]); setActiveProvider(null); setViewAllContext(null); }} 
                      whileHover={{ scale: 1.05, y: -2, backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)", boxShadow: "0 4px 15px rgba(168, 85, 247, 0.2)" }}
                      whileTap={{ scale: 0.95 }}
                      style={{ padding: "6px 16px", backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent", borderRadius: "20px", color: activeTab === tab.id ? "#ffffff" : "rgba(255,255,255,0.6)", cursor: "pointer", transition: "color 0.2s ease, background-color 0.2s ease, font-weight 0.2s ease", boxShadow: activeTab === tab.id ? "0 4px 15px rgba(168, 85, 247, 0.15)" : "none", fontWeight: activeTab === tab.id ? 800 : 600 }}
                    >
                      {tab.label}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  onClick={() => router.push('/discover')}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(192, 132, 252, 0.4)", boxShadow: "0 4px 20px rgba(168, 85, 247, 0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: "280px", height: "38px", borderRadius: "20px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s ease" }}
                >
                  <svg width="15" height="15" style={{ minWidth: "15px", minHeight: "15px" }} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.02em" }}>Eg, Something similar to Interstellar</span>
                </motion.div>
              </div>

              <div style={{ width: "100%", position: "relative" }}>
                <AnimatePresence mode="wait">
                  {activeTab === "all" ? (
                    <motion.div key="content-all" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeInOut" }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      
                      {activeProvider ? (
                        <ProviderHub 
                          activeProvider={activeProvider}
                          setActiveProvider={setActiveProvider}
                          setHoveredBackdrop={setHoveredBackdrop}
                          onSelectMedia={(media: any) => onSelectMedia?.(media)}
                          proxyUrl={proxyUrl}
                        />
                      ) : (
                        <>
                          <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                            <div style={{ width: "100%", height: isMoodActive ? "560px" : "420px", position: "relative", perspective: "1000px", transition: "height 0.6s cubic-bezier(0.25, 1, 0.5, 1)" }}>
                              <AnimatePresence mode="wait">
                                {!isMoodActive && currentHero ? (
                                  <motion.div 
                                    key={`hero-${currentHero.id}`}
                                    initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)", zIndex: -1 }} transition={{ duration: 0.8, ease: "easeInOut" }}
                                    style={{ width: "100%", height: "100%", position: "absolute", inset: 0, borderRadius: "32px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.04)", boxShadow: "0 30px 60px rgba(0, 0, 0, 0.5)" }}
                                  >
                                    <img src={getBackdropUrl(currentHero.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,7,13,0.95) 0%, rgba(8,7,13,0.6) 40%, transparent 100%)", pointerEvents: "none" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,7,13,0.95) 0%, transparent 50%)", pointerEvents: "none" }} />

                                    <div style={{ position: "absolute", bottom: "40px", left: "40px", maxWidth: "600px", pointerEvents: "none", zIndex: 30, display: "flex", flexDirection: "column", gap: "12px" }}>
                                      {activeLogo ? (
                                        <img src={getPosterUrl(activeLogo)} alt={currentHero.title || currentHero.name} style={{ width: "auto", height: "auto", maxWidth: "60%", maxHeight: "85px", objectFit: "contain", objectPosition: "left bottom", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))" }} />
                                      ) : (
                                        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", lineHeight: "1.1", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>{currentHero.title || currentHero.name}</h2>
                                      )}

                                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textShadow: "0 2px 10px rgba(0,0,0,0.8)", marginTop: "4px" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{currentHero.release_date?.split("-")[0] || currentHero.first_air_date?.split("-")[0] || "2026"}</span>
                                        <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>{currentHero.vote_average?.toFixed(1) || "NR"}</span>
                                        <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>{primaryGenre}</span>
                                      </div>
                                      
                                      <p style={{ margin: "4px 0 16px 0", fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{currentHero.overview}</p>
                                      
                                      <div style={{ display: "flex", gap: "12px", pointerEvents: "auto" }}>
                                        <motion.button onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert("This media could not be located directly on your streaming platforms. (External routing coming soon)"); }} whileHover={{ scale: 1.05, backgroundColor: "#ffffff" }} whileTap={{ scale: 0.95 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "30px", backgroundColor: "#e2e8f0", color: "#000", fontSize: "13px", fontWeight: 800, cursor: "pointer", border: "none", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", transition: "background-color 0.2s" }}>
                                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg> Play
                                        </motion.button>
                                        <motion.button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectMedia?.({ ...currentHero, mediaType: currentHero.media_type || "movie", media_type: currentHero.media_type || "movie" }); }} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.95 }} style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </motion.button>
                                      </div>
                                    </div>
                                    
                                    <div style={{ position: "absolute", bottom: "40px", right: "40px", display: "flex", gap: "8px", zIndex: 30, pointerEvents: "auto", alignItems: "center" }}>
                                      {trendingGlobal.slice(0, 9).map((_, idx) => (
                                        <motion.div key={idx} onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }} animate={{ width: idx === heroIndex ? 24 : 8, backgroundColor: idx === heroIndex ? "#ffffff" : "rgba(255,255,255,0.3)" }} transition={{ duration: 0.3 }} style={{ height: "8px", borderRadius: "4px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.5)" }} />
                                      ))}
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div key="mood-grid" initial={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.99, filter: "blur(8px)" }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }} className="no-scrollbar" style={{ width: "100%", height: "100%", overflowY: "auto", position: "absolute", inset: 0, backgroundColor: "transparent", boxSizing: "border-box", paddingBottom: "24px" }}>
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
                                            <div
                                              key={`grid-${movie.id}-${idx}`}
                                              onMouseEnter={() => setHoveredBackdrop(movie.backdrop_path)}
                                              onMouseLeave={() => setHoveredBackdrop(null)}
                                            >
                                              <PremiumMediaCard media={movie as any} onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie" })} />
                                            </div>
                                          ))}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", paddingBottom: "32px" }}>
                                          <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.25)" }} whileTap={{ scale: 0.95 }} onClick={() => setMoodPage(prev => prev + 1)} disabled={isMoodLoading} style={{ padding: "14px 36px", borderRadius: "30px", border: "1px solid rgba(192, 132, 252, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", backdropFilter: "blur(12px)", boxShadow: "0 10px 20px rgba(168, 85, 247, 0.2)", transition: "all 0.2s" }}>
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
                                  <motion.div onClick={() => scrollProviderLeft()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}><svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></motion.div>
                                  <motion.div onClick={() => scrollProviderRight()} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}><svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></motion.div>
                                </div>
                              </div>
                              
                              <div className="dobinge-carousel-viewport">
                                <div ref={providerScrollRef} className="no-scrollbar dobinge-carousel-track">
                                  {PLATFORMS.map((platform) => (
                                    <motion.div 
                                      key={platform.id} whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }} onClick={() => setActiveProvider(platform)}
                                      style={{ width: "160px", height: "64px", flexShrink: 0, borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "0 12px", gap: "12px", cursor: "pointer", backdropFilter: "blur(10px)", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}
                                    >
                                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", flexShrink: 0, boxShadow: `0 4px 10px ${platform.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={platform.logo} alt={platform.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(0.85)" }} />
                                      </div>
                                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{platform.name}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key={`placeholder-${activeTab}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeInOut" }} style={{ width: "100%", height: "420px", borderRadius: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8, 7, 13, 0.6)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                      <span style={{ fontSize: "48px", marginBottom: "16px", filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))" }}>{activeTab === "movies" ? "🎬" : activeTab === "shows" ? "📺" : "⚔️"}</span>
                      <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{activeTab === "movies" ? "Movies" : activeTab === "shows" ? "TV Shows" : "Anime"} Hub</h2>
                      <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Under Construction by DoBinge AI Engine</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {activeTab === "all" && !activeProvider && !viewAllContext && wildcardMovie && (
            <WildcardSection 
              wildcardMovie={wildcardMovie}
              wildcardReason={wildcardReason}
              isWildcardTransitioning={isWildcardTransitioning}
              handleSurpriseMe={handleSurpriseMe}
              onSelectMedia={(media: any) => onSelectMedia?.(media)}
              getBackdropUrl={getBackdropUrl}
              proxyUrl={proxyUrl}
            />
          )}

          {activeTab === "all" && !activeProvider && !viewAllContext && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "56px", marginTop: "32px", boxSizing: "border-box" }}>
              
              {[
                { title: "Curated Only for You", ref: curatedScrollRef, feed: curatedList },
                { title: "Trending Hollywood", ref: hollywoodScrollRef, feed: hollywoodFeed },
                { title: "Trending Bollywood", ref: bollywoodScrollRef, feed: bollywoodFeed },
                { title: "Trending Tollywood", ref: tollywoodScrollRef, feed: tollywoodFeed }
              ].map((carousel, idx) => (
                <div key={idx} style={{ width: "100%" }}>
                  
                  <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em" }}>{carousel.title}</h3>
                    <motion.span 
                      onClick={() => setViewAllContext({ title: carousel.title, data: carousel.feed })}
                      whileHover={{ color: "#c084fc", textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
                      style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s" }}
                    >
                      View All
                    </motion.span>
                    
                    <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                      <div onClick={() => carousel.ref.current?.scrollBy({ left: -320, behavior: "smooth" })} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "background-color 0.2s" }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </div>
                      <div onClick={() => carousel.ref.current?.scrollBy({ left: 300, behavior: "smooth" })} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "background-color 0.2s" }}>
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dobinge-carousel-viewport">
                    <div ref={carousel.ref} className="no-scrollbar dobinge-carousel-track">
                      {carousel.feed.slice(0, 10).map((movie, itemIdx) => (
                        <div 
                          key={`h-${idx}-${movie.id}-${itemIdx}`} 
                          className="dobinge-carousel-item"
                          onMouseEnter={() => setHoveredBackdrop(movie.backdrop_path)}
                          onMouseLeave={() => setHoveredBackdrop(null)}
                        >
                          <PremiumMediaCard media={movie as any} onClick={() => onSelectMedia?.({ ...movie, mediaType: movie.media_type || "movie" })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {carousel.feed.slice(10, 14).length === 4 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", marginTop: "16px" }}>
                      {carousel.feed.slice(10, 14).map((gridMovie, gridIdx) => (
                        <motion.div 
                          key={`vibe-${idx}-${gridMovie.id}`}
                          whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}
                          onClick={() => onSelectMedia?.({ ...gridMovie, mediaType: gridMovie.media_type || "movie" })}
                          onMouseEnter={() => setHoveredBackdrop(gridMovie.backdrop_path)}
                          onMouseLeave={() => setHoveredBackdrop(null)}
                          style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#08070D" }}
                        >
                          <img src={getBackdropUrl(gridMovie.backdrop_path)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,7,13,0.95) 0%, rgba(8,7,13,0.5) 50%, transparent 100%)" }} />
                          
                          <div style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(192, 132, 252, 0.4)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>{99 - gridIdx}% Match</span>
                          </div>

                          <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                              {getGridHook(carousel.title, gridIdx)}
                            </span>
                            <h4 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {gridMovie.title || gridMovie.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {gridMovie.overview}
                            </p>
                          </div>

                          <div style={{ position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="#fff"/></svg>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}