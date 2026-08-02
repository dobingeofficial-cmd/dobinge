"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTracker } from "@/hooks/useTracker"; 

type AuthMode = "signin" | "signup" | "forgot";

interface PosterItem {
  id: number;
  poster_path: string | null;
}

interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { track } = useTracker(); 
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [posters, setPosters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── 📡 FETCH CINEMATIC BACKDROP POSTERS FROM EDGE ──
  useEffect(() => {
    if (!isOpen) return; 

    const fetchPosters = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
      if (!proxyUrl) return;

      try {
        const res = await fetch(`${proxyUrl}/api/trending/all/week`);
        const data = await res.json();
        
        if (data.results) {
          const paths = data.results
            .filter((item: PosterItem) => item.poster_path)
            .map((item: PosterItem) => `${proxyUrl}/image/t/p/w500${item.poster_path}`);
          setPosters(paths);
        }
      } catch (err) {
        console.error("Failed to load background posters from Edge:", err);
      }
    };
    fetchPosters();
  }, [isOpen]);

  // ── 🔒 SUPABASE AUTHENTICATION HANDLERS ──
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const supabase = createClient();

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("dobinge_guest_mode");
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        
        track('AUTH_SIGNUP', { method: 'email' }, { currentRoute: '/auth' });
        
        if (data.session) {
          window.location.href = "/mood";
          return;
        }

        setSuccessMsg("Account created! Check your email for the confirmation link.");
        
      } else if (mode === "signin") {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        track('AUTH_SIGNIN', { method: 'email' }, { currentRoute: '/auth' });
        
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

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        setSuccessMsg("Password reset link sent to your email.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setErrorMsg("");

    if (typeof window !== "undefined") {
      localStorage.removeItem("dobinge_guest_mode");
    }

    try {
      track('AUTH_SIGNIN', { method: 'google' }, { currentRoute: '/auth' });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate Google login.");
    }
  };

  const handleContinueAsGuest = async () => {
    const supabase = createClient();
    
    await supabase.auth.signOut({ scope: "local" });
    
    if (typeof window !== "undefined") {
      localStorage.setItem("dobinge_guest_mode", "true");
    }

    track('AUTH_GUEST_ENTRY', { client_id: 'local_device' }, { currentRoute: '/auth' });

    window.location.href = "/home";
  };

  const columnPosters1 = [...posters, ...posters];
  const columnPosters2 = [...posters].reverse().concat([...posters].reverse());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", 
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#040206",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            zIndex: 99999, 
          }}
        >
          {/* ── 🌌 INFINITE MOVING POSTER BACKDROP ── */}
          <div
            style={{
              position: "absolute",
              inset: -100,
              display: "flex",
              gap: "24px",
              justifyContent: "center",
              opacity: 0.18,
              filter: "blur(2px) grayscale(30%)",
              transform: "rotate(-6deg) scale(1.1)",
              pointerEvents: "none",
            }}
          >
            <motion.div
              animate={{ y: [0, -1200] }}
              transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
              style={{ display: "flex", flexDirection: "column", gap: "20px", width: "220px" }}
            >
              {columnPosters1.map((src, i) => (
                <img key={`col1-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "16px", objectFit: "cover", boxShadow: "0 10px 20px rgba(0,0,0,0.8)" }} />
              ))}
            </motion.div>

            <motion.div
              animate={{ y: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
              style={{ display: "flex", flexDirection: "column", gap: "20px", width: "220px" }}
            >
              {columnPosters2.map((src, i) => (
                <img key={`col2-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "16px", objectFit: "cover", boxShadow: "0 10px 20px rgba(0,0,0,0.8)" }} />
              ))}
            </motion.div>

            <motion.div
              animate={{ y: [0, -1200] }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              style={{ display: "flex", flexDirection: "column", gap: "20px", width: "220px" }}
            >
              {columnPosters1.map((src, i) => (
                <img key={`col3-${i}`} src={src} alt="" style={{ width: "100%", borderRadius: "16px", objectFit: "cover", boxShadow: "0 10px 20px rgba(0,0,0,0.8)" }} />
              ))}
            </motion.div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.12) 0%, rgba(4, 2, 6, 0.85) 60%, rgba(4, 2, 6, 0.98) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* ── 🃏 FROSTED LIQUID GLASS AUTH CARD ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              zIndex: 10,
              width: "100%",
              maxWidth: "420px",
              margin: "0 24px",
              padding: "40px 32px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              boxShadow: "0 40px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: "16px",
                cursor: "pointer",
                padding: "4px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              ✕
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff" }}>
                Do<span style={{ color: "#a855f7" }}>Binge</span>
              </span>
            </div>

            <p style={{ margin: "0 0 28px 0", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {mode === "signin" && "Discover Your Next Obsession"}
              {mode === "signup" && "Create Your Cinephile Profile"}
              {mode === "forgot" && "Recover Account Access"}
            </p>

            {mode !== "forgot" && (
              <button
                onClick={handleGoogleLogin}
                type="button"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.2 0 10.5 0 12s.7 2.8 1.9 4.7l3.7-1.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                Continue with Google
              </button>
            )}

            {mode !== "forgot" && (
              <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "0 0 20px 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                <span style={{ padding: "0 12px", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>OR</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
              </div>
            )}

            <form onSubmit={handleEmailAuth} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              {mode === "signup" && (
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: "100%", height: "48px", borderRadius: "14px", backgroundColor: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "0 16px", color: "#ffffff", fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
              )}

              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", height: "48px", borderRadius: "14px", backgroundColor: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "0 16px", color: "#ffffff", fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />

              {mode !== "forgot" && (
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", height: "48px", borderRadius: "14px", backgroundColor: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "0 16px", color: "#ffffff", fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
              )}

              <AnimatePresence>
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "8px 12px", borderRadius: "10px", textAlign: "center" }}>
                    ⚠️ {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", padding: "8px 12px", borderRadius: "10px", textAlign: "center" }}>
                    ✅ {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading} style={{ width: "100%", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", border: "none", color: "#ffffff", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", boxShadow: "0 10px 25px rgba(168, 85, 247, 0.35)", marginTop: "4px", transition: "all 0.2s ease" }}>
                {loading ? "Authenticating..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "20px" }}>
              {mode === "signin" && (
                <>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Don't have an account? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "#c084fc", fontWeight: 800, cursor: "pointer", padding: 0 }}>Sign Up</button></span>
                  <button onClick={() => setMode("forgot")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>Forgot Password?</button>
                </>
              )}

              {mode === "signup" && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Already registered? <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: "#c084fc", fontWeight: 800, cursor: "pointer", padding: 0 }}>Sign In</button></span>
              )}

              {mode === "forgot" && (
                <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: "#c084fc", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>← Back to Sign In</button>
              )}

              <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

              <button onClick={handleContinueAsGuest} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.2s ease" }}>
                Continue as Guest →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}