"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh", /* STRICT LOCK: Prevents the page from growing */
      maxHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#05000a", 
      color: "#ffffff",
      overflow: "hidden", /* KILLS GLOBAL SCROLL */
      margin: 0,
      padding: 0,
      boxSizing: "border-box"
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