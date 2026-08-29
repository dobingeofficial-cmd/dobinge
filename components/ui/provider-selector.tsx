// src/components/ui/provider-selector.tsx

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NormalizedProvider } from "@/types/providers";

interface ProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  providers: NormalizedProvider[];
  onSelect: (provider: NormalizedProvider) => void;
}

export default function ProviderSelector({ isOpen, onClose, providers, onSelect }: ProviderSelectorProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{ position: "relative", width: "100%", maxWidth: "360px", padding: "24px", borderRadius: "20px", background: "linear-gradient(145deg, rgba(20,10,30,0.95) 0%, rgba(5,0,10,0.98) 100%)", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Watch On</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "14px", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
            {providers.map((p) => (
              <motion.div
                key={p.providerId}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(168,85,247,0.15)", borderColor: "rgba(168,85,247,0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(p)}
                style={{ display: "flex", alignItems: "center", justifyContent: "between", padding: "12px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "all 0.2s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {p.logoPath && (
                    <img src={`https://image.tmdb.org/t/p/w92${p.logoPath}`} alt={p.providerName} style={{ width: "24px", height: "24px", borderRadius: "6px", objectFit: "cover" }} />
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{p.providerName}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(168,85,247,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", marginLeft: "auto" }}>{p.providerCategory}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}