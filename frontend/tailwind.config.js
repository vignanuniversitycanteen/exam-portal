/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                vignan: {
                    blue: "#003366", // Deep Navy Blue
                    lightBlue: "#004d99",
                    green: "#008037", // Vignan Green
                    yellow: "#fdb913", // Vignan Yellow/Gold
                    orange: "#f37021",
                }
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)"],
                mono: ["var(--font-geist-mono)"],
            },
        },
    },
    plugins: [],
};
