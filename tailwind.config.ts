import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme"; // 🚨 FIXED: Now using default import

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🚨 ADDED: Global Sora Injection using defaultTheme
      fontFamily: {
        sans: ["var(--font-sora)", ...defaultTheme.fontFamily.sans],
      },
      // 🛡️ UNTOUCHED: Your locked-in Obsidian design language
      colors: {
        brand: {
          black: "#000000",
          purple: "#8B5CF6",
          violet: "#A78BFA",
          darkViolet: "#7C3AED",
          silver: "#E5E7EB",
        },
      },
      boxShadow: {
        'liquid-glow': '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #8B5CF6, #E5E7EB)',
        'dark-radial': 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, #000000 100%)',
      },
    },
  },
  plugins: [],
};
export default config;