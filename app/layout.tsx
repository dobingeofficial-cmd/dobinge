import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoBinge | Discover Your Next Obsession",
  description: "A premium, cinematic discovery platform for movies, web series, and anime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className="antialiased"
        style={{ 
          backgroundColor: "#08070D", 
          color: "#ffffff", 
          margin: 0, 
          padding: 0,
          overflowX: "hidden" 
        }} 
      >
        {children}
      </body>
    </html>
  );
}