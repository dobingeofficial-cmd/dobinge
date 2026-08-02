"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Define all possible views in your application
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
  completeOnboarding: () => void; // 🚨 NEW: Dedicated function to lock onboarding
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  // We default to 'home' temporarily to prevent a flash of the landing page on reload
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 🚨 THE INTERCEPTOR: Check local memory the millisecond the app boots
    const hasOnboarded = localStorage.getItem("dobinge_onboarded");

    if (hasOnboarded === "true") {
      // Returning User: Bypass the entire initiation sequence
      setCurrentView("home");
    } else {
      // New User: Force them through the cinematic intro
      setCurrentView("landing");
    }
    
    setIsMounted(true);
  }, []);

  // 🚨 THE LOCK: Call this when a user finishes selecting their favorites
  const completeOnboarding = () => {
    localStorage.setItem("dobinge_onboarded", "true");
    setCurrentView("home");
  };

  // Prevent hydration mismatch flashes during the memory check
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