import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

// 🚨 ARCHITECTURAL FIX: Instantiate Sora with exact weights and CSS variable injection
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap", // Prevents Layout Shift (CLS) for Core Web Vitals
});

export const metadata: Metadata = {
  title: "DoBinge | Discover Your Next Obsession",
  description: "AI-powered recommendations for movies, series & anime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🚨 The variable is injected at the highest possible DOM level
    <html lang="en" className={`${sora.variable}`}>
      {/* font-sans hooks into our Tailwind config override */}
      <body className="font-sans antialiased bg-[#000000] text-[#E5E7EB] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}