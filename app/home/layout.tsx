"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import FloatingNav from "@/components/ui/floating-nav";
import AiAssistantModal from "@/components/ui/ai-assistant-modal";
import MediaModal from "@/components/ui/media-modal";
import { SavedProvider } from "@/context/SavedContext";
import { ModalProvider, useModal } from "@/context/ModalContext";

// Inner component to consume the context
function HomeLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const { selectedMedia, setSelectedMedia, isAiOpen, setIsAiOpen } = useModal();
  
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div 
      style={{ 
        width: "100%", minHeight: "100vh", 
        backgroundColor: "transparent", 
        color: "#ffffff", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative"
      }}
    >
      {/* ── 🎭 FLOATING CAPSULE NAVIGATION ── */}
      <header 
        style={{ 
          width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
          padding: "16px 24px", boxSizing: "border-box", position: "sticky",
          top: 0, zIndex: 90, flexShrink: 0 
        }}
      >
        <div 
          style={{
            width: "100%", maxWidth: "1240px", height: "56px", borderRadius: "40px",
            backgroundColor: "rgba(10, 6, 18, 0.65)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(168, 85, 247, 0.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 8px", boxSizing: "border-box", position: "relative"
          }}
        >
          {/* 📍 TOP LEFT: LOGO */}
          <div 
            onClick={() => router.push('/home')} 
            style={{ 
              height: "38px", padding: "0 20px", borderRadius: "24px", 
              backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s ease"
            }}
          >
            <h1 style={{ fontSize: "1.05rem", fontWeight: 950, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
              <span style={{ color: "#ffffff" }}>Do</span>
              <span style={{ background: "linear-gradient(to right, #C084FC, #E9D5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 10px rgba(168,85,247,0.4))" }}>Binge</span>
            </h1>
          </div>

          {/* 📍 CENTER: MIDDLE TEXT */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.45)", whiteSpace: "nowrap", lineHeight: 1 }}>
              SWIPE &bull; <span style={{ color: "#a855f7", textShadow: "0 0 10px rgba(168,85,247,0.4)" }}>DISCOVER</span> &bull; BINGE
            </span>
          </div>

          {/* 📍 TOP RIGHT: AUTH CAPSULE */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => user ? router.push('/home/profile') : router.push('/auth')}
              style={{
                height: "38px", padding: "0 20px", borderRadius: "24px", 
                border: "1px solid rgba(192, 132, 252, 0.35)", backgroundColor: "rgba(168, 85, 247, 0.18)", 
                color: "#ffffff", fontSize: "11px", fontWeight: 900, letterSpacing: "0.1em", cursor: "pointer",
                textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.25s ease"
              }}
            >
              {user ? (
                <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Profile</>
              ) : (
                <><span style={{ fontSize: "10px", color: "#C084FC" }}>✦</span> Sign In</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── 🚀 MASTER FLOW VIEWPORT ── */}
      <div style={{ display: "flex", flex: 1, width: "100%", position: "relative", marginTop: "4px" }}>
        {!isMobile && (
          <div style={{ width: "40px", position: "fixed", top: "72px", left: "16px", bottom: "24px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <FloatingNav />
          </div>
        )}

        <main style={{ flex: 1, width: "100%", boxSizing: "border-box", position: "relative", paddingLeft: !isMobile ? "72px" : "0px", paddingBottom: isMobile ? "100px" : "40px" }} className="px-6 md:pr-10 no-scrollbar">
          {children} {/* Next.js automatically injects /home, /home/swipe, etc. here! */}
        </main>
      </div>

      {isMobile && (
        <div style={{ position: "fixed", bottom: "16px", left: "16px", right: "16px", zIndex: 100 }}>
          <FloatingNav />
        </div>
      )}

      {/* 🚨 MODALS NOW LIVE IN THE LAYOUT, CONTROLLED BY CONTEXT */}
      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} onSelectMedia={setSelectedMedia} />
      <MediaModal isOpen={selectedMedia !== null} onClose={() => setSelectedMedia(null)} mediaId={selectedMedia ? selectedMedia.id : null} mediaType={selectedMedia?.mediaType || "movie"} />
    </div>
  );
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedProvider>
      <ModalProvider>
        <HomeLayoutInner>{children}</HomeLayoutInner>
      </ModalProvider>
    </SavedProvider>
  );
}