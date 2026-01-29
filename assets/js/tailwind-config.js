tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#FF6B00",
        "primary-hover": "#e56000",
        "background-light": "#ffffff",
        "background-dark": "#f9f9f9",
        "surface-light": "#ffffff",
        "surface-dark": "#ffffff",
        "text-main": "#333333",
        "text-muted": "#666666"
      },
      fontFamily: {
        "display": ["Work Sans", "Noto Sans", "Noto Sans Thai", "sans-serif"],
        "body": ["Work Sans", "Noto Sans", "Noto Sans Thai", "sans-serif"]
      },
      borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
    },
  },
}
