"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      width: "100vw", 
      height: "100dvh", /* Uses dynamic viewport height to eliminate mobile browser chrome gaps */
      backgroundColor: "#05000a", /* DoBinge Pitch Black */
      color: "#ffffff",
      overflow: "hidden", 
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
      zIndex: 40 /* Forces the view above any lingering layout borders without covering modals */
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