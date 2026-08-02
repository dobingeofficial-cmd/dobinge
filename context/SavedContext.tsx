"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MediaCard } from "@/types";

export interface WatchedHistoryItem extends MediaCard {
  userReaction?: "liked" | "disliked";
}

interface SavedContextType {
  watchlist: MediaCard[];
  likedItems: MediaCard[];
  history: WatchedHistoryItem[];
  addToWatchlist: (item: MediaCard) => void;
  removeFromWatchlist: (id: number) => void;
  addToHistory: (item: MediaCard, reaction?: "liked" | "disliked") => void;
  removeFromHistory: (id: number) => void;
  addToLikedDirectly: (item: MediaCard) => void;
  removeFromLiked: (id: number) => void;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<MediaCard[]>([]);
  const [likedItems, setLikedItems] = useState<MediaCard[]>([]);
  const [history, setHistory] = useState<WatchedHistoryItem[]>([]);

  useEffect(() => {
    try {
      const localWatch = localStorage.getItem("db_watchlist");
      const localLiked = localStorage.getItem("db_liked");
      const localHistory = localStorage.getItem("db_history");

      if (localWatch) setWatchlist(JSON.parse(localWatch));
      if (localLiked) setLikedItems(JSON.parse(localLiked));
      if (localHistory) setHistory(JSON.parse(localHistory));
    } catch (err) {
      console.error("DoBinge Context Hydration Error:", err);
    }
  }, []);

  const addToWatchlist = (item: MediaCard) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.id === item.id)) return prev;
      const updated = [...prev, item];
      localStorage.setItem("db_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      localStorage.setItem("db_watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  const addToLikedDirectly = (item: MediaCard) => {
    setLikedItems((prev) => {
      if (prev.some((l) => l.id === item.id)) return prev;
      const updated = [...prev, item];
      localStorage.setItem("db_liked", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromLiked = (id: number) => {
    setLikedItems((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem("db_liked", JSON.stringify(updated));
      return updated;
    });
  };

  const addToHistory = (item: MediaCard, reaction?: "liked" | "disliked") => {
    setHistory((prev) => {
      if (prev.some((h) => h.id === item.id)) return prev;
      const updatedItem: WatchedHistoryItem = { ...item, userReaction: reaction };
      const updated = [...prev, updatedItem];
      localStorage.setItem("db_history", JSON.stringify(updated));
      return updated;
    });

    if (reaction === "liked") {
      addToLikedDirectly(item);
    }
  };

  const removeFromHistory = (id: number) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      localStorage.setItem("db_history", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SavedContext.Provider
      value={{
        watchlist,
        likedItems,
        history,
        addToWatchlist,
        removeFromWatchlist,
        addToHistory,
        removeFromHistory,
        addToLikedDirectly,
        removeFromLiked,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSavedContext() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSavedContext requires an active SavedProvider layout wrapper.");
  return context;
}