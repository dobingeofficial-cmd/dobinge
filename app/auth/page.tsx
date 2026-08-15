"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [posters, setPosters] = useState<string[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proxyUrl: string = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";

  useEffect(() => {
    if (!proxyUrl) return;

    const fetchPosters = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${proxyUrl}/api/trending/all/day?page=1`),
          fetch(`${proxyUrl}/api/trending/all/day?page=2`)
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        const imageUrls = [...(data1.results || []), ...(data2.results || [])]
          .filter((i: any) => i.poster_path)
          .map((i: any) => `${proxyUrl}/image/t/p/w300${i.poster_path}`);

        // 🚨 HARD FIX: Deep duplication to ensure dense matrix for 14 columns
        const shuffled = imageUrls.sort(() => 0.5 - Math.random());
        setPosters([...shuffled, ...shuffled, ...shuffled, ...shuffled]);
      } catch (err) {
        console.error("Poster Matrix Fetch Failed:", err);
      }
    };

    fetchPosters();
  }, [proxyUrl]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push("/mood"); 
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/mood` }
      });
      if (error) throw error;
    } catch (err: any) {
      setError("Google secure uplink failed.");
    }
  };

  const handleGuest = () => {
    router.push("/home");
  };

  // 🚨 HARD FIX: 14 columns instead of 6 to prevent poster stretching
  const columns = Array.from({ length: 14 }, (_, i) => 
    posters.filter((_, index) => index % 14 === i)
  );

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#08070D", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
      {/* ── 🎬 60FPS INFINITE SCROLLING BACKGROUND ── */}
      <style>{`
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scroll-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .scrolling-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          will-change: transform;
        }
        .scroll-up { animation: scroll-up 80s linear infinite; }
        .scroll-down { animation: scroll-down 80s linear infinite; }
      `}</style>

      {/* 🚨 HARD FIX: 130vw to ensure screen edge coverage during rotation */}
      <div style={{ position: "absolute", width: "130vw", left: "-15vw", height: "240vh", top: "-70vh", display: "flex", gap: "16px", transform: "rotate(-6deg) scale(1.05)", pointerEvents: "none", zIndex: 0, opacity: posters.length > 0 ? 1 : 0, transition: "opacity 1s ease" }}>
        {columns.map((col, idx) => (
          <div key={idx} className={`scrolling-col ${idx % 2 === 0 ? "scroll-up" : "scroll-down"}`}>
            {[...col, ...col].map((url, imgIdx) => (
              <img 
                key={imgIdx} 
                src={url} 
                alt="" 
                loading="lazy"
                style={{ width: "100%", aspectRatio: "2/3", borderRadius: "12px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }} 
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── 🌌 15% DIMNESS & 15% BLUR OVERLAY (Perfectly Calibrated) ── */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(8, 7, 13, 0.15)", backdropFilter: "blur(4px)", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 20%, rgba(8, 7, 13, 0.95) 100%)", zIndex: 2, pointerEvents: "none" }} />

      {/* ── 🎛️ FOREGROUND: LIQUID GLASS AUTH CARD ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10, padding: "48px 32px", borderRadius: "32px", backgroundColor: "rgba(18, 12, 28, 0.65)", backdropFilter: "blur(40px)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 50px 100px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff" }}>
            Do<span style={{ background: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 12px rgba(168,85,247,0.4))" }}>Binge</span>
          </h1>
          <p style={{ margin: "6px 0 0 0", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Your Portal Awaits</p>
        </div>

        {/* Custom Tab Switcher */}
        <div style={{ display: "flex", width: "100%", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "16px", padding: "6px", marginBottom: "32px", position: "relative", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ position: "absolute", top: "6px", bottom: "6px", left: isLogin ? "6px" : "50%", width: "calc(50% - 6px)", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)" }} />
          <button type="button" onClick={() => { setIsLogin(true); setError(null); }} style={{ flex: 1, padding: "10px 0", fontSize: "13px", fontWeight: 800, color: isLogin ? "#fff" : "rgba(255,255,255,0.4)", background: "transparent", border: "none", cursor: "pointer", position: "relative", zIndex: 1, transition: "color 0.2s" }}>Sign In</button>
          <button type="button" onClick={() => { setIsLogin(false); setError(null); }} style={{ flex: 1, padding: "10px 0", fontSize: "13px", fontWeight: 800, color: !isLogin ? "#fff" : "rgba(255,255,255,0.4)", background: "transparent", border: "none", cursor: "pointer", position: "relative", zIndex: 1, transition: "color 0.2s" }}>Sign Up</button>
        </div>

        <form onSubmit={handleAuth} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <input 
              type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(126, 34, 206, 0.6)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
            />
          </div>
          <div style={{ position: "relative" }}>
            <input 
              type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              style={{ width: "100%", padding: "16px 20px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(126, 34, 206, 0.6)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
            />
          </div>

          <div style={{ height: error ? "auto" : "0px", overflow: "hidden", transition: "all 0.3s ease", display: "flex", justifyContent: "center" }}>
            {error && <span style={{ fontSize: "10px", fontWeight: 800, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚠️ {error}</span>}
          </div>

          {/* 🚨 HARD FIX: Deep Dark Purple Gradient & Shadow for Premium Feel */}
          <motion.button 
            type="submit" disabled={isLoading} whileHover={{ scale: 1.02, boxShadow: "0 12px 30px rgba(76, 29, 149, 0.6)" }} whileTap={{ scale: 0.98 }}
            style={{ width: "100%", padding: "16px 0", marginTop: "8px", borderRadius: "16px", background: "linear-gradient(135deg, #7e22ce 0%, #3b0764 100%)", color: "#fff", border: "1px solid rgba(168, 85, 247, 0.2)", fontSize: "13px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", cursor: isLoading ? "wait" : "pointer", boxShadow: "0 8px 20px rgba(59, 7, 100, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
          >
            {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: "16px", height: "16px", border: "2px solid transparent", borderTopColor: "#fff", borderRadius: "50%" }} /> : null}
            {isLoading ? "Authenticating..." : "Dive In"}
          </motion.button>
        </form>

        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", margin: "32px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Or Secure Access Via</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>

        <motion.button 
          onClick={handleGoogleLogin} type="button" whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.98 }}
          style={{ width: "100%", padding: "14px 0", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "12px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.2s" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Account
        </motion.button>

        <button 
          onClick={handleGuest} type="button"
          style={{ marginTop: "24px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px", transition: "color 0.2s" }}
          onMouseOver={(e) => e.currentTarget.style.color = "#c084fc"}
          onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
        >
          Continue As Guest
        </button>
      </motion.div>
    </main>
  );
}