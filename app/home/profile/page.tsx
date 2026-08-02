"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  isGuest: boolean;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchIdentity = async () => {
      const isGuest = typeof window !== "undefined" && localStorage.getItem("dobinge_guest_mode") === "true";
      
      if (isGuest) {
        setProfile({ id: "guest", isGuest: true, full_name: "Anonymous Explorer" });
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "Cinematic Nomad",
          avatar_url: user.user_metadata?.avatar_url,
          isGuest: false,
        });
      }
      setLoading(false);
    };

    fetchIdentity();
  }, []);

  const handleTotalSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const supabase = createClient();
      
      // 1. Terminate Supabase Backend Session
      await supabase.auth.signOut();

      // 2. Annihilate Local Storage (Guest Data + Ghost Tokens)
      if (typeof window !== "undefined") {
        localStorage.removeItem("dobinge_guest_mode");
        localStorage.removeItem("dobinge_guest_data");
        
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) {
            localStorage.removeItem(key);
          }
        });
      }

      // 3. Hard Redirect to Landing Page (Bypasses Next.js Router Cache)
      window.location.href = "/";
      
    } catch (error) {
      console.error("Sign Out Fault:", error);
      window.location.href = "/"; // Force redirect even on failure
    }
  };

  if (loading) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(168, 85, 247, 0.6)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Decrypting Identity...
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", padding: "40px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* ── PROFILE HEADER ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "48px" }}>
        <div style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "20px", background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(2, 1, 4, 1) 100%)", border: "2px solid rgba(168, 85, 247, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(168, 85, 247, 0.3)" }}>
          {!profile?.avatar_url && (
            <svg width="40" height="40" fill="none" stroke="rgba(168, 85, 247, 0.8)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
        </div>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          {profile?.full_name}
        </h1>
        {profile?.email && (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {profile.email}
          </span>
        )}
        {profile?.isGuest && (
          <span style={{ marginTop: "8px", padding: "4px 12px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Unregistered Session
          </span>
        )}
      </div>

      {/* ── SETTINGS PANELS (GLASSMORPHISM) ── */}
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {/* Placeholder for future settings */}
        <button style={{ width: "100%", padding: "20px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff", cursor: "pointer", transition: "background 0.2s" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>Account Settings</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>

        <button style={{ width: "100%", padding: "20px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff", cursor: "pointer", transition: "background 0.2s" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>Notification Preferences</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>

        {/* ── DESTRUCTIVE LOGOUT ACTION ── */}
        <button 
          onClick={handleTotalSignOut}
          disabled={isLoggingOut}
          style={{ width: "100%", padding: "20px", marginTop: "24px", borderRadius: "20px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#f87171", cursor: isLoggingOut ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {isLoggingOut ? "Severing Connection..." : (profile?.isGuest ? "Exit Guest Mode" : "Sign Out")}
          </span>
        </button>

      </div>
    </div>
  );
}