import { Sora } from "next/font/google";
import "./globals.css"; // Assuming your global CSS is imported here

// 1. Configure Sora with exact weights and swap display to prevent layout shifts
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata = {
  title: "DoBinge | Discover Your Next Obsession",
  description: "AI-powered recommendations for movies, series & anime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. Inject the Sora CSS variable into the HTML tag
    <html lang="en" className={`${sora.variable}`}>
      {/* 3. Apply the global sans font class, which we will map to Sora in Tailwind */}
      <body className="font-sans antialiased bg-[#000000] text-white">
        {children}
      </body>
    </html>
  );
}