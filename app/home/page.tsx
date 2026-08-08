"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import HomeView from "@/components/ui/home-view";
import SearchView from "@/components/ui/search-view";
import SwipeView from "@/components/ui/swipe-view";
import SavedView from "@/components/ui/saved-view";
import ProfileView from "@/components/ui/profile-view";
import MoreView from "@/components/ui/more-view"; 
import FloatingNav from "@/components/ui/floating-nav";
import AiAssistantModal from "@/components/ui/ai-assistant-modal";
import MediaModal from "@/components/ui/media-modal";
import { SavedProvider } from "@/context/SavedContext";
import { useView } from "@/context/ViewContext";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentView, setCurrentView } = useView();
  
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
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

  const renderActiveView = () => {
    const activeViewStr = currentView as string;

    switch (activeViewStr) {
      case "search":
        return <SearchView onSelectMedia={(media: any) => setSelectedMedia(media)} />;
      case "swipe":
        return <SwipeView onSelectMedia={(media: any) => setSelectedMedia(media)} />;
      case "saved":
        return <SavedView onSelectMedia={(media: any) => setSelectedMedia(media)} />;
      case "profile":
        return <ProfileView onSelectMedia={(media: any) => setSelectedMedia(media)} />;
      case "more":
        return <MoreView />;
      case "movies":
      case "shows":
      case "anime":
        return (
          <div style={{ width: "100%", height: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              {activeViewStr} Workspace Window Initiated
            </span>
          </div>
        );
      case "home":
      default:
        return <HomeView onSelectMedia={(media: any) => setSelectedMedia(media)} setView={(v) => setCurrentView(v as any)} />;
    }
  };

  return (
    <SavedProvider>
      <div 
        style={{ 
          width: "100%", minHeight: "100vh", 
          background: "radial-gradient(circle at top right, #25123e 0%, #0d0618 50%, #020104 100%)", 
          color: "#ffffff", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative"
        }}
      >
        {/* ── 🎭 FLOATING CAPSULE NAVIGATION ── */}
        <header 
          style={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            padding: "16px 24px",
            boxSizing: "border-box", 
            position: "sticky",
            top: 0, 
            zIndex: 90, 
            flexShrink: 0 
          }}
        >
          {/* Main Floating Glass Bar Container */}
          <div 
            style={{
              width: "100%",
              maxWidth: "1240px",
              height: "56px",
              borderRadius: "40px",
              backgroundColor: "rgba(10, 6, 18, 0.65)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(168, 85, 247, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px", // Cleaned up padding
              boxSizing: "border-box",
              position: "relative"
            }}
          >
            {/* ── 📍 TOP LEFT CIRCLE: LOGO CAPSULE (REFINED SIZING) ── */}
            <div 
              onClick={() => setCurrentView("home" as any)} 
              style={{ 
                height: "38px", // Sleek, detached height
                padding: "0 20px", // Tighter padding
                borderRadius: "24px", // Rounded pill
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.12)";
                e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.3)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)";
              }}
            >
              <h1 style={{ fontSize: "1.05rem", fontWeight: 950, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                <span style={{ color: "#ffffff" }}>Do</span>
                <span style={{ background: "linear-gradient(to right, #C084FC, #E9D5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 10px rgba(168,85,247,0.4))" }}>Binge</span>
              </h1>
            </div>

            {/* ── 📍 CENTER BLUE AREA: MIDDLE TEXT ── */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.45)", whiteSpace: "nowrap", lineHeight: 1 }}>
                SWIPE &bull; <span style={{ color: "#a855f7", textShadow: "0 0 10px rgba(168,85,247,0.4)" }}>DISCOVER</span> &bull; BINGE
              </span>
            </div>

            {/* ── 📍 TOP RIGHT CIRCLE: DYNAMIC AUTH CAPSULE (REFINED SIZING) ── */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => user ? setCurrentView("profile" as any) : router.push('/auth')}
                style={{
                  height: "38px", // Sleek, detached height
                  padding: "0 20px", // Tighter padding
                  borderRadius: "24px", // Rounded pill
                  border: "1px solid rgba(192, 132, 252, 0.35)",
                  backgroundColor: "rgba(168, 85, 247, 0.18)", 
                  backdropFilter: "blur(20px)", 
                  WebkitBackdropFilter: "blur(20px)",
                  color: "#ffffff", 
                  fontSize: "11px", // Sharper font sizing
                  fontWeight: 900, 
                  letterSpacing: "0.1em", 
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)", 
                  textTransform: "uppercase", 
                  boxShadow: "0 4px 20px rgba(168, 85, 247, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.32)";
                  e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.7)";
                  e.currentTarget.style.boxShadow = "0 0 25px rgba(168, 85, 247, 0.45)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(168, 85, 247, 0.18)";
                  e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.35)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(168, 85, 247, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {user ? (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "10px", color: "#C084FC" }}>✦</span>
                    Sign In
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── 🚀 MASTER FLOW VIEWPORT ── */}
        <div style={{ display: "flex", flex: 1, width: "100%", position: "relative", marginTop: "4px" }}>
          {!isMobile && (
            <div style={{ width: "56px", position: "fixed", top: "72px", left: "24px", bottom: "24px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
              <FloatingNav activeTab={currentView as any} setActiveTab={setCurrentView as any} />
            </div>
          )}

          <main style={{ flex: 1, width: "100%", boxSizing: "border-box", position: "relative", paddingLeft: !isMobile ? "96px" : "0px", paddingBottom: isMobile ? "100px" : "40px" }} className="px-6 md:pr-10 no-scrollbar">
            {renderActiveView()}
          </main>
        </div>

        {isMobile && (
          <div style={{ position: "fixed", bottom: "16px", left: "16px", right: "16px", zIndex: 100 }}>
            <FloatingNav activeTab={currentView as any} setActiveTab={setCurrentView as any} />
          </div>
        )}

        <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} onSelectMedia={setSelectedMedia} />
        <MediaModal isOpen={selectedMedia !== null} onClose={() => setSelectedMedia(null)} mediaId={selectedMedia ? selectedMedia.id : null} mediaType={selectedMedia?.mediaType || "movie"} />
      </div>
    </SavedProvider>
  );
}