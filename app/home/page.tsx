"use client";

import React, { useState } from "react";
import HomeView from "@/components/ui/home-view";
import MediaModal from "@/components/ui/media-modal"; // Adjust this import path if your modal is saved elsewhere (e.g., @/components/home/media-modal)

export default function HomePage() {
  // 🚨 STATE MANAGER: This catches the movie data when a poster is clicked
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div style={{ width: "100%", minHeight: "100%" }}>
      {/* Pass the state setter down into the HomeView */}
      <HomeView onSelectMedia={(media) => setSelectedMedia(media)} />
      
      {/* Mount the Modal globally over the entire page */}
      <MediaModal 
        isOpen={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        mediaId={selectedMedia?.id || null} 
        mediaType={selectedMedia?.mediaType || selectedMedia?.media_type || "movie"} 
      />
    </div>
  );
}