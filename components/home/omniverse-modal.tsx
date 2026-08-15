"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

export default function OmniverseModal({ context, filter, region, onClose, onFilterChange, onRegionChange, onSelectMedia, filteredData }: any) {
  if (!context) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[5000] bg-[#08070D]/90 backdrop-blur-xl flex flex-col"
      >
        <header className="w-full flex items-center justify-between p-6 border-b border-white/10 bg-[#08070D]/80 sticky top-0 z-50">
          <div>
            <h2 className="text-2xl font-black text-white">{context.title}</h2>
            <p className="text-xs font-bold text-[#c084fc] uppercase tracking-widest mt-1">Full Omniverse View</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredData.map((media: any) => (
              <PremiumMediaCard key={`omni-${media.id}`} media={media} onClick={() => onSelectMedia({ ...media, mediaType: media.media_type || "movie" })} />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}