"use client";

import React from "react";
import HomeView from "@/components/ui/home-view";
import { useModal } from "@/context/ModalContext";

export default function HomePage() {
  const { setSelectedMedia } = useModal();

  return (
    <div style={{ width: "100%", minHeight: "100%" }}>
      <HomeView onSelectMedia={setSelectedMedia} />
    </div>
  );
}