"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import FloatingNav from "@/components/ui/floating-nav";
import AiAssistantModal from "@/components/ui/ai-assistant-modal";
import MediaModal from "@/components/ui/media-modal";
import { SavedProvider } from "@/context/SavedContext";
import { ModalProvider, useModal } from "@/context/ModalContext";
import { AuthModalProvider } from "@/context/AuthModalContext";

function HomeLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const { selectedMedia, setSelectedMedia, isAiOpen, setIsAiOpen } = useModal();
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    // 🚨 THE HARD FIX: Changed root background to pure #000000
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#000000", color: "#ffffff" }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}} />

      {/* ── 🛡️ LEFT PANEL ── */}
      <div style={{ width: "80px", height: "100vh", flexShrink: 0, position: "relative", zIndex: 100 }}>
        <FloatingNav />
      </div>

      {/* ── 🎬 RIGHT PANEL ── */}
      <div style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden", position: "relative", scrollBehavior: "smooth" }}>
        
        {/* 🚨 THE HARD FIX: Changed sticky header gradient to pure black rgba(0,0,0,x) */}
        <header 
          style={{
            width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
            position: "sticky", top: 0, zIndex: 90,
            background: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 75%, transparent 100%)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            padding: "12px 0 16px 0" 
          }}
        >
          <div 
            style={{
              width: "100%", maxWidth: "1600px", height: "48px",
              margin: "0 auto", 
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingLeft: "32px",
              paddingRight: "120px", 
              boxSizing: "border-box", position: "relative"
            }}
          >
            {/* LOGO PILL */}
            <div 
              onClick={() => router.push('/home')} 
              style={{ 
                height: "40px", padding: "0 24px", borderRadius: "24px", 
                backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", backdropFilter: "blur(10px)"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"}
            >
              <h1 style={{ fontSize: "15px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                <span style={{ color: "#ffffff" }}>Do</span>
                <span style={{ background: "linear-gradient(to right, #d8b4fe, #e9d5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 12px rgba(168,85,247,0.5))" }}>Binge</span>
              </h1>
            </div>

            {/* CENTER TEXT */}
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span className="max-md-hidden" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "8px" }}>
                SWIPE <span style={{ fontSize: "6px", color: "rgba(255,255,255,0.2)" }}>●</span> 
                <span style={{ color: "#d8b4fe", textShadow: "0 0 12px rgba(168,85,247,0.6)", filter: "brightness(1.2)" }}>DISCOVER</span> 
                <span style={{ fontSize: "6px", color: "rgba(255,255,255,0.2)" }}>●</span> BINGE
              </span>
            </div>

            {/* AUTH CAPSULE */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => user ? router.push('/home/profile') : router.push('/auth')}
                style={{
                  height: "40px", padding: "0 24px", borderRadius: "24px", 
                  border: "1px solid rgba(168, 85, 247, 0.4)", backgroundColor: "rgba(168, 85, 247, 0.08)", 
                  color: "#ffffff", fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer",
                  textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", 
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 4px 20px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.15)";
                  e.currentTarget.style.boxShadow = "0 4px 25px rgba(168, 85, 247, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.08)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)";
                }}
              >
                {user ? (
                  <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Profile</>
                ) : (
                  <><span style={{ fontSize: "14px", color: "#d8b4fe" }}>✦</span> Sign In</>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── THE CONTENT ── */}
        <main style={{ 
          width: "100%", 
          maxWidth: "1600px", 
          margin: "0 auto", 
          padding: "24px 32px 120px 32px",
          position: "relative",
          boxSizing: "border-box"
        }}>
          {children} 
        </main>

      </div>

      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} onSelectMedia={setSelectedMedia} />
      <MediaModal isOpen={selectedMedia !== null} onClose={() => setSelectedMedia(null)} mediaId={selectedMedia ? selectedMedia.id : null} mediaType={selectedMedia?.mediaType || "movie"} />
    </div>
  );
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <SavedProvider>
        <ModalProvider>
          <HomeLayoutInner>{children}</HomeLayoutInner>
        </ModalProvider>
      </SavedProvider>
    </AuthModalProvider>
  );
}