/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ocean: {
          primary: "#2563EB", // blue
          secondary: "#F59E0B", // amber
          success: "#F59E0B",
          error: "#EF4444",
          bg: "#f9fafb",
          surface: "#ffffff",
          text: "#111827"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)"
      },
      borderRadius: {
        xl: "0.75rem"
      }
    }
  },
  plugins: []
};
