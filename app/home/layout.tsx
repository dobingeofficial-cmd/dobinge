"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import FloatingNav from "@/components/ui/floating-nav";
import AiAssistantModal from "@/components/ui/ai-assistant-modal";
import MediaModal from "@/components/ui/media-modal";
import { SavedProvider } from "@/context/SavedContext";
import { ModalProvider, useModal } from "@/context/ModalContext";

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
    <div className="dobinge-grid-lock">
      <style>{`
        /* ── 🚀 THE GRID LOCK ARCHITECTURE ── */
        .dobinge-grid-lock {
          display: grid;
          min-height: 100vh;
          width: 100%;
          background-color: transparent;
          color: #ffffff;
          box-sizing: border-box;
          
          /* CRITICAL: This mathematically prevents GPU layer bleed */
          isolation: isolate; 
        }

        /* DESKTOP: Rigid 2-Column Grid Lock */
        @media (min-width: 768px) {
          .dobinge-grid-lock {
            grid-template-columns: 104px minmax(0, 1fr);
            grid-template-areas: "nav content";
          }
        }

        /* ULTRAWIDE: Keeps the cinematic center perfectly balanced */
        @media (min-width: 1360px) {
          .dobinge-grid-lock {
            grid-template-columns: calc(50vw - 580px) minmax(0, 1200px) calc(50vw - 620px);
            grid-template-areas: "nav content .";
          }
        }

        /* MOBILE: Stacked Layout */
        @media (max-width: 767px) {
          .dobinge-grid-lock {
            display: flex;
            flex-direction: column;
          }
        }

        /* ── 🛡️ NAV AREA LAYER ── */
        .dobinge-nav-area {
          grid-area: nav;
          position: relative;
          z-index: 99999; /* Absolute supremacy over all content */
        }

        /* ── 🎬 CONTENT AREA LAYER ── */
        .dobinge-content-area {
          grid-area: content;
          position: relative;
          z-index: 1; /* Content securely locked beneath the Nav layer */
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        @media (min-width: 768px) {
          .dobinge-content-area {
            padding-right: 32px;
            padding-bottom: 64px;
          }
        }

        @media (max-width: 767px) {
          .dobinge-nav-area {
            order: 2;
          }
          .dobinge-content-area {
            order: 1;
            padding: 0 16px 120px 16px;
          }
          .max-md\\:hidden { display: none; }
        }
      `}</style>

      {/* ── 🛡️ GRID CELL 1: NAVIGATION ── */}
      <div className="dobinge-nav-area">
        <FloatingNav />
      </div>

      {/* ── 🎬 GRID CELL 2: MAIN CONTENT ── */}
      <div className="dobinge-content-area">
        
        {/* TOP NAVIGATION HEADER */}
        <header 
          style={{ 
            width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
            padding: "24px 0 32px 0", boxSizing: "border-box", position: "sticky",
            top: 0, zIndex: 90, flexShrink: 0,
            background: "linear-gradient(to bottom, #08070D 60%, transparent 100%)"
          }}
        >
          <div 
            style={{
              width: "100%", maxWidth: "1600px", height: "56px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxSizing: "border-box", position: "relative"
            }}
          >
            {/* LOGO */}
            <div 
              onClick={() => router.push('/home')} 
              style={{ 
                height: "44px", padding: "0 24px", borderRadius: "24px", 
                backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s ease"
              }}
            >
              <h1 style={{ fontSize: "1.1rem", fontWeight: 950, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                <span style={{ color: "#ffffff" }}>Do</span>
                <span style={{ background: "linear-gradient(to right, #C084FC, #E9D5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 10px rgba(168,85,247,0.4))" }}>Binge</span>
              </h1>
            </div>

            {/* CENTER TEXT */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span className="max-md:hidden" style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.5)", whiteSpace: "nowrap", lineHeight: 1 }}>
                SWIPE &bull; <span style={{ color: "#a855f7", textShadow: "0 0 12px rgba(168,85,247,0.5)" }}>DISCOVER</span> &bull; BINGE
              </span>
            </div>

            {/* AUTH CAPSULE */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => user ? router.push('/home/profile') : router.push('/auth')}
                style={{
                  height: "44px", padding: "0 24px", borderRadius: "24px", 
                  border: "1px solid rgba(192, 132, 252, 0.3)", backgroundColor: "rgba(168, 85, 247, 0.15)", 
                  color: "#ffffff", fontSize: "11px", fontWeight: 900, letterSpacing: "0.1em", cursor: "pointer",
                  textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.25s ease",
                  boxShadow: "0 4px 20px rgba(168, 85, 247, 0.2)"
                }}
              >
                {user ? (
                  <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Profile</>
                ) : (
                  <><span style={{ fontSize: "12px", color: "#C084FC" }}>✦</span> Sign In</>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT MOUNT */}
        <main className="no-scrollbar" style={{ flex: 1, width: "100%", maxWidth: "1600px", margin: "0 auto", position: "relative" }}>
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
    <SavedProvider>
      <ModalProvider>
        <HomeLayoutInner>{children}</HomeLayoutInner>
      </ModalProvider>
    </SavedProvider>
  );
}