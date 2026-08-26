"use client";

import React, { useState } from "react";
import DevelopersPickView from "@/components/developers-pick/developers-pick-view";
import MediaModal from "@/components/ui/media-modal";

export default function DevelopersPickPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#000000", padding: "24px 32px", boxSizing: "border-box", overflow: "hidden" }}>
      <DevelopersPickView onSelectMedia={setSelectedMedia} />
      
      <MediaModal 
        isOpen={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        mediaId={selectedMedia?.id || null} 
        mediaType={selectedMedia?.mediaType || selectedMedia?.media_type || "movie"} 
      />
    </div>
  );
}