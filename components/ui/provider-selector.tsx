"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NormalizedProvider } from "@/types/providers";

interface ProviderSelectorProps {
  providers: NormalizedProvider[];
  onSelect: (provider: NormalizedProvider, linkOverride?: string) => void;
  onClose: () => void;
}

export default function ProviderSelector({ providers, onSelect, onClose }: ProviderSelectorProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(2, 1, 4, 0.7)", backdropFilter: "blur(12px)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(8, 7, 13, 0.8)",
          borderRadius: "24px",
          border: "1px solid rgba(168, 85, 247, 0.2)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px"
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
        >
          ✕
        </button>

       <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "32px", filter: "drop-shadow(0 0 15px rgba(168,85,247,0.4))" }}>📺</span>
          <h3 style={{ margin: "12px 0 4px 0", fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            Select Provider
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            View availability via TMDB & JustWatch
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          {providers.map((provider) => {
            // Fallback assignments handling both snake_case (TMDB) and camelCase (Custom Normalized)
            const pId = (provider as any).id || (provider as any).provider_id || (provider as any).providerId;
            const pName = (provider as any).name || (provider as any).provider_name || (provider as any).providerName;
            const pLogo = (provider as any).logoPath || (provider as any).logo_path || (provider as any).logo;

            return (
              <motion.button
                key={pId}
                onClick={() => onSelect(provider)}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                  }}
                >
                  <img
                    src={
                      pLogo
                        ? pLogo.startsWith("/")
                          ? `https://image.tmdb.org/t/p/w92${pLogo}`
                          : pLogo
                        : undefined
                    }
                    alt={pName}
                    style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(0.85)" }}
                  />
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, flex: 1, textAlign: "left", letterSpacing: "0.01em" }}>
                  {pName}
                </span>
                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}