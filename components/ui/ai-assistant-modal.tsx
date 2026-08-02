"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData, saveGuestData } from "@/lib/store/guestStore";
import PremiumMediaCard, { TMDBMedia } from "@/components/ui/PremiumMediaCard";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (media: any) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  recommendations?: TMDBMedia[];
}

const PRESET_VIBES = [
  "🌧 Rainy night slow-burn psychological mystery",
  "🧠 Mind-bending Sci-Fi with plot twists",
  "🍿 High-energy action under 90 minutes",
  "🍜 Comfort slice-of-life anime for Sunday",
  "💎 Underrated indie cinema masterpieces"
];

// ── IN-CHAT CAROUSEL COMPONENT WITH NAV BUTTONS ──
function ChatPosterCarousel({ 
  items, 
  onSelectMedia 
}: { 
  items: TMDBMedia[]; 
  onSelectMedia?: (media: any) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -260, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  };

  return (
    <div style={{ width: "100%", marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Navigation Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "4px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(168, 85, 247, 0.9)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Curated Matches ({items.length})
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={scrollLeft}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              lineHeight: 1
            }}
          >
            ‹
          </button>
          <button
            onClick={scrollRight}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "14px",
              lineHeight: 1
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal Poster Track */}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          scrollBehavior: "smooth",
          paddingBottom: "8px",
          width: "100%"
        }}
      >
        {items.map((item) => (
          <div key={`rec-${item.id}`} style={{ width: "125px", flexShrink: 0 }}>
            <PremiumMediaCard
              media={item}
              onClick={() => onSelectMedia?.({ id: item.id, mediaType: item.media_type || "movie" })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AiAssistantModal({ isOpen, onClose, onSelectMedia }: AiAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to the DoBinge Neural Core. Describe how you want to feel, or ask for recommendations based on your taste profile."
    }
  ]);
  const [inputPrompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  if (!isOpen) return null;

  // ── RECORD & LEARN USER TASTE ──
  const recordUserTastePreference = async (queryText: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingPref } = await supabase
          .from("user_preferences")
          .select("mood_preferences")
          .eq("user_id", user.id)
          .single();

        const currentMoods: string[] = existingPref?.mood_preferences || [];
        if (!currentMoods.includes(queryText)) {
          const updatedMoods = [queryText, ...currentMoods].slice(0, 15);
          await supabase.from("user_preferences").upsert({
            user_id: user.id,
            mood_preferences: updatedMoods,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        const guestData = getGuestData();
        if (!guestData.moods.includes(queryText)) {
          guestData.moods = [queryText, ...guestData.moods].slice(0, 15);
          saveGuestData(guestData);
        }
      }
    } catch (e) {
      console.warn("Taste learning recording bypassed:", e);
    }
  };

  // ── EXTRACT USER HISTORY FOR AI CONTEXT ──
  const getUserHistorySummary = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("interactions")
        .select("media_id, interaction_type")
        .eq("user_id", user.id);

      return {
        liked: data?.filter(i => i.interaction_type === "liked").map(i => i.media_id) || [],
        watched: data?.filter(i => i.interaction_type === "watched").map(i => i.media_id) || [],
        watchlist: data?.filter(i => i.interaction_type === "watchlist").map(i => i.media_id) || []
      };
    } else {
      const guestData = getGuestData();
      return {
        liked: guestData.interactions.filter(i => i.interaction_type === "liked").map(i => i.media_id),
        watched: guestData.interactions.filter(i => i.interaction_type === "watched").map(i => i.media_id),
        watchlist: guestData.interactions.filter(i => i.interaction_type === "watchlist").map(i => i.media_id)
      };
    }
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isAnalyzing) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = { id: userMsgId, sender: "user", text: queryText };
    
    setMessages(prev => [...prev, newUserMsg]);
    setPrompt("");
    setIsAnalyzing(true);

    // Save prompt to update user's taste profile
    recordUserTastePreference(queryText);

    try {
      const userHistory = await getUserHistorySummary();

      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: queryText, userHistory }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.aiMessage || "Here are the top matches curated for your vibe:",
        recommendations: data.recommendations || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: "ai", text: "My neural core experienced a hiccup. Please re-transmit your vibe prompt." }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", boxSizing: "border-box" }}>
        
        {/* BACKDROP */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 1, 4, 0.85)", backdropFilter: "blur(16px)" }} 
        />

        {/* LIQUID GLASS DIALOG CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: "relative", 
            zIndex: 10, 
            width: "100%", 
            maxWidth: "680px", 
            height: "82vh", 
            maxHeight: "720px",
            borderRadius: "32px", 
            backgroundColor: "rgba(11, 7, 20, 0.88)", 
            border: "1px solid rgba(168, 85, 247, 0.25)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.1)",
            display: "flex", 
            flexDirection: "column", 
            overflow: "hidden", 
            backdropFilter: "blur(24px)"
          }}
        >
          {/* HEADER */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#a855f7", boxShadow: "0 0 12px #a855f7" }} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                DoBinge <span style={{ color: "#a855f7" }}>Neural Core</span>
              </h2>
            </div>
            <button 
              onClick={onClose} 
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>

          {/* CHAT MESSAGES STREAM */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start", width: "100%" }}>
                
                {/* MESSAGE BUBBLE */}
                <div style={{
                  maxWidth: "85%", 
                  padding: "14px 20px", 
                  borderRadius: "20px",
                  backgroundColor: msg.sender === "user" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  border: msg.sender === "user" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#ffffff", 
                  fontSize: "13px", 
                  lineHeight: "1.5", 
                  fontWeight: 500,
                  boxShadow: msg.sender === "user" ? "0 10px 20px rgba(168, 85, 247, 0.15)" : "none"
                }}>
                  {msg.text}
                </div>

                {/* POSTER CAROUSEL INLINE IN CHAT */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <ChatPosterCarousel 
                    items={msg.recommendations} 
                    onSelectMedia={onSelectMedia} 
                  />
                )}

              </div>
            ))}

            {isAnalyzing && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", color: "rgba(168, 85, 247, 0.8)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#a855f7", animation: "pulse 1.2s infinite" }} />
                Calibrating Taste Core...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* PRESET CHIPS */}
          <div className="no-scrollbar" style={{ padding: "0 24px", display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
            {PRESET_VIBES.map((vibe, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(vibe)}
                style={{ 
                  padding: "6px 14px", 
                  borderRadius: "14px", 
                  backgroundColor: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  color: "rgba(255,255,255,0.7)", 
                  fontSize: "10px", 
                  fontWeight: 600, 
                  cursor: "pointer", 
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
              >
                {vibe}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div style={{ padding: "16px 24px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(5, 2, 10, 0.5)" }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputPrompt); }} style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your mood, genre preference, or aesthetic..."
                style={{ 
                  flex: 1, 
                  padding: "14px 20px", 
                  borderRadius: "18px", 
                  backgroundColor: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  color: "#fff", 
                  fontSize: "12px", 
                  outline: "none" 
                }}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !inputPrompt.trim()}
                style={{ 
                  padding: "0 24px", 
                  borderRadius: "18px", 
                  border: "none", 
                  background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", 
                  color: "#fff", 
                  fontSize: "11px", 
                  fontWeight: 900, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.08em",
                  cursor: isAnalyzing || !inputPrompt.trim() ? "not-allowed" : "pointer" 
                }}
              >
                Transmit
              </button>
            </form>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}