"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getGuestData, clearGuestData } from "@/lib/store/guestStore";
import AuthModal from "@/components/ui/auth-modal";

interface AuthModalContextType {
  requireAuth: (action: () => Promise<void> | void) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);

  const requireAuth = async (action: () => Promise<void> | void) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await action(); // Already logged in, execute immediately
    } else {
      setPendingAction(() => action);
      setIsOpen(true); // Pop the glassmorphic modal
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setPendingAction(null);
  };

  const handleMigrationAndExecution = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // 1. Migrate Guest Data (Interactions)
    const guestData = getGuestData();
    if (guestData.interactions.length > 0) {
      const payload = guestData.interactions.map(interaction => ({
        user_id: user.id,
        ...interaction
      }));
      await supabase.from("interactions").upsert(payload, { onConflict: 'user_id,media_id,interaction_type' });
    }

    // 2. Migrate Favorites & Moods (Preferences)
    if (guestData.moods.length > 0 || guestData.favorites.genres.length > 0) {
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        favorite_genres: guestData.favorites.genres,
        favorite_movies: guestData.favorites.movies,
        favorite_tv: guestData.favorites.tv,
        favorite_anime: guestData.favorites.anime,
        mood_preferences: guestData.moods,
        updated_at: new Date().toISOString()
      });
    }

    // 3. Clear Local Guest Store to prevent future sync loops
    clearGuestData();

    // 4. Execute the Pending Action (e.g., Like, Watchlist) seamlessly
    if (pendingAction) {
      await pendingAction();
    }

    closeModal();
  };

  return (
    <AuthModalContext.Provider value={{ requireAuth, closeModal }}>
      {children}
      {/* mode="wait" ensures the exit animation finishes before unmounting */}
      <AnimatePresence mode="wait">
        {isOpen && <AuthModal onClose={closeModal} onSuccess={handleMigrationAndExecution} />}
      </AnimatePresence>
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error("useAuthModal must be used within AuthModalProvider");
  return context;
};