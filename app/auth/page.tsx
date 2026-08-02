"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [backgroundPosters, setBackgroundPosters] = useState<string[]>([]);

  // ── 1. CINEMATIC BACKGROUND EDGE FETCH ENGINE ──
  useEffect(() => {
    const fetchBackgroundPosters = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
      
      // X-RAY LOG 1: Verify the env variable loaded
      console.log("DoBinge Proxy URL:", proxyUrl);

      if (!proxyUrl) {
        console.error("CRITICAL: DoBinge Gateway URL missing from .env.local");
        return;
      }

      try {
        const res = await fetch(`${proxyUrl}/api/trending/all/day`);
        const data = await res.json();
        
        // X-RAY LOG 2: Verify the data arrived
        console.log("Edge Proxy Payload:", data);

        const validPosters = data.results
          .filter((item: any) => item.poster_path)
          .map((item: any) => `${proxyUrl}/image/t/p/w500${item.poster_path}`);
        
        setBackgroundPosters(validPosters.slice(0, 18)); 
      } catch (err) {
        console.error("Failed to load cinematic background from Edge.", err);
      }
    };
    fetchBackgroundPosters();
  }, []);

  // ── 2. AUTHENTICATION CONTROLLERS ──
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("dobinge_guest_mode");
      }

      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          window.location.href = "/mood";
          return;
        }
        
        window.location.href = "/mood"; 
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('taste_profile')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          let hasOnboarded = false;
          
          if (prefs && prefs.taste_profile) {
            const profile = prefs.taste_profile;
            const hasMoods = Array.isArray(profile.moods) && profile.moods.length > 0;
            const hasGenres = (Array.isArray(profile.genres) && profile.genres.length > 0) || 
                              (typeof profile.genres === 'object' && profile.genres !== null && Object.keys(profile.genres).length > 0);
            const hasFavorites = Array.isArray(profile.favorites) && profile.favorites.length > 0;

            if (hasMoods || hasGenres || hasFavorites) {
              hasOnboarded = true;
            }
          }

          window.location.href = hasOnboarded ? "/home" : "/mood";
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg("");
    
    try {
      const supabase = createClient();
      if (typeof window !== "undefined") {
        localStorage.removeItem("dobinge_guest_mode");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` }, 
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize Neural Link.");
      setIsProcessing(false);
    }
  };

  const handleGuestContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") || key === "dobinge_guest_mode") {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem("dobinge_guest_mode", "true");
      }

      window.location.href = "/mood"; 
      
    } catch (err: any) {
      console.error("Guest Initialization Fault:", err);
      window.location.href = "/mood"; 
    }
  };

  const col1 = [...backgroundPosters.slice(0, 6), ...backgroundPosters.slice(0, 6)];
  const col2 = [...backgroundPosters.slice(6, 12), ...backgroundPosters.slice(6, 12)];
  const col3 = [...backgroundPosters.slice(12, 18), ...backgroundPosters.slice(12, 18)];

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#020104", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
      {/* ── CINEMATIC ANIMATED BACKGROUND ── */}
      {backgroundPosters.length > 0 && (
        <div style={{ position: "absolute", inset: "-20%", display: "flex", gap: "16px", transform: "rotate(-5deg) scale(1.1)", opacity: 0.25, zIndex: 0 }}>
          <motion.div animate={{ y: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {col1.map((src, i) => <img key={`c1-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }} />)}
          </motion.div>
          <motion.div animate={{ y: ["-50%", "0%"] }} transition={{ ease: "linear", duration: 35, repeat: Infinity }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {col2.map((src, i) => <img key={`c2-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }} />)}
          </motion.div>
          <motion.div animate={{ y: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {col3.map((src, i) => <img key={`c3-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }} />)}
          </motion.div>
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #020104 85%)", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 1, 4, 0.5)", backdropFilter: "blur(4px)", zIndex: 2 }} />

      {/* ── PREMIUM DARK AUTH CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "400px",
          padding: "40px 32px",
          borderRadius: "32px",
          backgroundColor: "#0B090C",
          border: "1px solid rgba(255, 255, 255, 0.03)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
          DoBing<span style={{ color: "#a855f7" }}>e</span>
        </h1>
        <p style={{ margin: "0 0 32px 0", fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Your Portal Awaits
        </p>

        <div style={{ display: "flex", width: "100%", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "16px", padding: "4px", marginBottom: "32px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={() => setAuthMode("signin")} style={{ flex: 1, padding: "12px 0", borderRadius: "12px", backgroundColor: authMode === "signin" ? "rgba(255,255,255,0.06)" : "transparent", color: authMode === "signin" ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease", border: "none" }}>
            Sign In
          </button>
          <button onClick={() => setAuthMode("signup")} style={{ flex: 1, padding: "12px 0", borderRadius: "12px", backgroundColor: authMode === "signup" ? "rgba(255,255,255,0.06)" : "transparent", color: authMode === "signup" ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease", border: "none" }}>
            Sign Up
          </button>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: "10px", fontWeight: 700, textAlign: "center" }}>
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleEmailAuth} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="EMAIL ADDRESS" required style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#ffffff", fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box", letterSpacing: "0.05em" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="PASSWORD" required style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#ffffff", fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box", letterSpacing: "0.05em" }} />
          
          <button type="submit" disabled={isProcessing} style={{ width: "100%", padding: "18px 0", marginTop: "8px", borderRadius: "16px", backgroundColor: "#A855F7", color: "#ffffff", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isProcessing ? "not-allowed" : "pointer", border: "none", boxShadow: "0 10px 20px rgba(168, 85, 247, 0.3)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {isProcessing ? "Authenticating..." : "Dive In"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
          <span style={{ padding: "0 12px", fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Or Secure Access Via</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
        </div>

        <button onClick={handleGoogleLogin} disabled={isProcessing} type="button" style={{ width: "100%", height: "52px", borderRadius: "16px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", color: "#ffffff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isProcessing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px", transition: "all 0.2s ease" }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.2 0 10.5 0 12s.7 2.8 1.9 4.7l3.7-1.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
          </svg>
          Google Account
        </button>

        <button onClick={handleGuestContinue} disabled={isProcessing} type="button" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "underline", textUnderlineOffset: "4px", cursor: isProcessing ? "not-allowed" : "pointer" }}>
          {isProcessing ? "Processing..." : "Continue As Guest"}
        </button>
      </motion.div>
    </div>
  );
}