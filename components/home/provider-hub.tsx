"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

interface ProviderHubProps {
  activeProvider: any;
  setActiveProvider: (val: any) => void;
  setHoveredBackdrop: (path: string | null) => void;
  onSelectMedia: (media: any) => void;
  proxyUrl: string;
}

export default function ProviderHub({
  activeProvider,
  setActiveProvider,
  setHoveredBackdrop,
  onSelectMedia,
  proxyUrl
}: ProviderHubProps) {
  const [providerFeed, setProviderFeed] = useState<any>(null);
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const providerTrendingRef = useRef<HTMLDivElement>(null);
  const providerTopRatedRef = useRef<HTMLDivElement>(null);
  const providerRecentRef = useRef<HTMLDivElement>(null);

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

  return (
    <motion.div 
      key="provider-hub"
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
      className="no-scrollbar"
      style={{ width: "100%", height: "530px", overflowY: "auto", borderRadius: "32px", backgroundColor: "rgba(8,7,13, 0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(40px)", padding: "32px", boxSizing: "border-box" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }} onClick={() => setActiveProvider(null)} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", backdropFilter: "blur(10px)" }}>
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
                  <motion.div onClick={() => row.ref.current?.scrollBy({ left: -320, behavior: "smooth" })} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}>
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </motion.div>
                  <motion.div onClick={() => row.ref.current?.scrollBy({ left: 300, behavior: "smooth" })} whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }} style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.2s" }}>
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </motion.div>
                </div>
              </div>
              <div className="dobinge-carousel-viewport">
                <div ref={row.ref} className="no-scrollbar dobinge-carousel-track">
                  {row.data.slice(0, 10).map((movie: any) => (
                    <div 
                      key={`prov-${movie.id}`} 
                      className="dobinge-carousel-item"
                      onMouseEnter={() => setHoveredBackdrop(movie.backdrop_path)}
                      onMouseLeave={() => setHoveredBackdrop(null)}
                    >
                      <PremiumMediaCard media={movie} onClick={() => onSelectMedia({ ...movie, mediaType: movie.media_type || "movie", media_type: movie.media_type || "movie" })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}