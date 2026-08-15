"use client";

import React from "react";
import { motion } from "framer-motion";

export default function MoodSidebar({ sortedMoods, selectedMood, handleMoodSelect, getTitleCount }: any) {
  if (!sortedMoods || sortedMoods.length === 0) return null;

  return (
    <div className="w-full xl:w-[320px] flex flex-col flex-shrink-0 gap-6 relative z-10">
      <h2 className="text-2xl font-black text-white tracking-tight mb-2">What's Your Mood?</h2>
      
      {/* ── HIGHLIGHT: ALL MOOD ── */}
      <motion.div
        onClick={() => handleMoodSelect(sortedMoods.find((m: any) => m.id === "All") || sortedMoods[0])}
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="relative w-full h-[180px] rounded-3xl p-6 flex flex-col justify-end cursor-pointer overflow-hidden border border-[#a855f7]/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-[#120a1c]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#a855f7]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1e1133] border border-[#a855f7]/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <span className="text-[#c084fc] text-xl">✨</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white leading-tight">All</h3>
            <p className="text-[10px] font-bold text-[#c084fc] uppercase tracking-wider mt-1">The Complete DoBinge Multiverse</p>
          </div>
        </div>
      </motion.div>

      {/* ── SECONDARY MOODS ── */}
      <div className="flex flex-col gap-3">
        {sortedMoods.filter((m: any) => m.id !== "All").slice(0, 4).map((mood: any, idx: number) => {
          const isActive = selectedMood?.id === mood.id;
          return (
            <motion.div
              key={idx}
              onClick={() => handleMoodSelect(mood)}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }} 
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer border transition-colors"
              style={{
                borderColor: isActive ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.05)",
                backgroundColor: isActive ? "rgba(168, 85, 247, 0.1)" : "rgba(255, 255, 255, 0.02)"
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
                  {getTitleCount ? getTitleCount(mood.id) : "1.5K titles"}
                </span>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}