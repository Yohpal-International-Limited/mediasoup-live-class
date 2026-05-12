/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				ics: {
					green: "#05524A",    // Deep teal/green
					gold: "#FFBF29",     // ICS Gold
					black: "#032B27",    // Deep navy
					navy: "#021B19",     // Navy
				}
			},
			fontFamily: {
				heading: ['Outfit', 'sans-serif'],
				sans: ['Inter', 'sans-serif'],
				mono: ['DM Mono', 'monospace'],
			},
			animation: {
				blob: "blob 7s infinite",
				float: "float 6s ease-in-out infinite",
				'pulse-glow': "pulse-glow 2s ease-in-out infinite",
			},
			keyframes: {
				blob: {
					"0%": {
						transform: "translate(0px, 0px) scale(1)",
					},
					"33%": {
						transform: "translate(30px, -50px) scale(1.1)",
					},
					"66%": {
						transform: "translate(-20px, 20px) scale(0.9)",
					},
					"100%": {
						transform: "translate(0px, 0px) scale(1)",
					},
				},
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-20px)" },
				},
				'pulse-glow': {
					"0%, 100%": { opacity: 0.5, transform: "scale(1)" },
					"50%": { opacity: 1, transform: "scale(1.05)" },
				}
			},
			boxShadow: {
				'luxury': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
				'luxury-gold': '0 10px 40px -10px rgba(255, 191, 41, 0.3)',
			}
		},
	},
	plugins: [],
}
