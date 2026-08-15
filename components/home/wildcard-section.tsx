"use client";

import React from "react";
import { motion } from "framer-motion";

export default function WildcardSection({ wildcardMovie, wildcardReason, handleSurpriseMe, getBackdropUrl }: any) {
  if (!wildcardMovie) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full rounded-3xl overflow-hidden border border-white/10 relative h-[320px] flex items-center p-8 md:p-12 shadow-2xl"
    >
       <img src={getBackdropUrl(wildcardMovie.backdrop_path)} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" />
       <div className="absolute inset-0 bg-gradient-to-r from-[#08070D] via-[#08070D]/80 to-transparent w-[80%]" />
       
       <div className="relative z-10 flex flex-col gap-4 max-w-2xl">
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-pulse" />
           <span className="text-[#c084fc] font-bold text-[10px] tracking-widest uppercase">DoBinge AI Surprise Pick</span>
         </div>
         
         <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
           {wildcardMovie.title || wildcardMovie.name}
         </h2>
         
         <p className="text-white/60 text-sm leading-relaxed max-w-lg font-medium">
           {wildcardReason}
         </p>
         
         <button 
           onClick={handleSurpriseMe} 
           className="mt-4 w-fit px-8 py-3.5 rounded-full bg-white text-black font-black text-xs tracking-wider uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
         >
           Roll Again
         </button>
       </div>
    </motion.div>
  );
}