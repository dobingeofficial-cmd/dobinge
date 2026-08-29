"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "#05000a", // Deep pitch black
      color: "#ffffff",
      overflow: "hidden", 
      margin: 0,
      padding: 0,
      position: "fixed",
      top: 0,
      left: 0
    }}>
      <DiscoverView onSelectMedia={setSelectedMedia} />
      
      <MediaModal 
        isOpen={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        mediaId={selectedMedia?.id || null} 
        mediaType={selectedMedia?.mediaType || selectedMedia?.media_type || "movie"} 
      />
    </div>
  );
}