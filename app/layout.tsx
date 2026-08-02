import type { Metadata, Viewport } from "next";
import "./globals.css";

// ── 1. IMPORT GLOBAL AUTH CONTEXT (Fixed path to singular 'context') ──
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
  themeColor: "#020104",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="hide-scrollbar" style={{ scrollBehavior: "smooth" }}>
      {/* suppressHydrationWarning blocks ColorZilla and other extension injection crashes */}
      <body 
        suppressHydrationWarning 
        style={{ 
          margin: 0, 
          padding: 0,
          backgroundColor: "#020104", 
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          overflowX: "hidden",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale"
        }}
      >
        {/* ── 2. WRAP APPLICATION IN AUTH PROVIDER ── */}
        <AuthModalProvider>
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}