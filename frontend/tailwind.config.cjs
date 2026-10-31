/**
 * Tailwind CSS configuration
 * Enables JIT mode and dark mode via class strategy.
 */
module.exports = {
  darkMode: "class", // use 'class' strategy for explicit toggle
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark palette (default)
        "canvas-dark": "#090B0F",
        "card-dark": "#11151D",
        "border-dark": "#64748B",
        "primary-dark": "#3B82F6",
        "secondary-dark": "#60A5FA",
        "text-dark": "#F8FAFC",
        "subtext-dark": "#94A3B8",
        "success-dark": "#22C55E",
        "warning-dark": "#F59E0B",
        "critical-dark": "#EF4444",
        // Light palette (fallback when .dark not present)
        "canvas-light": "#F5F5F5",
        "card-light": "#FFFFFF",
        "border-light": "#D1D5DB",
        "primary-light": "#2563EB",
        "secondary-light": "#3B82F6",
        "text-light": "#111827",
        "subtext-light": "#6B7280",
        "success-light": "#10B981",
        "warning-light": "#FBBF24",
        "critical-light": "#EF4444",
      },
    },
  },
  plugins: [],
};

