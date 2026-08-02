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
  | "profile"
  | "loading";

interface ViewContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  completeOnboarding: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>("loading");
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let isSubscribed = true;

    const checkUserStatus = async () => {
      // 1. Local Cache Check
      if (localStorage.getItem("dobinge_onboarded") === "true") {
        if (isSubscribed) {
          setCurrentView("home");
          setIsMounted(true);
        }
        return;
      }

      try {
        // 2. Session Check
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isSubscribed) {
            setCurrentView("landing");
            setIsMounted(true);
          }
          return;
        }

        // 3. Database Check (We look for your exact user_id row seen in Supabase)
        const { data, error } = await supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", session.user.id);

        if (data && data.length > 0) {
          // 🚨 PREFERENCE FOUND: Lock it locally and bypass onboarding forever!
          localStorage.setItem("dobinge_onboarded", "true");
          if (isSubscribed) {
            setCurrentView("home");
          }
        } else {
          if (isSubscribed) {
            setCurrentView("landing");
          }
        }
      } catch (err) {
        console.error("Auth check fault:", err);
        if (isSubscribed) {
          setCurrentView("landing");
        }
      } finally {
        if (isSubscribed) {
          setIsMounted(true);
        }
      }
    };

    checkUserStatus();

    // Listen for auth state changes (Google login redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        if (session?.user) {
          const { data } = await supabase
            .from("user_preferences")
            .select("user_id")
            .eq("user_id", session.user.id);

          if (data && data.length > 0) {
            localStorage.setItem("dobinge_onboarded", "true");
            if (isSubscribed) setCurrentView("home");
          }
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const completeOnboarding = () => {
    localStorage.setItem("dobinge_onboarded", "true");
    setCurrentView("home");
  };

  if (!isMounted || currentView === "loading") {
    return <div style={{ width: "100vw", height: "100vh", backgroundColor: "#020104" }} />;
  }

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