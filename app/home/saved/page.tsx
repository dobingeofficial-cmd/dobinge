"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData } from "@/lib/store/guestStore";
import { useModal } from "@/context/ModalContext";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";

type VaultTab = "watchlist" | "favorites" | "history";

// 🚨 FIXED: Strongly typed and moved outside for 60FPS performance 🚨
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function TheVault() {
  const [activeTab, setActiveTab] = useState<VaultTab>("watchlist");
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setSelectedMedia } = useModal();
  const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "https://api.themoviedb.org/3";
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

  useEffect(() => {
    const fetchVaultData = async () => {
      setIsLoading(true);
      setMediaItems([]);

      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        let rawInteractions: any[] = [];

        if (authData?.user) {
          // Authenticated: Pull from Supabase
          const { data, error } = await supabase
            .from("interactions")
            .select("*")
            .eq("user_id", authData.user.id);
          
          if (!error && data) rawInteractions = data;
        } else {
          // Guest: Pull from Local Storage
          rawInteractions = getGuestData().interactions || [];
        }

        // Filter based on active tab
        const filteredIds = rawInteractions.filter((item: any) => {
          if (activeTab === "watchlist") return item.action_type === "WATCHLIST";
          if (activeTab === "favorites") return item.action_type === "WATCHED_LIKED";
          if (activeTab === "history") return item.action_type === "WATCHED_NOT_LIKED" || item.action_type === "WATCHED";
          return false;
        });

        // 🚨 ZERO-BUDGET OPTIMIZATION: Batch fetching TMDB data via Promise.all 🚨
        const fetchedMedia = await Promise.all(
          filteredIds.map(async (item: any) => {
            const endpoint = item.media_type === "tv" ? "tv" : "movie";
            const res = await fetch(`${proxyUrl}/${endpoint}/${item.media_id}?api_key=${tmdbKey}`);
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, media_type: item.media_type };
          })
        );

        setMediaItems(fetchedMedia.filter((m) => m !== null).reverse());
      } catch (error) {
        console.error("Vault Memory Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultData();
  }, [activeTab, proxyUrl, tmdbKey]);

  return (
    <div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      
      {/* ── 🌌 AMBIENT VAULT GLOW ── */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "60vw", height: "400px",
        background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(8,7,13,0) 70%)",
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0
      }} />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* ── HEADER & TABS ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", marginTop: "16px" }}>
          <h1 style={{ margin: 0, fontSize: "40px", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", textShadow: "0 4px 20px rgba(168, 85, 247, 0.4)" }}>
            The Vault
          </h1>

          <div style={{ 
            display: "flex", gap: "8px", padding: "6px", borderRadius: "32px", 
            backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)"
          }}>
            {[
              { id: "watchlist", label: "Watchlist", icon: "↓" },
              { id: "favorites", label: "Favorites", icon: "♥" },
              { id: "history", label: "History", icon: "✓" }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VaultTab)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "10px 24px", borderRadius: "24px", border: "none", outline: "none",
                  display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
                  fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
                  backgroundColor: activeTab === tab.id ? "rgba(168, 85, 247, 0.15)" : "transparent",
                  color: activeTab === tab.id ? "#E9D5FF" : "rgba(255,255,255,0.4)",
                  boxShadow: activeTab === tab.id ? "inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(168,85,247,0.2)" : "none",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <span style={{ color: activeTab === tab.id ? "#c084fc" : "inherit" }}>{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── MEDIA GRID ── */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: "16px" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#a855f7", borderRadius: "50%" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Decrypting Vault...</span>
          </div>
        ) : mediaItems.length > 0 ? (
          <motion.div 
            variants={containerVariants} initial="hidden" animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "24px" }}
          >
            {mediaItems.map((item) => (
              <motion.div key={item.id} variants={itemVariants}>
                <PremiumMediaCard media={item} onClick={() => setSelectedMedia({ id: item.id, mediaType: item.media_type })} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
              height: "40vh", gap: "16px", padding: "40px", borderRadius: "32px",
              backgroundColor: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)" 
            }}
          >
            <span style={{ fontSize: "48px", filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}>
              {activeTab === "watchlist" ? "📭" : activeTab === "favorites" ? "💔" : "👁️‍🗨️"}
            </span>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                Nothing here yet
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                Head over to the Swipe Engine to discover new titles.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}