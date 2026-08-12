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
        const { data, error } = await supabase
          .from("user_preferences")
          .select("user_id")
          .eq("user_id", session.user.id);

        if (data && data.length > 0) {
          console.log("Verified returning user. Bypassing onboarding.");
          localStorage.setItem("dobinge_onboarded", "true"); 
          router.replace("/home"); 
        } else {
          console.log("New user detected. Routing to Onboarding.");
          router.replace("/mood");
        }
      } catch (err) {
        console.error("Database routing verification failed:", err);
        if (isMounted) setIsVerifying(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyIdentityAndRoute(session);
    });

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

  if (isVerifying) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
         <div style={{ width: "30px", height: "30px", border: "2px solid transparent", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
         <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <LandingView />;
}