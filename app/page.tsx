"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LandingView from "@/components/ui/landing-view";

export default function Page() {
  const router = useRouter();
  const supabase = createClient();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyIdentityAndRoute = async (session: any) => {
      if (!session?.user) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      try {
        // 🚨 THE HARD FIX: Directly query Supabase Database to see if this user has set up their account
        const { data, error } = await supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", session.user.id);

        // .eq() returns an array. If it has length > 0, your row exists!
        if (data && data.length > 0) {
          console.log("Verified returning user. Bypassing onboarding.");
          localStorage.setItem("dobinge_onboarded", "true"); // Sync local lock
          
          // Physically route them to the app/home/page.tsx folder
          router.replace("/home"); 
        } else {
          console.log("New user detected. Routing to Onboarding.");
          // Physically route them to the app/mood/page.tsx folder
          router.replace("/mood");
        }
      } catch (err) {
        console.error("Database routing verification failed:", err);
        if (isMounted) setIsVerifying(false);
      }
    };

    // 1. Initial Check on Mount (When Google redirects you back here)
    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyIdentityAndRoute(session);
    });

    // 2. Real-time Listener for OAuth Redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        verifyIdentityAndRoute(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // 🚨 CINEMATIC LOCK: Show pitch black while querying the database so the user sees NO flashing UI
  if (isVerifying) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
         <div style={{ width: "30px", height: "30px", border: "2px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
         <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If they are genuinely not logged in, render the beautiful Landing Page
  return <LandingView />;
}