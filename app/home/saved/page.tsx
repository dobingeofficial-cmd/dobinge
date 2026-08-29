"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import PremiumMediaCard from "@/components/ui/PremiumMediaCard";
import { useModal } from "@/context/ModalContext";

interface SavedMedia {
  media_id: number;
  interaction_type: "watchlist" | "liked" | "watched";
  media_data: any;
  created_at: string;
}

export default function SavedView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const { setSelectedMedia } = useModal();
  const supabase = useMemo(() => createClient(), []);

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

  const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";
  const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";

  // Parse JSON data safely
  const parseMedia = useCallback((raw: any) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      const firstPass = JSON.parse(raw);
      return typeof firstPass === "string" ? JSON.parse(firstPass) : firstPass;
    } catch {
      return null;
    }
  }, []);

  // Normalize action strings to valid tab keys
  const mapActionToTab = useCallback((action: string): "watchlist" | "liked" | "watched" => {
    const act = (action || "").toUpperCase();
    if (act.includes("LIKE") || act === "DOUBLETAP") return "liked";
    if (act.includes("WATCHED") || act === "WATCHED_NOT_LIKED") return "watched";
    return "watchlist";
  }, []);

  // Data healing pipeline
  const healDataPipeline = useCallback(async (rawData: any[]): Promise<SavedMedia[]> => {
    return rawData.map((d: any) => {
      const recoveredMedia = parseMedia(d.media_data || d.mediaData || d.media) || {
        id: d.media_id || d.id,
        title: "Metadata Unavailable",
        poster_path: null,
        media_type: d.media_type || "movie",
      };

      return {
        media_id: Number(d.media_id || d.id),
        interaction_type: mapActionToTab(d.action_type || d.interaction_type),
        media_data: recoveredMedia,
        created_at: d.created_at || new Date().toISOString(),
      };
    });
  }, [parseMedia, mapActionToTab]);

  // Hydrate vault data
  useEffect(() => {
    let isMounted = true;

    const cachedTab = localStorage.getItem("dobinge_vault_tab") as "watchlist" | "liked" | "watched";
    if (cachedTab && ["watchlist", "liked", "watched"].includes(cachedTab)) {
      setActiveTab(cachedTab);
    }

    const fetchVaultData = async () => {
      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser && isMounted) {
          setUser(currentUser);
          const { data, error } = await supabase
            .from("interactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (data && isMounted) {
            const healed = await healDataPipeline(data);
            setSavedItems(healed);
          }
        } else {
          const rawGuest = JSON.parse(localStorage.getItem("dobinge_guest") || '{"interactions":[]}');
          if (isMounted) {
            const healed = await healDataPipeline(rawGuest.interactions || []);
            setSavedItems(healed);
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
  }, [supabase, healDataPipeline]);

  // Live search handler
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
        const endpoint = proxyUrl
          ? `${proxyUrl}/api/search/multi?query=${encodeURIComponent(searchQuery)}&language=en-US`
          : `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbKey}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();
        
        if (isSearchMounted) {
          const valid = (data.results || []).filter((r: any) => r.media_type !== "person" && r.poster_path);
          setSearchResults(valid);
        }
      } catch (err) {
        console.warn("Search Uplink Failed:", err);
      } finally {
        if (isSearchMounted) setIsSearching(false);
      }
    }, 400);

    return () => {
      isSearchMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, proxyUrl, tmdbKey]);

  // Add item with atomic upsert
  const handleAddNewItem = async (media: any) => {
    const mediaType = media.media_type || (media.first_air_date ? "tv" : "movie");
    const mediaToSave = { ...media, media_type: mediaType };

    const newItem: SavedMedia = {
      media_id: mediaToSave.id,
      interaction_type: activeTab,
      media_data: mediaToSave,
      created_at: new Date().toISOString(),
    };

    const previousItems = [...savedItems];
    setSavedItems((prev) => [newItem, ...prev.filter((i) => !(i.media_id === newItem.media_id && i.interaction_type === activeTab))]);

    if (user) {
      let dbAction = "WATCHLIST";
      if (activeTab === "liked") dbAction = "WATCHED_LIKED";
      if (activeTab === "watched") dbAction = "WATCHED_NOT_LIKED";

      const { error } = await supabase.from("interactions").upsert(
        {
          user_id: user.id,
          media_id: mediaToSave.id,
          action_type: dbAction,
          media_type: mediaType,
          media_data: mediaToSave,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,media_id" }
      );

      if (error) {
        console.error("Vault Upsert Failed:", error.message);
        setSavedItems(previousItems);
      }
    } else {
      const storage = JSON.parse(localStorage.getItem("dobinge_guest") || '{"interactions":[]}');
      const filtered = (storage.interactions || []).filter((i: any) => !(i.media_id === newItem.media_id && i.interaction_type === activeTab));
      storage.interactions = [newItem, ...filtered];
      localStorage.setItem("dobinge_guest", JSON.stringify(storage));
    }
  };

  // Remove item handler
  const handleRemoveItem = async (mediaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedItems((prev) => prev.filter((item) => item.media_id !== mediaId || item.interaction_type !== activeTab));

    if (user) {
      await supabase.from("interactions").delete().eq("user_id", user.id).eq("media_id", mediaId);
    } else {
      const storage = JSON.parse(localStorage.getItem("dobinge_guest") || '{"interactions":[]}');
      storage.interactions = (storage.interactions || []).filter((i: any) => !(i.media_id === mediaId && i.interaction_type === activeTab));
      localStorage.setItem("dobinge_guest", JSON.stringify(storage));
    }
  };

  const currentTabData = savedItems.filter((item) => item.interaction_type === activeTab);
  const isAnime = (m: any) => m?.media_type === "tv" && (m?.original_language === "ja" || m?.origin_country?.includes("JP"));
  const isShow = (m: any) => m?.media_type === "tv" && !isAnime(m);
  const isMovie = (m: any) => m?.media_type === "movie" || !m?.media_type;

  const categorizedData = [
    { id: "movies", title: "Movies", items: currentTabData.filter((i) => isMovie(i.media_data)) },
    { id: "shows", title: "TV Shows", items: currentTabData.filter((i) => isShow(i.media_data)) },
    { id: "anime", title: "Anime", items: currentTabData.filter((i) => isAnime(i.media_data)) },
  ];

  return (
    <div className="w-full min-h-full px-6 pt-10 pb-24 flex flex-col relative box-border">
      {/* Header */}
      <div className="mb-8 relative z-10">
        <h1 className="text-3xl font-black text-white tracking-wider uppercase m-0">The Vault</h1>
        <p className="text-[11px] font-bold text-purple-400 tracking-widest uppercase m-0 mt-1">
          {savedItems.length} Items Synchronized
        </p>
      </div>

      {/* Control Bar */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4 z-10">
        <div className="flex gap-3">
          {(["watchlist", "liked", "watched"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsEditMode(false);
                localStorage.setItem("dobinge_vault_tab", tab);
              }}
              className={`px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-purple-500/20 border border-purple-400/40 text-white"
                  : "bg-transparent border border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab} ({savedItems.filter((i) => i.interaction_type === tab).length})
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={() => setIsAddModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-400/40 text-white text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            + Add
          </motion.button>
          <motion.button
            onClick={() => setIsEditMode(!isEditMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md border border-dashed transition-all ${
              isEditMode
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "bg-white/5 border-white/20 text-white/60 hover:text-white"
            }`}
          >
            {isEditMode ? "Done" : "Edit"}
          </motion.button>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : currentTabData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
          <span className="text-4xl mb-3">🗄️</span>
          <p className="text-xs font-bold uppercase tracking-widest text-white">This vault section is empty</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12 z-10">
          {categorizedData.map((category) => {
            if (category.items.length === 0) return null;
            const isExpanded = expandedSections[category.id];
            const displayItems = isExpanded ? category.items : category.items.slice(0, 7);

            return (
              <div key={category.id} className="flex flex-col gap-5">
                <div
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedSections((p) => ({ ...p, [category.id]: !p[category.id] }))}
                >
                  <h2 className="text-base font-extrabold text-white m-0">{category.title}</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  {category.items.length > 7 && (
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-white/60 text-xs">
                      ▼
                    </motion.div>
                  )}
                </div>

                <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-5">
                  <AnimatePresence>
                    {displayItems.map((item) => (
                      <motion.div
                        key={`${item.media_id}-${item.interaction_type}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative"
                      >
                        <PremiumMediaCard
                          media={item.media_data}
                          onClick={() => {
                            if (onSelectMedia) onSelectMedia(item.media_data);
                            if (!isEditMode) setSelectedMedia({ ...item.media_data, mediaType: item.media_data.media_type || "movie" });
                          }}
                        />
                        {isEditMode && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={(e) => handleRemoveItem(item.media_id, e)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-black z-20 shadow-lg text-white font-bold text-xs cursor-pointer"
                          >
                            ✕
                          </motion.button>
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

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl h-[80vh] max-h-[700px] bg-[#0a050f]/95 border border-purple-500/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-lg font-black text-white capitalize m-0">Add to {activeTab}</h2>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1 m-0">
                    TMDB Universal Catalog
                  </p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-white/50 hover:text-white text-lg">
                  ✕
                </button>
              </div>

              <div className="p-6 shrink-0">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search movies, shows, anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-400/30 text-white text-sm outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {isSearching ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-6 h-6 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-4">
                    {searchResults.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleAddNewItem(res)}
                        className="cursor-pointer hover:scale-105 transition-transform"
                      >
                        <PremiumMediaCard media={res} />
                      </div>
                    ))}
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