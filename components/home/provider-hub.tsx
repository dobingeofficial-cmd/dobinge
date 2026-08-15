"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProviderHub({ activeProvider, setActiveProvider }: any) {
  if (!activeProvider) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col gap-6 p-6 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden" 
      style={{ backgroundColor: `${activeProvider.color}10` }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${activeProvider.color}, transparent 60%)` }} />
      
      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
            <img src={activeProvider.logo} alt={activeProvider.name} className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{activeProvider.name} Hub</h2>
        </div>
        <button 
          onClick={() => setActiveProvider(null)} 
          className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
        >
          Close Hub
        </button>
      </div>
      
      <div className="relative z-10 w-full h-[300px] flex items-center justify-center border border-white/5 rounded-2xl bg-black/20 backdrop-blur-sm mt-4">
        <p className="text-white/40 font-bold tracking-widest uppercase text-sm flex items-center gap-3">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full block" />
          Synchronizing Catalog
        </p>
      </div>
    </motion.div>
  );
}