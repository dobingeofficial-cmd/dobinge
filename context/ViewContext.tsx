"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type ViewState = 
  | "landing" 
  | "mood" 
  | "favorites" 
  | "auth" 
  | "home" 
  | "search" 
  | "swipe" 
  | "saved" 
  | "profile";

interface ViewContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  completeOnboarding: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize Supabase client
  const supabase = createClient();

  useEffect(() => {
    const secureInitialization = async () => {
      // 1. FAST PATH: Check local memory first (prevents loading flicker for active devices)
      const localOnboarded = localStorage.getItem("dobinge_onboarded");

      if (localOnboarded === "true") {
        setCurrentView("home");
        setIsMounted(true);
        return;
      }

      // 2. HARD FIX PATH: If local memory is wiped, check the Supabase Database
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // The user logged in, but their cache was cleared. 
          // Do they have existing preferences in the database?
          const { data: prefData } = await supabase
            .from("user_preferences")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          if (prefData) {
            // SUCCESS: Supabase recognizes them as a returning user.
            // Restore the local lock so we don't have to query the database next time!
            localStorage.setItem("dobinge_onboarded", "true");
            setCurrentView("home");
          } else {
            // They are logged in, but they genuinely have never set up their account.
            setCurrentView("landing");
          }
        } else {
          // They are a brand new guest user.
          setCurrentView("landing");
        }
      } catch (error) {
        console.error("DoBinge Auth Sync Failed:", error);
        setCurrentView("landing"); // Safe fallback
      }

      setIsMounted(true);
    };

    secureInitialization();
  }, [supabase]);

  const completeOnboarding = () => {
    localStorage.setItem("dobinge_onboarded", "true");
    setCurrentView("home");
  };

  if (!isMounted) return null;

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, completeOnboarding }}>
      {children}
    </ViewContext.Provider>
  );
}

export const useView = () => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return context;
};