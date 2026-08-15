"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthView() {
  const router = useRouter();
  const supabase = createClient();
  const [posters, setPosters] = useState<string[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const proxyUrl: string = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";

  useEffect(() => {
    if (!proxyUrl) return;
    const fetchBackgrounds = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${proxyUrl}/api/trending/movie/week`),
          fetch(`${proxyUrl}/api/trending/tv/week`)
        ]);
        const data1 = await res1.json();
        const data2 = await res2.json();
        
        const combined = [...(data1.results || []), ...(data2.results || [])]
          .filter((i: any) => i.poster_path)
          .map((i: any) => `${proxyUrl}/image/t/p/w342${i.poster_path}`);
        
        // Duplicate array to ensure the grid is fully packed
        setPosters([...combined, ...combined, ...combined, ...combined].slice(0, 100));
      } catch (err) {
        console.error("Auth background fetch failed", err);
      }
    };
    fetchBackgrounds();
  }, [proxyUrl]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/home");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push("/mood"); // Route new users to onboarding
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/home` }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleGuest = () => {
    router.push("/home");
  };

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#08070D", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
      {/* ── 🚨 HARD FIX: 60FPS DRIFTING BACKGROUND MATRIX ── */}
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) rotate(-4deg) scale(1.25); }
          100% { transform: translateY(-20%) rotate(-4deg) scale(1.25); }
        }
      `}</style>
      
      <div style={{ position: "absolute", inset: -150, zIndex: 0, pointerEvents: "none" }}>
        {/* 70% Visual Ratio Poster Layer */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", // Smaller posters
          gap: "12px", 
          opacity: 0.85, 
          animation: "drift 90s linear infinite",
          width: "120%",
          padding: "20px"
        }}>
          {posters.map((url, i) => (
            <div key={i} style={{ aspectRatio: "2/3", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }} />
          ))}
        </div>
      </div>

      {/* 15% Dimness Layer */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(8, 7, 13, 0.15)", zIndex: 1, pointerEvents: "none" }} />
      
      {/* 15% Blur Layer */}
      <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", zIndex: 2, pointerEvents: "none" }} />
      
      {/* Edge Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 20%, #08070D 110%)", zIndex: 3, pointerEvents: "none" }} />

      {/* ── 🎛️ FOREGROUND UI: OBSIDIAN GLASSMORPHISM CARD ── */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "420px", padding: "48px 32px", backgroundColor: "rgba(12, 9, 18, 0.6)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        
        {/* Logo */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 8px 0", color: "#fff" }}>
            Do<span style={{ color: "#a855f7", filter: "drop-shadow(0 0 12px rgba(168,85,247,0.5))" }}>Binge</span>
          </h1>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Your Portal Awaits</p>
        </div>

        {/* Toggle Switch */}
        <div style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "16px", padding: "4px", display: "flex", position: "relative", marginBottom: "32px", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ flex: 1, position: "relative", zIndex: 2, padding: "12px 0", textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: 800, color: isLogin ? "#fff" : "rgba(255,255,255,0.4)", transition: "color 0.3s" }} onClick={() => setIsLogin(true)}>Sign In</div>
          <div style={{ flex: 1, position: "relative", zIndex: 2, padding: "12px 0", textAlign: "center", cursor: "pointer", fontSize: "12px", fontWeight: 800, color: !isLogin ? "#fff" : "rgba(255,255,255,0.4)", transition: "color 0.3s" }} onClick={() => setIsLogin(false)}>Sign Up</div>
          <motion.div 
            initial={false}
            animate={{ x: isLogin ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ position: "absolute", top: "4px", bottom: "4px", left: "4px", width: "calc(50% - 4px)", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 4px 10px rgba(0,0,0,0.3)", zIndex: 1 }}
          />
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          <input 
            type="email" 
            placeholder="EMAIL ADDRESS" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = "rgba(168, 85, 247, 0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
          />
          <input 
            type="password" 
            placeholder="PASSWORD" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = "rgba(168, 85, 247, 0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
          />
          
          <div style={{ height: errorMessage ? "auto" : "0px", overflow: "hidden", transition: "all 0.3s", textAlign: "center" }}>
            {errorMessage && <p style={{ margin: "4px 0", fontSize: "10px", color: "#ef4444", fontWeight: 700 }}>{errorMessage}</p>}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            style={{ width: "100%", padding: "16px", marginTop: "8px", backgroundColor: "#a855f7", border: "none", borderRadius: "14px", color: "#fff", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isLoading ? "wait" : "pointer", boxShadow: "0 10px 30px rgba(168,85,247,0.4), inset 0 2px 4px rgba(255,255,255,0.2)", transition: "background-color 0.2s" }}
          >
            {isLoading ? "Authenticating..." : "Dive In"}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
          <span style={{ fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>OR SECURE ACCESS VIA</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
        </div>

        {/* Google Auth */}
        <motion.button 
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }} 
          whileTap={{ scale: 0.98 }}
          style={{ width: "100%", padding: "14px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", color: "#fff", fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          GOOGLE ACCOUNT
        </motion.button>

        {/* Guest Link */}
        <button 
          onClick={handleGuest}
          style={{ marginTop: "24px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.2)", textUnderlineOffset: "4px" }}
        >
          CONTINUE AS GUEST
        </button>

      </motion.div>
    </main>
  );
}