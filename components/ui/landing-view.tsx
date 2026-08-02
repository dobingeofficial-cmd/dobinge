"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useView } from "@/context/ViewContext";

export default function LandingView() {
  const { setCurrentView } = useView(); // 🚨 NEW: Use the global router, not Next.js router
  
  const compRef = useRef<HTMLDivElement>(null); 
  const maskWrapperRef = useRef<HTMLDivElement>(null);
  const maskRingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    // ── 🛡️ GSAP CONTEXT ──
    const ctx = gsap.context(() => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      gsap.set(maskWrapperRef.current, { x: centerX - 180, y: centerY - 180 });
      if (gridRef.current) gsap.set(gridRef.current, { "--x": `${centerX}px`, "--y": `${centerY}px` });

      const tl = gsap.timeline();
      tl.fromTo(logoRef.current, { opacity: 0, x: -15 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, "0s")
        .fromTo(skipRef.current, { opacity: 0, x: 15 }, { opacity: 0.45, x: 0, duration: 1, ease: "power3.out" }, "0s")
        .fromTo(textRef.current, { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "power4.out" }, "0.2s")
        .fromTo(taglineRef.current, { opacity: 0, y: 15 }, { opacity: 0.6, y: 0, duration: 1.2, ease: "power3.out" }, "0.6s")
        .fromTo(buttonRef.current, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, "0.9s")
        .fromTo(maskWrapperRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: "elastic.out(1, 0.75)" }, "0.5s");

      gsap.to(maskRingRef.current, { y: 15, x: 10, rotation: 4, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, compRef);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      gsap.to(maskWrapperRef.current, { x: clientX - 180, y: clientY - 180, duration: 0.25, ease: "power2.out" });
      if (gridRef.current) gsap.to(gridRef.current, { "--x": `${clientX}px`, "--y": `${clientY}px`, duration: 0.25, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const fetchTMDB = async () => {
      try {
        const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
        if (!proxyUrl) return;
        const [res1, res2] = await Promise.all([ fetch(`${proxyUrl}/api/trending/all/week?region=IN&page=1`), fetch(`${proxyUrl}/api/trending/all/week?region=IN&page=2`) ]);
        if (!res1.ok || !res2.ok) throw new Error("Edge API Error");
        const data1 = await res1.json();
        const data2 = await res2.json();
        const imageUrls = [...data1.results, ...data2.results].filter((i: any) => i.poster_path).map((i: any) => `${proxyUrl}/image/t/p/w500${i.poster_path}`);
        setPosters([...imageUrls, ...imageUrls, ...imageUrls].slice(0, 100));
      } catch (error) {
        console.error("Fetch Failed", error);
      }
    };
    fetchTMDB();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert(); 
    };
  }, []);

  // 🚨 NEW: Advance to Auth using the Context Router
  const handleProceed = () => {
    setCurrentView("auth");
  };

  return (
    <main ref={compRef} style={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#000000", backgroundImage: "radial-gradient(circle at center, rgba(139, 92, 246, 0.03) 0%, transparent 70%)", overflow: "hidden", cursor: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 50%, #000000 100%)", pointerEvents: "none", zIndex: 1 }} />
      <div ref={gridRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", WebkitMaskImage: "radial-gradient(circle 210px at var(--x, 50vw) var(--y, 50vh), black 30%, transparent 100%)", maskImage: "radial-gradient(circle 210px at var(--x, 50vw) var(--y, 50vh), black 30%, transparent 100%)" } as React.CSSProperties}>
        <div className="gap-4 p-4 h-full w-full transform scale-105 opacity-90" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gridAutoRows: "max-content" }}>
          {posters.length > 0 ? posters.map((url, i) => <div key={i} style={{ aspectRatio: "2/3", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)", boxShadow: "0 10px 30px rgba(0,0,0,0.7)", filter: "brightness(1.05) contrast(1.05)" }} />) : [...Array(100)].map((_, i) => <div key={i} className="bg-[#050208] border border-white/5" style={{ aspectRatio: "2/3", borderRadius: "12px" }} />)}
        </div>
      </div>
      <div ref={maskWrapperRef} style={{ position: "fixed", top: 0, left: 0, width: "360px", height: "360px", zIndex: 10, pointerEvents: "none" }}>
        <div ref={maskRingRef} style={{ width: "100%", height: "100%", borderRadius: "50%", border: "1.5px solid rgba(168, 85, 247, 0.35)", background: "radial-gradient(circle, transparent 60%, rgba(139, 92, 246, 0.05) 100%)", boxShadow: "inset 0 0 40px rgba(168, 85, 247, 0.2), 0 0 30px rgba(168, 85, 247, 0.1)", mixBlendMode: "screen", transition: "box-shadow 0.3s ease" }} />
      </div>
      <div style={{ position: "absolute", top: "40px", left: "48px", right: "48px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 50 }}>
        <div ref={logoRef} onClick={handleProceed} style={{ pointerEvents: "auto", cursor: "pointer" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}><span style={{ color: "#E5E7EB" }}>Do</span><span style={{ color: "#a855f7", filter: "drop-shadow(0 0 10px rgba(168,85,247,0.4))" }}>Binge</span></h1>
        </div>
        <button ref={skipRef} onClick={handleProceed} style={{ pointerEvents: "auto", padding: "10px 24px", borderRadius: "30px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", color: "#ffffff", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.3s ease" }}>Skip Intro</button>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none", marginTop: "-40px" }}>
        <h2 ref={textRef} style={{ fontSize: "4.4rem", fontWeight: 900, color: "#ffffff", textAlign: "center", letterSpacing: "-0.03em", lineHeight: "1.1", textShadow: "0 10px 40px rgba(0,0,0,0.6)", margin: "0 0 20px 0" }}>Discover Your Next <br /><span style={{ background: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Obsession</span></h2>
        <p ref={taglineRef} style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#E5E7EB", letterSpacing: "0.02em", maxWidth: "500px", textAlign: "center", lineHeight: "1.6" }}>AI-powered recommendations for movies, series & anime in under 30 seconds.</p>
      </div>
      <div ref={buttonRef} style={{ position: "absolute", bottom: "15%", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 50, pointerEvents: "none" }}>
        <button onClick={handleProceed} style={{ pointerEvents: "auto", padding: "16px 48px", borderRadius: "32px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", color: "#ffffff", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)" }}>Discover <span style={{ fontSize: "13px", color: "#c084fc", fontWeight: 400 }}>→</span></button>
      </div>
    </main>
  );
}