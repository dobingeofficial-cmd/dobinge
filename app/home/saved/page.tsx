"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData } from "@/lib/store/guestStore";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";
import { useModal } from "@/context/ModalContext";

interface SavedMedia {
  media_id: number;
  interaction_type: string;
  media_data: any; 
  created_at: string;
}

export default function SavedView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const { setSelectedMedia } = useModal();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"watchlist" | "liked" | "watched">("watchlist");
  const [savedItems, setSavedItems] = useState<SavedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const proxyUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TMDB_PROXY_URL : "";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

  // ── 1. BULLETPROOF HYDRATION & HEALING ENGINE ──
  useEffect(() => {
    let isMounted = true; 
    
    const cachedTab = localStorage.getItem("dobinge_vault_tab");
    if (cachedTab === "watchlist" || cachedTab === "liked" || cachedTab === "watched") {
      setActiveTab(cachedTab);
    }

    const fetchVaultData = async () => {
      setLoading(true);
      
      try {
        const { data: { user: currentUser }, error: authErr } = await supabase.auth.getUser();
        if (authErr && authErr.status !== 400) throw authErr; // Ignore missing session warnings

        if (currentUser) {
          if (isMounted) setUser(currentUser);
          const { data, error: dbErr } = await supabase
            .from("interactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order('created_at', { ascending: false });
          
          if (dbErr) throw dbErr;

          if (data && isMounted) {
            const healedData = await healDataPipeline(data);
            setSavedItems(healedData as SavedMedia[]);
          }
        } else {
          const rawGuestData = JSON.parse(localStorage.getItem('dobinge_guest') || '{"interactions":[]}');
          const fallbackInteractions = rawGuestData?.interactions || [];
          if (isMounted) {
            const healedData = await healDataPipeline(fallbackInteractions);
            setSavedItems(healedData as SavedMedia[]);
          }
        }
      } catch (err) {
        console.error("Vault Pipeline Failure:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVaultData();
    return () => { isMounted = false; };
  }, []); // 🚨 FIX 1: Empty dependency array destroys the infinite render loop

  const handleTabChange = (tabId: "watchlist" | "liked" | "watched") => {
    setActiveTab(tabId);
    setIsEditMode(false);
    localStorage.setItem("dobinge_vault_tab", tabId); 
  };

  const parseMedia = (raw: any) => {
    if (!raw) return null;
    let parsed = raw;
    try {
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
    } catch (e) {
      return null;
    }
    return parsed;
  };

  const healDataPipeline = async (rawData: any[]) => {
    const healed = await Promise.all(rawData.map(async (d: any) => {
      let recoveredMedia = d.media_data || d.mediaData || d.media || null;
      recoveredMedia = parseMedia(recoveredMedia);
      
      const mediaId = d.media_id || d.mediaId || d.id;
      
      const rawAction = String(d.action_type || d.interaction_type || "watchlist").toUpperCase();
      let realTab = "watchlist";
      if (rawAction === "WATCHLIST" || rawAction === "DOWN") realTab = "watchlist";
      else if (rawAction === "WATCHED_LIKED" || rawAction === "LIKE" || rawAction === "DOUBLETAP" || rawAction === "LIKED") realTab = "liked";
      else realTab = "watched"; 

      if (!recoveredMedia && mediaId) {
        try {
          const endpoint = d.media_type === "tv" ? "tv" : "movie";
          if (proxyUrl) {
            let res = await fetch(`${proxyUrl}/api/${endpoint}/${mediaId}?language=en-US`);
            if (res.ok) recoveredMedia = { ...(await res.json()), media_type: d.media_type };
          }
          if (!recoveredMedia && tmdbKey) {
            let res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${mediaId}?api_key=${tmdbKey}`);
            if (res.ok) recoveredMedia = { ...(await res.json()), media_type: d.media_type };
          }
        } catch (e) {
          console.warn("Auto-heal skipped for", mediaId);
        }
      }

      if (!recoveredMedia) {
        recoveredMedia = { id: mediaId, title: "Data Recovering...", poster_path: null, media_type: d.media_type || "movie" };
      }

      return {
        ...d,
        media_data: recoveredMedia,
        media_id: mediaId,
        interaction_type: realTab,
        created_at: d.created_at || new Date().toISOString()
      };
    }));
    
    return healed;
  };

  // ── 2. LIVE SEARCH ENGINE (MODAL) ──
  useEffect(() => {
    let isSearchMounted = true;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (!isSearchMounted) return;
      setIsSearching(true);
      try {
        let res;
        // 🚨 FIX 2: Dynamic routing uses Proxy first to bypass local CORS and missing keys
        if (proxyUrl) {
          res = await fetch(`${proxyUrl}/api/search/multi?query=${encodeURIComponent(searchQuery)}&language=en-US`);
        } else if (tmdbKey) {
          res = await fetch(`${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbKey}`);
        } else {
          throw new Error("No TMDB routing available");
        }
        
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();
        
        const validResults = (data.results || []).filter((r: any) => r.media_type !== "person" && r.poster_path);
        if (isSearchMounted) setSearchResults(validResults);
      } catch (err) {
        console.warn("Search Uplink Failed:", err);
      } finally {
        if (isSearchMounted) setIsSearching(false);
      }
    }, 500);

    return () => {
      isSearchMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, tmdbKey, proxyUrl]);

  // ── 3. 5-TIER ADAPTIVE ADD ENGINE ──
  const handleAddNewItem = async (media: any) => {
    const mediaToSave = { ...media, media_type: media.media_type || (media.first_air_date ? "tv" : "movie") };
    
    const isDuplicate = savedItems.some(item => String(item.media_id) === String(mediaToSave.id) && item.interaction_type === activeTab);
    if (isDuplicate) return;

    const newItem: SavedMedia = {
      media_id: mediaToSave.id,
      interaction_type: activeTab,
      media_data: mediaToSave,
      created_at: new Date().toISOString()
    };

    const cleanMediaData = JSON.parse(JSON.stringify(mediaToSave));

    setSavedItems(prev => [newItem, ...prev.filter(item => !(String(item.media_id) === String(mediaToSave.id) && item.interaction_type === activeTab))]);

    if (user) {
      try {
        await supabase.from("interactions").delete().eq("user_id", user.id).eq("media_id", mediaToSave.id);

        let dbAction = "WATCHLIST";
        if (activeTab === "liked") dbAction = "WATCHED_LIKED";
        if (activeTab === "watched") dbAction = "WATCHED_NOT_LIKED";

        const { error } = await supabase.from("interactions").insert({
          user_id: user.id, 
          media_id: mediaToSave.id, 
          action_type: dbAction, 
          media_type: mediaToSave.media_type, 
          media_data: cleanMediaData 
        });

        if (error) {
          console.error("Supabase Save Rejected:", error.message, error.details);
          alert(`Vault Sync Failed: ${error.message}. Check your Supabase database schema or RLS policies.`);
          setSavedItems(prev => prev.filter(item => !(String(item.media_id) === String(mediaToSave.id) && item.interaction_type === activeTab)));
        }
      } catch (err) {
        console.error("Vault Engine Exception:", err);
      }
    } else {
      const currentStorage = JSON.parse(localStorage.getItem('dobinge_guest') || '{"interactions":[]}');
      currentStorage.interactions = currentStorage.interactions.filter((i: any) => !(String(i.media_id) === String(mediaToSave.id) && i.interaction_type === activeTab));
      currentStorage.interactions.unshift(newItem);
      localStorage.setItem('dobinge_guest', JSON.stringify(currentStorage));
    }
  };

  // ── 4. REMOVAL ENGINE ──
  const handleRemoveItem = async (mediaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedItems(prev => prev.filter(item => !(String(item.media_id) === String(mediaId) && item.interaction_type === activeTab)));

    if (user) {
      await supabase.from("interactions").delete().eq("user_id", user.id).eq("media_id", mediaId);
    } else {
      const currentStorage = JSON.parse(localStorage.getItem('dobinge_guest') || '{"interactions":[]}');
      currentStorage.interactions = currentStorage.interactions.filter((i: any) => !(String(i.media_id) === String(mediaId) && i.interaction_type === activeTab));
      localStorage.setItem('dobinge_guest', JSON.stringify(currentStorage));
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── 5. CATEGORIZATION LOGIC ──
  const currentTabData = savedItems.filter(item => item.interaction_type === activeTab);
  
  const isAnime = (media: any) => media?.media_type === "tv" && (media?.original_language === "ja" || media?.origin_country?.includes("JP"));
  const isShow = (media: any) => media?.media_type === "tv" && !isAnime(media);
  const isMovie = (media: any) => media?.media_type === "movie" || !media?.media_type;

  const categorizedData = [
    { id: "movies", title: "Movies", items: currentTabData.filter(i => isMovie(i.media_data)) },
    { id: "shows", title: "TV Shows", items: currentTabData.filter(i => isShow(i.media_data)) },
    { id: "anime", title: "Anime", items: currentTabData.filter(i => isAnime(i.media_data)) }
  ];

  const getTabCount = (type: string) => savedItems.filter(i => i.interaction_type === type).length;

  return (
    <div style={{ width: "100%", minHeight: "100%", padding: "40px 24px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative" }}>
      
      {/* ── THE VAULT HEADER ── */}
      <div style={{ marginBottom: "32px", position: "relative", zIndex: 10 }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          The Vault
        </h1>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(168, 85, 247, 0.8)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {savedItems.length} Items Hydrated
        </p>
      </div>

      {/* ── ALIGNED CONTROL BAR (TABS + ACTIONS) ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px", zIndex: 10 }}>
        
        {/* Left: Navigation Tabs */}
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { id: "watchlist", label: "Watchlist" },
            { id: "liked", label: "Liked" },
            { id: "watched", label: "History" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              style={{
                padding: "10px 20px",
                borderRadius: "24px",
                backgroundColor: activeTab === tab.id ? "rgba(168, 85, 247, 0.15)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(192, 132, 252, 0.4)" : "1px solid transparent",
                color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {tab.label} <span style={{ opacity: 0.6 }}>({getTabCount(tab.id)})</span>
            </button>
          ))}
        </div>

        {/* Right: Add & Remove Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <motion.button
            onClick={() => setIsAddModalOpen(true)}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "10px 20px", borderRadius: "24px", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(192, 132, 252, 0.4)",
              color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: "pointer", backdropFilter: "blur(10px)", boxShadow: "0 0 15px rgba(168, 85, 247, 0.15)"
            }}
          >
            + Add
          </motion.button>
          
          <motion.button
            onClick={() => setIsEditMode(!isEditMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "10px 20px", borderRadius: "24px", backgroundColor: isEditMode ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.04)",
              border: isEditMode ? "1px dashed rgba(239, 68, 68, 0.4)" : "1px dashed rgba(255,255,255,0.3)", color: isEditMode ? "#ef4444" : "rgba(255,255,255,0.6)",
              fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.3s ease"
            }}
          >
            {isEditMode ? "Done" : "Remove"}
          </motion.button>
        </div>
      </div>

      {/* ── CATEGORIZED GRID RENDERER ── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "24px", height: "24px", border: "2px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
        </div>
      ) : currentTabData.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
          <span style={{ fontSize: "48px", marginBottom: "16px" }}>🗄️</span>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>This vault section is empty</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "48px", zIndex: 10 }}>
          {categorizedData.map((category) => {
            if (category.items.length === 0) return null;
            
            const isExpanded = expandedSections[category.id];
            const needsExpand = category.items.length > 7;
            const displayItems = isExpanded ? category.items : category.items.slice(0, 7);

            return (
              <div key={category.id} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Section Header */}
                <div 
                  style={{ display: "flex", alignItems: "center", gap: "12px", cursor: needsExpand ? "pointer" : "default", userSelect: "none" }} 
                  onClick={() => needsExpand && toggleSection(category.id)}
                >
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                    {category.title}
                  </h2>
                  <div style={{ height: "1px", flex: 1, background: "linear-gradient(to right, rgba(255,255,255,0.1), transparent)" }} />
                  
                  {needsExpand && (
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </motion.div>
                  )}
                </div>

                {/* Section Grid */}
                <motion.div layout className="no-scrollbar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" }}>
                  <AnimatePresence>
                    {displayItems.map((item) => (
                      <motion.div 
                        key={`${item.media_id}-${item.interaction_type}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }} transition={{ duration: 0.25 }} style={{ position: "relative" }}
                      >
                        {item.media_data ? (
                          <PremiumMediaCard 
                            media={item.media_data} 
                            onClick={() => {
                              if (!isEditMode) setSelectedMedia({ ...item.media_data, mediaType: item.media_data.media_type || "movie" });
                            }} 
                          />
                        ) : null}
                        
                        {/* RED REMOVE OVERLAY BADGE */}
                        {isEditMode && (
                          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} onClick={(e: React.MouseEvent) => handleRemoveItem(item.media_id, e)} style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", backgroundColor: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 20, boxShadow: "0 4px 10px rgba(239, 68, 68, 0.5)", border: "2px solid #0a0612" }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M3 3l6 6M9 3L3 9"/></svg>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. LIQUID GLASS SEARCH & ADD MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: "relative", width: "100%", maxWidth: "600px", height: "80vh", maxHeight: "700px", backgroundColor: "rgba(10, 5, 15, 0.95)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "32px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }}>
              <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Add to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "rgba(168,85,247,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Query Cinematic Database</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "24px", cursor: "pointer", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#fff"} onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>✕</button>
              </div>

              <div style={{ padding: "24px", flexShrink: 0 }}>
                 <div style={{ position: "relative" }}>
                   <input autoFocus type="text" placeholder="Search movies, shows, anime..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "16px 20px 16px 52px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(192, 132, 252, 0.4)", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box", boxShadow: "inset 0 0 20px rgba(168, 85, 247, 0.05)", transition: "all 0.3s" }} onFocus={e => e.target.style.backgroundColor = "rgba(255,255,255,0.08)"} onBlur={e => e.target.style.backgroundColor = "rgba(255,255,255,0.04)"} />
                   <svg style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "rgba(192,132,252,0.8)" }} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 </div>
              </div>

              <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", boxSizing: "border-box" }}>
                 {isSearching ? (
                   <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                     <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "24px", height: "24px", border: "2px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
                   </div>
                 ) : searchResults.length > 0 ? (
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "16px" }}>
                     {searchResults.map((res) => {
                       const isAlreadyAdded = savedItems.some(item => String(item.media_id) === String(res.id) && item.interaction_type === activeTab);
                       return (
                         <motion.div key={res.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAddNewItem(res)} style={{ position: "relative", cursor: "pointer" }}>
                           <PremiumMediaCard media={res as any} />
                           {isAlreadyAdded ? (
                             <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(16, 185, 129, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px", zIndex: 20, backdropFilter: "blur(2px)" }}>
                               <div style={{ padding: "8px", borderRadius: "50%", backgroundColor: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                                 <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                               </div>
                             </div>
                           ) : (
                             <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(168, 85, 247, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", borderRadius: "20px", zIndex: 20 }} onMouseOver={e => e.currentTarget.style.opacity = "1"} onMouseOut={e => e.currentTarget.style.opacity = "0"}>
                               <div style={{ padding: "8px", borderRadius: "50%", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                                 <svg width="16" height="16" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round"><path d="M12 4v16m8-8H4"/></svg>
                               </div>
                             </div>
                           )}
                         </motion.div>
                       );
                     })}
                   </div>
                 ) : searchQuery ? (
                   <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>No signals found in neural core</div>
                 ) : (
                   <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "rgba(255,255,255,0.2)", gap: "12px" }}>
                     <span style={{ fontSize: "40px" }}>🔍</span>
                     <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Start typing to query database</span>
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}