"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// UNIFIED PROVIDER SYSTEM IMPORTS
import { useProviderAction } from "@/hooks/useProviderAction";
import ProviderSelector from "@/components/ui/provider-selector";

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
  // MOUNT EXISTING ACTION SYSTEM
  const { resolveAction, showSelector, providers, handleSelectProvider, setShowSelector } = useProviderAction();

  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const resolveMetadata = async () => {
      if (!wildcardMovie?.id || !proxyUrl) {
        setLogoUrl(null);
        setLogoFailed(false);
        return;
      }

      setLogoFailed(false);
      const mediaType = wildcardMovie.media_type || (wildcardMovie.first_air_date ? "tv" : "movie");

      // 🚀 LEGACY WATCH LINK PROVIDER FETCH REMOVED HERE 🚀

      try {
        const res = await fetch(`${proxyUrl}/api/${mediaType}/${wildcardMovie.id}/images`);
        if (!res.ok) throw new Error("Proxy logo lookup failed");
        
        const data = await res.json();
        const englishLogo = data.logos?.find((l: any) => l.iso_639_1 === 'en');
        const bestLogo = englishLogo || data.logos?.[0];

        if (isSubscribed) {
          if (bestLogo?.file_path) {
            setLogoUrl(`${proxyUrl}/image/t/p/w500${bestLogo.file_path}`);
          } else {
            setLogoUrl(null);
          }
        }
      } catch (err) {
        if (isSubscribed) setLogoUrl(null);
      }
    };

    resolveMetadata();
    return () => { isSubscribed = false; };
  }, [wildcardMovie?.id, wildcardMovie?.media_type, wildcardMovie?.first_air_date, proxyUrl]);

  const handlePlayTrailer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!wildcardMovie || !proxyUrl) return;
    setIsFetchingTrailer(true);

    try {
      const res = await fetch(`${proxyUrl}/api/movie/${wildcardMovie.id}/videos`);
      if (!res.ok) throw new Error("Edge Response Error");
      const data = await res.json();

      const trailer =
        data.results?.find((vid: any) => vid.type === "Trailer" && vid.site === "YouTube") ||
        data.results?.find((vid: any) => vid.site === "YouTube");

      if (trailer?.key) {
        setTrailerKey(trailer.key);
        setIsPlayingTrailer(true);
      }
    } catch (error) {
      console.error("Trailer Fetch Fault:", error);
    } finally {
      setIsFetchingTrailer(false);
    }
  };

  const titleString = wildcardMovie?.title || wildcardMovie?.name || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        width: "100%",
        height: "75vh",
        minHeight: "520px",
        marginTop: "48px",
        marginBottom: "16px",
        borderRadius: "32px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.9)",
        backgroundColor: "#000000"
      }}
    >
      <AnimatePresence>
        {isPlayingTrailer && trailerKey && (
          <motion.div
            key="trailer-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, zIndex: 100, backgroundColor: "#000000" }}
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
                position: "absolute",
                top: "24px",
                right: "24px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(12px)",
                zIndex: 110
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${wildcardMovie?.id}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          <img
            src={getBackdropUrl(wildcardMovie?.backdrop_path)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%", opacity: 0.75 }}
          />
        </motion.div>
      </AnimatePresence>

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.85) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.5) 45%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0, 0, 0, 0.9) 0%, transparent 50%, rgba(0, 0, 0, 0.9) 100%)", pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: "32px", left: "32px", display: "flex", alignItems: "center", gap: "10px", zIndex: 10, pointerEvents: "none" }}>
        <span style={{ fontSize: "22px" }}>🎲</span>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 900, letterSpacing: "-0.02em", color: "#ffffff" }}>Tonight's Wildcard</h3>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.15em" }}>Global Cinema Pick</p>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
        <motion.button
          onClick={handleSurpriseMe}
          disabled={isWildcardTransitioning}
          whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(168, 85, 247, 0.45)" }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: "14px 32px",
            borderRadius: "40px",
            backgroundColor: "rgba(168, 85, 247, 0.15)",
            border: "1px solid rgba(192, 132, 252, 0.4)",
            backdropFilter: "blur(20px)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            cursor: isWildcardTransitioning ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)",
            pointerEvents: "auto"
          }}
        >
          {isWildcardTransitioning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "14px", height: "14px", border: "2px solid transparent", borderTopColor: "#ffffff", borderRadius: "50%" }} />
          ) : (
            <span style={{ fontSize: "15px" }}>🎲</span>
          )}
          {isWildcardTransitioning ? "Calibrating..." : "Surprise Me"}
        </motion.button>
      </div>

      <div style={{ position: "absolute", bottom: "32px", left: "32px", maxWidth: "60%", zIndex: 30, pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`meta-${wildcardMovie?.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "16px" }}>
              {logoUrl && !logoFailed ? (
                <motion.img
                  key={`logo-${wildcardMovie?.id}`}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={logoUrl}
                  alt={titleString}
                  onError={() => setLogoFailed(true)}
                  style={{
                    maxWidth: "400px",
                    maxHeight: "120px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.95))",
                    transformOrigin: "left bottom"
                  }}
                />
              ) : (
                <motion.h2
                  key={`fallback-${wildcardMovie?.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: "clamp(24px, 3vw, 36px)", 
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1.1,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                    textTransform: "uppercase",
                    textShadow: "0 4px 20px rgba(0,0,0,0.9)" 
                  }}
                >
                  {titleString}
                </motion.h2>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700 }}>
                {wildcardMovie?.release_date?.split("-")[0] || wildcardMovie?.first_air_date?.split("-")[0] || "2026"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                ★ {wildcardMovie?.vote_average?.toFixed(1) || "NR"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                {wildcardMovie?.media_type === "tv" || wildcardMovie?.first_air_date ? "Series" : "Movie"}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "90%" }}>
              {wildcardMovie?.overview}
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", pointerEvents: "auto", position: "relative", zIndex: 50 }}>
              
              {/* 🚀 CENTRALIZED USE PROVIDER ACTION TRIGGER 🚀 */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resolveAction(
  wildcardMovie.id, 
  wildcardMovie.media_type === "tv" || wildcardMovie.first_air_date ? "tv" : "movie",
  wildcardMovie.title || wildcardMovie.name || ""
);
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "12px 28px",
                  borderRadius: "24px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontSize: "11px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.5)"
                }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                Play Now
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectMedia?.({ ...wildcardMovie, mediaType: wildcardMovie?.media_type || (wildcardMovie?.first_air_date ? "tv" : "movie") });
                }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "12px 28px",
                  borderRadius: "24px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
                }}
              >
                More Info
              </motion.button>
              <motion.button
                onClick={handlePlayTrailer}
                disabled={isFetchingTrailer}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  cursor: isFetchingTrailer ? "wait" : "pointer",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(12px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
                }}
              >
                {isFetchingTrailer ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "12px", height: "12px", border: "2px solid transparent", borderTopColor: "#ffffff", borderRadius: "50%" }} />
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)", maxWidth: "300px", zIndex: 10, display: "flex", flexDirection: "column", gap: "24px", pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`reason-${wildcardMovie?.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              padding: "24px",
              borderRadius: "24px",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.7)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.15em" }}>AI Neural Match</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#ffffff", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
              "{wildcardReason}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🚀 EXPLICIT PROVIDER MODAL MOUNT 🚀 */}
      <AnimatePresence>
        {showSelector && (
          <ProviderSelector 
            providers={providers} 
            onSelect={handleSelectProvider} 
            onClose={() => setShowSelector(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}