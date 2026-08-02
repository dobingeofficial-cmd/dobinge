"use client";

import { motion } from "framer-motion";

export default function MoreView() {
  return (
    <div 
      style={{
        width: "100%",
        minHeight: "calc(100vh - 110px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "20px"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "rgba(10, 10, 10, 0.4)",
          borderRadius: "24px",
          padding: "48px 32px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0px rgba(255, 255, 255, 0.05), 0 0 40px rgba(168, 85, 247, 0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          textAlign: "center",
          overflow: "hidden"
        }}
      >
        {/* Ambient Purple Backlight Accent */}
        <div 
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(0,0,0,0) 75%)",
            filter: "blur(50px)",
            pointerEvents: "none"
          }}
        />

        {/* Minimalist Futuristic Icon Container */}
        <div 
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </div>

        {/* Cinematic Header Text */}
        <h2 
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            margin: "0 0 12px 0"
          }}
        >
          The Vault &bull; Options Portal
        </h2>

        <p 
          style={{
            fontSize: "0.85rem",
            color: "#6B7280",
            maxWidth: "460px",
            margin: "0 auto",
            lineHeight: "1.6",
            letterSpacing: "0.01em"
          }}
        >
          We are currently engineering custom advanced capabilities. This dedicated space will house achievements, watch parties, community subreddits, and third-party integrations.
        </p>
      </motion.div>
    </div>
  );
}