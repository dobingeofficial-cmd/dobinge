"use client";

import React from "react";
// 🚨 Using strict relative paths to bypass the VS Code alias glitch
import { useView } from "../context/ViewContext";
import LandingView from "../components/ui/landing-view";
import AuthView from "../components/ui/auth-view";
import HomeView from "../components/ui/home-view"; 

// NOTE: Uncomment these as you integrate them into your global state
// import MoodView from "../components/ui/mood-view";
// import FavoritesView from "../components/ui/favorites-view";
// import SearchView from "../components/ui/search-view";
// import SavedView from "../components/ui/saved-view";
// import ProfileView from "../components/ui/profile-view";

export default function Page() {
  const { currentView, setCurrentView } = useView();

  // Route rendering based strictly on the global ViewContext state
  switch (currentView) {
    case "landing":
      return <LandingView />;
    case "auth":
      return <AuthView />;
    case "home":
      return <HomeView setView={setCurrentView} />;
    
    // Uncomment these as you integrate them into the global state!
    /*
    case "mood":
      return <MoodView />;
    case "favorites":
      return <FavoritesView />;
    case "search":
      return <SearchView />;
    case "saved":
      return <SavedView />;
    case "profile":
      return <ProfileView />;
    */
    
    default:
      // Failsafe: if the view string is unrecognized, render Home
      return <HomeView setView={setCurrentView} />;
  }
}