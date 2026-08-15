"use client";
import React from "react";
import { motion } from "framer-motion";

export default function MoodSidebar({ sortedMoods, selectedMood, handleMoodSelect, featuredMoodBg, aiMatchPercent, getTitleCount, getBackdropUrl }: any) {
  if (!sortedMoods || sortedMoods.length === 0) return null;

  return (
    <div className="w-full xl:w-[320px] flex flex-col flex-shrink-0 gap-6">
      <h2 className="text-2xl font-black text-white tracking-tight mb-2">What's Your Mood?</h2>

      <motion.div 
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => handleMoodSelect(sortedMoods[0])}
        className="relative w-full h-[180px] rounded-3xl p-6 flex flex-col justify-end cursor-pointer overflow-hidden border transition-colors"
        style={{
          borderColor: selectedMood.id === sortedMoods[0].id ? "rgba(168, 85, 247, 0.6)" : "rgba(168, 85, 247, 0.2)",
          backgroundColor: "#120a1c",
          boxShadow: selectedMood.id === sortedMoods[0].id ? "0 0 30px rgba(168,85,247,0.2)" : "none"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#a855f7]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1e1133] border border-[#a855f7]/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <span className="text-[#c084fc] text-xl">{sortedMoods[0].emoji}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white leading-tight">{sortedMoods[0].id}</h3>
            <p className="text-[10px] font-bold text-[#c084fc] uppercase tracking-wider mt-1">{sortedMoods[0].subtitle}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3">
        {sortedMoods.slice(1, 5).map((mood: any, idx: number) => (
          <motion.div 
            key={idx} 
            onClick={() => handleMoodSelect(mood)}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }} whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer border transition-colors"
            style={{
              borderColor: selectedMood.id === mood.id ? "rgba(168, 85, 247, 0.4)" : "rgba(255,255,255,0.05)",
              backgroundColor: selectedMood.id === mood.id ? "rgba(168, 85, 247, 0.05)" : "rgba(255,255,255,0.02)"
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl drop-shadow-md">{mood.emoji}</span>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white leading-tight">{mood.id}</span>
                <span className="text-[10px] font-semibold text-white/40 tracking-wide mt-0.5">{mood.subtitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 tracking-wider">
                {getTitleCount(mood.id)}
              </span>
              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}