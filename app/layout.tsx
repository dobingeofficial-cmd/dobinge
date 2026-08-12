import type { Metadata, Viewport } from "next";
import "./globals.css";

// ── 1. IMPORT GLOBAL AUTH CONTEXT ──
import { AuthModalProvider } from "@/context/AuthModalContext";

export const metadata: Metadata = {
  title: "DoBinge — Discover Your Next Obsession",
  description: "Futuristic Cinematic Entertainment Discovery Platform powered by Gemini AI",
  keywords: ["movies", "streaming", "anime", "recommendations", "ai", "tv shows", "binge"],
  authors: [{ name: "Danish Khan" }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000", // 🚨 UPGRADE: True Pitch Black Theme
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="hide-scrollbar" style={{ scrollBehavior: "smooth" }}>
      <body 
        suppressHydrationWarning 
        style={{ 
          margin: 0, 
          padding: 0,
          backgroundColor: "#000000", // 🚨 UPGRADE: True Pitch Black Base
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          overflowX: "hidden",
          width: "100%",
          maxWidth: "100vw",
          position: "relative",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale"
        }}
      >
        <AuthModalProvider>
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}