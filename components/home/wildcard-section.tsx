"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WildcardSectionProps {
  wildcardMovie: any;
  wildcardReason: string;
  isWildcardTransitioning: boolean;
  handleSurpriseMe: (e?: React.MouseEvent) => void;
  onSelectMedia: (media: any) => void;
  getBackdropUrl: (path: string | null) => string;
  proxyUrl: string;
}

export default function WildcardSection({
  wildcardMovie,
  wildcardReason,
  isWildcardTransitioning,
  handleSurpriseMe,
  onSelectMedia,
  getBackdropUrl,
  proxyUrl
}: WildcardSectionProps) {
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!wildcardMovie || !wildcardMovie.id) {
        setLogoUrl(null);
        return;
      }
      
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const type = wildcardMovie.media_type || (wildcardMovie.first_air_date ? "tv" : "movie");
      
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${wildcardMovie.id}/images?api_key=${apiKey}`);
        if (!res.ok) return setLogoUrl(null);
        
        const data = await res.json();
        const logos = data.logos || [];
        const englishLogo = logos.find((l: any) => l.iso_639_1 === "en") || logos[0];
        
        if (englishLogo?.file_path) {
          setLogoUrl(`https://image.tmdb.org/t/p/w500${englishLogo.file_path}`);
        } else {
          setLogoUrl(null);
        }
      } catch (error) {
        setLogoUrl(null);
      }
    };

    fetchLogo();
  }, [wildcardMovie]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", width: "100%", height: "75vh", minHeight: "500px", marginTop: "48px", marginBottom: "16px", borderRadius: "32px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8)", backgroundColor: "#000000" }}
    >
      <AnimatePresence>
        {isPlayingTrailer && trailerKey && (
          <motion.div key="trailer-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, zIndex: 100, backgroundColor: "#000" }}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&modestbranding=1`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ objectFit: "cover", width: "100%", height: "100%", border: "none" }} />
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPlayingTrailer(false); setTrailerKey(null); }} style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", zIndex: 110, transition: "background-color 0.2s", pointerEvents: "auto" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.5)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)"}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={`bg-${wildcardMovie.id}`} initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }} transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} style={{ position: "absolute", inset: 0 }}>
          <img src={getBackdropUrl(wildcardMovie.backdrop_path)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
        </motion.div>
      </AnimatePresence>

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 40%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, transparent 40%, transparent 60%, rgba(0, 0, 0, 0.8) 100%)", pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: "32px", left: "32px", display: "flex", alignItems: "center", gap: "10px", zIndex: 10, pointerEvents: "none" }}>
        <span style={{ fontSize: "24px" }}>🎲</span>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>Tonight's Wildcard</h3>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em" }}>Global Cinema Pick</p>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
        <motion.button
          onClick={handleSurpriseMe} disabled={isWildcardTransitioning} whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)" }} whileTap={{ scale: 0.95 }}
          style={{ padding: "16px 36px", borderRadius: "40px", backgroundColor: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(192, 132, 252, 0.4)", backdropFilter: "blur(20px)", color: "#fff", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", cursor: isWildcardTransitioning ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)", transition: "background-color 0.3s ease", pointerEvents: "auto" }}
        >
          {isWildcardTransitioning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "16px", height: "16px", border: "2px solid transparent", borderTopColor: "#fff", borderRadius: "50%" }} /> : <span style={{ fontSize: "16px" }}>🎲</span>}
          {isWildcardTransitioning ? "Calibrating..." : "Surprise Me"}
        </motion.button>
      </div>

      <div style={{ position: "absolute", bottom: "32px", left: "32px", maxWidth: "60%", zIndex: 30, pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div key={`meta-${wildcardMovie.id}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.6, delay: 0.2 }}>
            
            <AnimatePresence mode="wait">
              {logoUrl ? (
                <motion.img 
                  key="logo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  src={logoUrl} 
                  alt={wildcardMovie.title || wildcardMovie.name} 
                  style={{ maxWidth: "450px", maxHeight: "140px", objectFit: "contain", marginBottom: "16px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))", transformOrigin: "left bottom" }} 
                />
              ) : (
                <motion.h2 
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, margin: "0 0 16px 0", lineHeight: 1.05, color: "#ffffff", textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.6)", letterSpacing: "-0.03em" }}
                >
                  {wildcardMovie.title || wildcardMovie.name}
                </motion.h2>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700 }}>{wildcardMovie.release_date?.split("-")[0] || wildcardMovie.first_air_date?.split("-")[0] || "2026"}</span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>★ {wildcardMovie.vote_average?.toFixed(1) || "NR"}</span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>{wildcardMovie.media_type === "tv" || wildcardMovie.first_air_date ? "Series" : "Movie"}</span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "90%" }}>{wildcardMovie.overview}</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px", pointerEvents: "auto", position: "relative", zIndex: 50 }}>
              <motion.button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectMedia?.({ ...wildcardMovie, mediaType: wildcardMovie.media_type || (wildcardMovie.first_air_date ? "tv" : "movie") }); }} whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }} whileTap={{ scale: 0.95 }} style={{ padding: "12px 28px", borderRadius: "24px", backgroundColor: "#fff", color: "#000", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", border: "1px solid transparent", boxShadow: "0 8px 20px rgba(0,0,0,0.5)", transition: "all 0.2s ease" }}>More Info</motion.button>
              <motion.button onClick={handlePlayTrailer} disabled={isFetchingTrailer} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)", boxShadow: "0 10px 25px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)" }} whileTap={{ scale: 0.95 }} style={{ padding: "12px 28px", borderRadius: "24px", backgroundColor: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isFetchingTrailer ? "wait" : "pointer", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.3)", transition: "all 0.2s ease" }}>
                {isFetchingTrailer ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "12px", height: "12px", border: "2px solid transparent", borderTopColor: "#fff", borderRadius: "50%" }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                {isFetchingTrailer ? "Loading..." : "Trailer"}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)", maxWidth: "300px", zIndex: 10, display: "flex", flexDirection: "column", gap: "24px", pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div key={`reason-${wildcardMovie.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.6, delay: 0.4 }} style={{ padding: "24px", borderRadius: "24px", backgroundColor: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(24px)", border: "1px solid rgba(168, 85, 247, 0.25)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>AI Neural Match</span>
            </div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#fff", lineHeight: 1.6, letterSpacing: "-0.01em" }}>"{wildcardReason}"</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}