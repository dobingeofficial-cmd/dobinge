"use client";

import React, { createContext, useContext, useState } from "react";

type ActiveView = "home" | "search" | "swipe" | "saved" | "profile";

interface ViewContextType {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  aiQueryContext: any;
  setAiQueryContext: (context: any) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ActiveView>("home");
  const [aiQueryContext, setAiQueryContext] = useState<any>(null);

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, aiQueryContext, setAiQueryContext }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error("useView must be used within a ViewProvider");
  return context;
}