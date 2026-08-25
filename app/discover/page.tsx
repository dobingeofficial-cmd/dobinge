"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    // 🚨 HARD FIX: Bottom padding is now 0px so the grid bleeds all the way to the bottom edge of the screen.
    <div style={{ width: "100%", height: "calc(100vh - 40px)", padding: "24px 32px 0px 32px", boxSizing: "border-box", overflow: "hidden" }}>
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