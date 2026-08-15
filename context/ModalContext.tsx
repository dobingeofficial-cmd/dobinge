"use client";

import React, { createContext, useContext, useState } from "react";

interface ModalContextType {
  selectedMedia: any | null;
  setSelectedMedia: (media: any | null) => void;
  isAiOpen: boolean;
  setIsAiOpen: (isOpen: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ selectedMedia, setSelectedMedia, isAiOpen, setIsAiOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};