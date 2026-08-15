"use client";

import React from "react";
import { motion } from "framer-motion";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

export default function OmniverseModal({ context, onClose, onSelectMedia, filteredData }: any) {
  if (!context) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className="w-full flex flex-col gap-6 bg-[#08070D] rounded-3xl p-6 md:p-8 border border-white/10 relative z-20"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{context.title}</h2>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
        {filteredData?.map((item: any, idx: number) => (
          <div key={`omni-${item.id}-${idx}`}>
            <PremiumMediaCard media={item} onClick={() => onSelectMedia(item)} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}