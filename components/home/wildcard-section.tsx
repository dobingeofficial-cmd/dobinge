"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WildcardSection({ wildcardMovie, wildcardReason, isWildcardTransitioning, handleSurpriseMe, onSelectMedia, getBackdropUrl }: any) {
  if (!wildcardMovie) return null;

  return (
    <div className="w-full mt-12 mb-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-[#c084fc]">✨</span> Surprise Me
          </h3>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">AI Wildcard Pick</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }}
          onClick={handleSurpriseMe} disabled={isWildcardTransitioning}
          className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-black tracking-wide text-white hover:border-[#c084fc]/50 transition-all flex items-center gap-2"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Reroll Engine
        </motion.button>
      </div>

      <div className="relative w-full h-[320px] rounded-[32px] overflow-hidden border border-[#c084fc]/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] group bg-[#08070D]">
        <AnimatePresence mode="wait">
          {!isWildcardTransitioning && (
            <motion.div key={wildcardMovie.id} initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(10px)" }} className="absolute inset-0 cursor-pointer" onClick={() => onSelectMedia(wildcardMovie)}>
              <img src={getBackdropUrl(wildcardMovie.backdrop_path)} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08070D] via-[#08070D]/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                <span className="inline-block px-3 py-1 rounded-md bg-[#c084fc]/20 border border-[#c084fc]/50 text-[#c084fc] text-[10px] font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)]">{wildcardReason}</span>
                <h4 className="text-4xl md:text-5xl font-black text-white mb-3 text-shadow-xl">{wildcardMovie.title || wildcardMovie.name}</h4>
                <p className="text-sm text-white/60 font-medium line-clamp-2 md:line-clamp-3">{wildcardMovie.overview}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}