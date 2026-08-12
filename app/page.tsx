"use client";

import React from "react";
import LandingView from "@/components/ui/landing-view";

export default function Page() {
  // 🚨 STARTUP ROUTING: The Landing Page is the permanent front door.
  // We do not auto-redirect on load. We want everyone to experience the Obsidian Cinema reveal.
  return <LandingView />;
}