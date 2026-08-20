"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData } from "@/lib/store/guestStore";
import PremiumMediaCard, { TMDBMedia } from "@/components/ui/PremiumMediaCard";
import AuthModal from "@/components/ui/auth-modal";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  ai_tagline: string;
  favorite_genres: string[];
  favorite_platforms: string[];
  binge_personality: string;
  hours_watched: number;
}

interface ProfileStats {
  watched: number;
  liked: number;
  watchlist: number;
  hours: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ProfileView({ onSelectMedia }: { onSelectMedia?: (media: any) => void }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ watched: 0, liked: 0, watchlist: 0, hours: 0 });
  const [recentHistory, setRecentHistory] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [dynamicGenres, setDynamicGenres] = useState<string[]>([]);
  const [dynamicPlatforms, setDynamicPlatforms] = useState<string[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", username: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 1. HYDRATE PROFILE & STATS ──
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        
        let { data: profileData } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        
        if (!profileData) {
          const newProfile = {
            id: currentUser.id,
            display_name: currentUser.user_metadata?.full_name || "Anonymous",
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            username: `user_${Math.floor(Math.random() * 100000)}`
          };
          const { data: inserted } = await supabase.from("profiles").insert(newProfile).select().single();
          profileData = inserted;
        }
        
        setProfile(profileData as UserProfile);
        setEditForm({
          display_name: profileData.display_name || "",
          username: profileData.username || "",
          bio: profileData.bio || ""
        });
        setAvatarPreview(profileData.avatar_url);

        const { data: prefData } = await supabase.from("user_preferences").select("mood_preferences").eq("user_id", currentUser.id).single();
        const fetchedMoods = prefData?.mood_preferences || [];
        setDynamicGenres(fetchedMoods.length > 0 ? fetchedMoods : (profileData.favorite_genres || []));
        
        const { data: interactions } = await supabase.from("interactions").select("media_id, interaction_type").eq("user_id", currentUser.id);
        
        if (interactions) {
          const watchedIds = interactions.filter(i => i.interaction_type === "watched").map(i => i.media_id);
          setStats({
            watched: watchedIds.length,
            liked: interactions.filter(i => i.interaction_type === "liked").length,
            watchlist: interactions.filter(i => i.interaction_type === "watchlist").length,
            hours: profileData.hours_watched || (watchedIds.length * 2.2)
          });

          if (watchedIds.length > 0) {
            fetchTMDBHistory(watchedIds.slice(-10));
          } else {
            setDynamicPlatforms(["Netflix", "Prime Video"]); 
          }
        }
      } else {
        const guestData = getGuestData();
        setStats({
          watched: guestData.interactions.filter(i => i.interaction_type === "watched").length,
          liked: guestData.interactions.filter(i => i.interaction_type === "liked").length,
          watchlist: guestData.interactions.filter(i => i.interaction_type === "watchlist").length,
          hours: Math.floor(guestData.interactions.filter(i => i.interaction_type === "watched").length * 2.2)
        });
        
        setDynamicGenres(guestData.moods.length > 0 ? guestData.moods : ["Sci-Fi", "Thriller"]);
        
        const watchedIds = guestData.interactions.filter(i => i.interaction_type === "watched").map(i => i.media_id);
        if (watchedIds.length > 0) {
          fetchTMDBHistory(watchedIds.slice(-10));
        } else {
          setDynamicPlatforms(["Netflix", "Prime Video", "Apple TV+"]);
        }
      }
      setLoading(false);
    };

    fetchProfileData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthModalOpen(false);
        fetchProfileData(); 
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const fetchTMDBHistory = async (ids: number[]) => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey || ids.length === 0) return;
    
    try {
      const promises = ids.map(id => fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=watch/providers`).then(res => res.json()));
      const results = await Promise.all(promises);
      
      const validResults = results.filter(r => r.poster_path).map(r => ({ ...r, media_type: "movie" }));
      setRecentHistory(validResults);

      const providerCounts: Record<string, number> = {};
      results.forEach(r => {
        const usProviders = r['watch/providers']?.results?.US?.flatrate || [];
        usProviders.forEach((p: any) => {
          const name = p.provider_name;
          providerCounts[name] = (providerCounts[name] || 0) + 1;
        });
      });

      const sortedPlatforms = Object.entries(providerCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 4);

      setDynamicPlatforms(sortedPlatforms.length > 0 ? sortedPlatforms : ["Netflix", "Prime Video"]);

    } catch (e) {
      console.error("TMDB History Fetch Failed", e);
    }
  };

  // ── 2. REAL-TIME USERNAME VALIDATION ──
  useEffect(() => {
    const checkUsername = async () => {
      const val = editForm.username.toLowerCase();
      if (!val) return setUsernameStatus("idle");
      
      if (!/^[a-z0-9_.]{3,20}$/.test(val)) {
        return setUsernameStatus("invalid");
      }

      if (val === profile?.username?.toLowerCase()) {
        return setUsernameStatus("available");
      }

      setUsernameStatus("checking");
      const { data } = await supabase.from("profiles").select("id").eq("username", val).single();
      
      if (data) {
        setUsernameStatus("taken");
        setUsernameSuggestions([`${val}1`, `${val}_ai`, `${val}007`]);
      } else {
        setUsernameStatus("available");
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [editForm.username]);

  // ── 3. SAVE PROFILE HANDLER ──
  const handleSaveProfile = async () => {
    if (!user || usernameStatus === "taken" || usernameStatus === "invalid") return;
    setIsSaving(true);

    try {
      let finalAvatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          finalAvatarUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from("profiles").update({
        display_name: editForm.display_name,
        username: editForm.username.toLowerCase(),
        bio: editForm.bio,
        avatar_url: finalAvatarUrl
      }).eq("id", user.id);

      if (!error) {
        setProfile((prev) => prev ? { 
          ...prev, 
          display_name: editForm.display_name, 
          username: editForm.username.toLowerCase(), 
          bio: editForm.bio, 
          avatar_url: finalAvatarUrl 
        } : null);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.reload();
  };

  const displayProfile = profile || {
    display_name: "Guest Cinephile",
    username: "guest_user",
    avatar_url: null,
    bio: "Exploring the cinematic universe one frame at a time.",
    ai_tagline: "Mystery Thriller Enthusiast",
    binge_personality: "🌌 The Cosmic Explorer",
    favorite_genres: ["Sci-Fi", "Thriller"],
    favorite_platforms: ["Netflix", "Prime Video", "Apple TV+"]
  };

  return (
    <div style={{ width: "100%", minHeight: "100%", padding: "60px 32px 120px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", backgroundColor: "#000000" }}>
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "500px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ width: "100%", maxWidth: "800px", zIndex: 10, display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {loading ? (
          <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "24px", height: "24px", border: "2px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%" }} />
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* ── 1. PROFILE HEADER ── */}
            <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
              
              {/* Glowing Avatar Ring */}
              <div style={{ position: "relative", width: "120px", height: "120px", borderRadius: "50%", border: "2px solid #a855f7", boxShadow: "0 0 20px rgba(168,85,247,0.3), inset 0 0 20px rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,5,15,0.8)", backdropFilter: "blur(10px)" }}>
                {displayProfile.avatar_url ? (
                  <img src={displayProfile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                )}
              </div>

              {/* Identity */}
              <div style={{ marginTop: "8px" }}>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{displayProfile.display_name}</h1>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#c084fc", letterSpacing: "0.05em" }}>@{displayProfile.username}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>•</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{displayProfile.ai_tagline}</span>
                </div>
              </div>

              {displayProfile.bio && (
                <p style={{ margin: "4px 0", maxWidth: "450px", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                  {displayProfile.bio}
                </p>
              )}

              {/* Edit/Auth Button */}
              {user ? (
                <motion.button type="button" onClick={() => setIsEditModalOpen(true)} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.95 }} style={{ marginTop: "8px", padding: "10px 24px", borderRadius: "24px", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.3s" }}>
                  Sign In To Edit Profile
                </motion.button>
              ) : (
                <motion.button type="button" onClick={(e) => { e.preventDefault(); setIsAuthModalOpen(true); }} whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.95 }} style={{ marginTop: "8px", padding: "10px 24px", borderRadius: "24px", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.3s" }}>
                  Sign In To Edit Profile
                </motion.button>
              )}
            </motion.div>

            {/* ── 2. STATS GRID ── */}
            <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", width: "100%" }}>
              {[
                { label: "Watched", value: stats.watched, color: "#c084fc" },
                { label: "Hours", value: stats.hours.toFixed(1), color: "#10b981" },
                { label: "Liked", value: stats.liked, color: "#ec4899" },
                { label: "Watchlist", value: stats.watchlist, color: "#3b82f6" }
              ].map((stat, idx) => (
                <div key={idx} style={{ padding: "24px 16px", borderRadius: "24px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", backdropFilter: "blur(20px)" }}>
                  <span style={{ fontSize: "28px", fontWeight: 900, color: stat.color, filter: `drop-shadow(0 0 12px ${stat.color}50)`, lineHeight: 1 }}>{stat.value}</span>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* ── 3. AI TASTE PANELS ── */}
            <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "16px", width: "100%" }}>
              {/* Trait Panel */}
              <div style={{ padding: "24px", borderRadius: "24px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "140px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Signature Trait</span>
                <div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "12px" }}>
                    🌌
                  </div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>The Cosmic Explorer</h3>
                </div>
              </div>
              
              {/* AI Taste Panel */}
              <div style={{ padding: "24px", borderRadius: "24px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "140px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.15em" }}>AI Taste Profile</span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                  "You enjoy emotionally driven science fiction with psychological twists and high cinematic tension. Your choices lean towards critically acclaimed masterpieces."
                </p>
              </div>
            </motion.div>

            {/* ── 4. CHIPS (GENRES & PLATFORMS) ── */}
            <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", width: "100px", flexShrink: 0 }}>Top Genres</span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  {dynamicGenres.slice(0, 5).map(g => (
                    <span key={g} style={{ padding: "8px 18px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                      {g}
                    </span>
                  ))}
                  <button type="button" onClick={() => setIsEditModalOpen(true)} style={{ padding: "8px 18px", borderRadius: "20px", backgroundColor: "transparent", border: "1px dashed rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    + Add More
                  </button>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", width: "100px", flexShrink: 0 }}>Platforms</span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {dynamicPlatforms.map((p, index) => (
                    <span key={p} style={{ padding: "8px 18px", borderRadius: "20px", backgroundColor: index === 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)", border: index === 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255,255,255,0.05)", fontSize: "12px", fontWeight: 700, color: index === 0 ? "#4ade80" : "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                      {index === 0 && <span>🏆</span>}
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── 5. ACHIEVEMENTS ── */}
            <motion.div variants={itemVariants} style={{ marginTop: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Achievements</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { icon: "🏆", name: "First 10" },
                  { icon: "🍿", name: "Weekend Binger" },
                  { icon: "👻", name: "Night Owl" }
                ].map((ach, i) => (
                  <div key={i} style={{ padding: "10px 20px", borderRadius: "24px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>{ach.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{ach.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── 6. SETTINGS MENUS ── */}
            <motion.div variants={itemVariants} style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Settings", "Privacy", "Notifications"].map(btn => (
                <button type="button" key={btn} style={{ width: "100%", padding: "20px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", fontWeight: 700, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}>
                  {btn} <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </motion.div>

            {/* ── 7. PRIMARY AUTH ACTION ── */}
            <motion.div variants={itemVariants} style={{ marginTop: "16px" }}>
              {user ? (
                <motion.button type="button" onClick={handleSignOut} disabled={isSigningOut} whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.4)" }} style={{ width: "100%", padding: "20px 24px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#ef4444", fontSize: "14px", fontWeight: 800, textAlign: "center", cursor: isSigningOut ? "wait" : "pointer", transition: "all 0.2s" }}>
                  {isSigningOut ? "Disconnecting..." : "Sign Out"}
                </motion.button>
              ) : (
                <motion.button type="button" onClick={(e) => { e.preventDefault(); setIsAuthModalOpen(true); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "20px 24px", borderRadius: "20px", background: "#a855f7", color: "#fff", fontSize: "14px", fontWeight: 800, textAlign: "center", cursor: "pointer", border: "none", boxShadow: "0 10px 30px rgba(168,85,247,0.2)" }}>
                  Sign In / Create Account
                </motion.button>
              )}
            </motion.div>

          </motion.div>
        )}
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: "relative", width: "100%", maxWidth: "440px", backgroundColor: "rgba(10, 5, 15, 0.95)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "32px", padding: "32px", boxSizing: "border-box", backdropFilter: "blur(40px)", boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>Edit Profile</h2>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>

              {/* Avatar Upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2px dashed rgba(168, 85, 247, 0.5)", overflow: "hidden", position: "relative", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Upload</div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: "none" }} />
              </div>

              {/* Form Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Display Name</label>
                  <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Username</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>@</span>
                    <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} style={{ width: "100%", padding: "14px 16px 14px 36px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${usernameStatus === "taken" || usernameStatus === "invalid" ? "#ef4444" : usernameStatus === "available" ? "#10b981" : "rgba(255,255,255,0.1)"}`, color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  {usernameStatus === "checking" && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>Checking availability...</span>}
                  {usernameStatus === "taken" && (
                    <div style={{ marginTop: "6px" }}>
                      <span style={{ fontSize: "10px", color: "#ef4444" }}>Username taken. Try: </span>
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                        {usernameSuggestions.map(s => <span key={s} onClick={() => setEditForm({...editForm, username: s})} style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "8px", cursor: "pointer" }}>@{s}</span>)}
                      </div>
                    </div>
                  )}
                  {usernameStatus === "invalid" && <span style={{ fontSize: "10px", color: "#ef4444", marginTop: "4px", display: "block" }}>3-20 chars. Letters, numbers, _ and . only.</span>}
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Bio (Max 150)</label>
                  <textarea maxLength={150} rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <motion.button type="button" onClick={handleSaveProfile} disabled={isSaving || usernameStatus === "taken" || usernameStatus === "invalid"} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", color: "#fff", fontSize: "13px", fontWeight: 900, border: "none", marginTop: "24px", cursor: isSaving ? "wait" : "pointer", opacity: (usernameStatus === "taken" || usernameStatus === "invalid") ? 0.5 : 1 }}>
                {isSaving ? "Saving to Neural Core..." : "Save Changes"}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ROOT LEVEL AUTH MODAL ANCHOR ── */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}