"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

export default function ProviderHub({ activeProvider, setActiveProvider, setHoveredBackdrop, onSelectMedia, proxyUrl }: any) {
  const [providerMedia, setProviderMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeProvider || !proxyUrl) return;
    const fetchProviderData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${proxyUrl}/api/discover/movie?with_watch_providers=${activeProvider.id}&watch_region=IN&sort_by=popularity.desc`);
        const data = await res.json();
        setProviderMedia(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviderData();
  }, [activeProvider, proxyUrl]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <img src={activeProvider.logo} alt={activeProvider.name} className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Trending on {activeProvider.name}</h2>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Included with your subscription</p>
          </div>
        </div>
        <button onClick={() => setActiveProvider(null)} className="text-sm font-bold text-white/50 hover:text-white transition-colors">Close Provider</button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Scanning Catalog...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {providerMedia.map((media) => (
            <div key={`prov-${media.id}`} onMouseEnter={() => setHoveredBackdrop(media.backdrop_path)} onMouseLeave={() => setHoveredBackdrop(null)}>
              <PremiumMediaCard media={media} onClick={() => onSelectMedia({ ...media, mediaType: "movie" })} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}