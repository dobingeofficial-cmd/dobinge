"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    // 🚨 HARD FIX: Lock the viewport to exactly 100vh minus the header. Overflow is strictly hidden globally.
    <div style={{ width: "100%", height: "calc(100vh - 80px)", padding: "24px 32px", boxSizing: "border-box", overflow: "hidden" }}>
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