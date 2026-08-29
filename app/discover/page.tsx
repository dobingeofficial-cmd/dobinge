"use client";

import React, { useState } from "react";
import DiscoverView from "@/components/discover/discover-view";
import MediaModal from "@/components/ui/media-modal";

export default function DiscoverPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  return (
    <div className="w-full h-[calc(100vh-32px)] bg-[#05000a] text-white flex flex-col relative overflow-hidden box-border rounded-tl-3xl border-t border-l border-white/5">
      {/* Safe Ambient Glow */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[140px] rounded-full pointer-events-none z-0" />

      <div className="flex-1 w-full h-full relative z-10 p-6 md:p-10 overflow-hidden">
        <DiscoverView onSelectMedia={setSelectedMedia} />
      </div>
      
      <MediaModal 
        isOpen={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        mediaId={selectedMedia?.id || null} 
        mediaType={selectedMedia?.mediaType || selectedMedia?.media_type || "movie"} 
      />
    </div>
  );
}