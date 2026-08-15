"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function HomeView() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="w-full flex flex-col xl:flex-row gap-8 xl:gap-12 pb-20">
      
      {/* ── LEFT SIDEBAR: MOOD MATRIX ── */}
      <div className="w-full xl:w-[320px] flex flex-col flex-shrink-0 gap-6">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">What's Your Mood?</h2>

        {/* 1. Main Highlight Mood */}
        <motion.div 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="relative w-full h-[180px] rounded-3xl p-6 flex flex-col justify-end cursor-pointer overflow-hidden border border-[#a855f7]/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-[#120a1c]"
        >
          {/* Subtle gradient overlay */}
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

        {/* 2. Secondary Mood List */}
        <div className="flex flex-col gap-3">
          {[
            { title: "Happy", sub: "Feel-Good • Comedy", emoji: "😊", count: "1.5K titles" },
            { title: "Sad", sub: "Emotional • Heartfelt", emoji: "😭", count: "3.3K titles" },
            { title: "Angry", sub: "Intense • Action Thriller", emoji: "😡", count: "1.5K titles" },
            { title: "Stressed", sub: "Lighthearted • Comfort", emoji: "😨", count: "3.8K titles" },
          ].map((mood, idx) => (
            <motion.div 
              key={idx} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }} whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-white/5 bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl drop-shadow-md">{mood.emoji}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white leading-tight">{mood.title}</span>
                  <span className="text-[10px] font-semibold text-white/40 tracking-wide mt-0.5">{mood.sub}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 tracking-wider">
                  {mood.count}
                </span>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── RIGHT MAIN CONTENT: DISCOVERY ENGINE ── */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        
        {/* Top Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {["All", "Movies", "TV Shows", "Anime"].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                  activeFilter === filter 
                  ? "bg-white/10 text-white border border-white/20 shadow-lg" 
                  : "bg-transparent text-white/40 hover:text-white/70 border border-transparent"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-[320px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Eg. Something similar to Interstellar"
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white placeholder-white/30 outline-none focus:border-[#a855f7]/50 focus:bg-white/10 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* HERO SECTION (SILO REPLICA) */}
        <div className="relative w-full h-[460px] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] group cursor-pointer">
          {/* Background Image Setup (Using a cinematic placeholder styling to match the vibe) */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: "url('https://image.tmdb.org/t/p/original/1zN0hZ5k5kO0pIivBfK6Vz0bAUK.jpg')" }} // SILO TMDB Backdrop
          />
          
          {/* Obsidian Gradients for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08070D] via-[#08070D]/80 to-transparent w-[70%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08070D] via-[#08070D]/40 to-transparent h-full" />

          {/* Hero Content Base */}
          <div className="absolute bottom-0 left-0 p-10 md:p-12 w-full md:w-[65%] flex flex-col items-start z-10">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
              S I L O
            </h1>
            
            <div className="flex items-center gap-4 text-xs font-bold tracking-wider text-white/70 mb-4">
              <span className="flex items-center gap-1.5"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> 2023</span>
              <span className="text-[#eab308] flex items-center gap-1.5"><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> 8.2</span>
              <span className="flex items-center gap-1.5"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg> Sci-Fi & Fantasy</span>
            </div>

            <p className="text-sm font-medium text-white/50 leading-relaxed max-w-xl mb-8 line-clamp-3">
              In a ruined and toxic future, thousands live in a giant silo deep underground. After its sheriff breaks a cardinal rule and residents die mysteriously, engineer Juliette starts to uncover shocking secrets and the truth about the silo.
            </p>

            <div className="flex items-center gap-4">
              <button className="h-12 px-8 bg-white text-black rounded-full font-black text-sm tracking-wide flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"></path></svg> Play
              </button>
              <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 z-10">
            <div className="w-6 h-1.5 rounded-full bg-white"></div>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
            ))}
          </div>
        </div>

        {/* STREAMING PLATFORMS GRID */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white tracking-wide">Watch on Streaming Platforms</h3>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Platform Placeholder Cards (Styled with Tailwind to look like the brands) */}
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-black text-white">
              <span className="text-red-600 text-xl tracking-tighter">N</span> Netflix
            </div>
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-black text-white text-sm">
              <span className="text-[#00a8e1]">prime video</span>
            </div>
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-black text-white">
              <span className="text-blue-500 text-xl tracking-tighter">D+</span> Disney+
            </div>
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-bold text-white text-sm tracking-tight">
               tv+
            </div>
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-black text-white text-sm tracking-widest">
              <span className="bg-white text-[#002be7] px-2 py-0.5 rounded-md">MAX</span>
            </div>
            <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors gap-2 font-black text-[#1ce783]">
              hulu
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}