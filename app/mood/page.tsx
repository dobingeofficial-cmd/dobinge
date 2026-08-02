"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getGuestData, saveGuestData } from "@/lib/store/guestStore";

const ALL_MOODS = [
  "Feeling Happy", "Feeling Sad", "Breakup", "Rainy Vibes", 
  "Weekend Binge", "Zombie Lover", "Plot Twist", "Comfort Watch", 
  "Sci-Fi", "Horror", "Crime", "Thriller", "Mystery", 
  "Romance", "Fantasy", "Anime Fan", "Feel Good", 
  "Mind Blowing", "Slow Burn"
];

export default function MoodPage() {
  const router = useRouter();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredMoods = useMemo(() => {
    return ALL_MOODS.filter((mood) => 
      mood.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) => 
      prev.includes(mood) 
        ? prev.filter((m) => m !== mood)
        : [...prev, mood]
    );
  };

  const handleConfirmVibes = async () => {
    if (selectedMoods.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const isExplicitGuest = typeof window !== "undefined" && localStorage.getItem("dobinge_guest_mode") === "true";
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && !isExplicitGuest) {
        // ── 1. AUTHENTICATED MODE ──
        const { data: existingPref } = await supabase.from("user_preferences").select("*").eq("user_id", session.user.id).single();

        await supabase.from("user_preferences").upsert({
          user_id: session.user.id,
          favorite_genres: existingPref?.favorite_genres || [],
          favorite_movies: existingPref?.favorite_movies || [],
          favorite_tv: existingPref?.favorite_tv || [],
          favorite_anime: existingPref?.favorite_anime || [],
          mood_preferences: selectedMoods,
          updated_at: new Date().toISOString()
        });
      } else {
        // ── 2. GUEST MODE ──
        const guestData = getGuestData();
        guestData.moods = selectedMoods;
        saveGuestData(guestData);
      }

      // ── 3. STRICT ROUTING TO PAGE 4 (Favorites) ──
      router.push("/favorites");

    } catch (err) {
      console.error("Vibe Synchronization Error:", err);
      router.push("/favorites"); // Fault tolerance
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", minHeight: "100vh", backgroundColor: "#040206", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px 120px", boxSizing: "border-box" }}>
      
      {/* ── AMBIENT NEON GLOW ── */}
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: "120%", height: "120%", background: "radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.08) 0%, rgba(4, 2, 6, 0) 70%)", pointerEvents: "none", zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
      >
        <h1 style={{ margin: "0 0 12px 0", fontSize: "32px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
          Set Your <span style={{ color: "#a855f7" }}>Frequency</span>
        </h1>
        <p style={{ margin: "0 0 32px 0", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          Select the moods and vibes you are currently resonating with.<br/>The neural engine will adapt your discovery feed instantly.
        </p>

        {/* ── LIQUID GLASS SEARCH BAR ── */}
        <div style={{ position: "relative", width: "100%", marginBottom: "40px" }}>
          <input 
            type="text"
            placeholder="Search vibes (e.g., Chill, Sci-Fi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "16px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", fontSize: "14px", fontWeight: 600, outline: "none", backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)", boxSizing: "border-box" }}
          />
          <svg style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* ── FLOATING MOOD MATRIX ── */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", width: "100%" }}>
          <AnimatePresence>
            {filteredMoods.map((mood, index) => {
              const isSelected = selectedMoods.includes(mood);
              const floatDelay = (index % 5) * 0.2;

              return (
                <motion.button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: floatDelay } }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "30px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.3s ease",
                    border: isSelected ? "1px solid rgba(168, 85, 247, 0.6)" : "1px solid rgba(255,255,255,0.08)",
                    background: isSelected 
                      ? "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.15) 100%)"
                      : "rgba(255,255,255,0.02)",
                    color: isSelected ? "#e9d5ff" : "rgba(255,255,255,0.6)",
                    boxShadow: isSelected ? "0 10px 25px rgba(168, 85, 247, 0.25)" : "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {mood}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── FLOATING ACTION BAR ── */}
      <AnimatePresence>
        {selectedMoods.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} style={{ position: "fixed", bottom: "40px", zIndex: 50, width: "100%", maxWidth: "300px", padding: "0 24px", boxSizing: "border-box" }}>
            <button
              onClick={handleConfirmVibes}
              disabled={isProcessing}
              style={{
                width: "100%", padding: "18px 0", borderRadius: "24px", border: "none", background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", color: "#ffffff", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isProcessing ? "not-allowed" : "pointer", boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"
              }}
            >
              {isProcessing ? "Calibrating..." : "Confirm Vibes"}
              {!isProcessing && <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}