/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            colors: {
                // Primary — Sage green (calming, nature-inspired)
                sage: {
                    50:  '#f4f7f4',
                    100: '#e6ede6',
                    200: '#cddcce',
                    300: '#a7c2a9',
                    400: '#7ba47e',
                    500: '#5a8a5e',
                    600: '#466f49',
                    700: '#3a5a3d',
                    800: '#314933',
                    900: '#293d2c',
                    950: '#132116',
                },
                // Secondary — Lavender (soft, emotionally supportive)
                lavender: {
                    50:  '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                // Accent — Warm peach (friendly, approachable)
                peach: {
                    50:  '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                },
                // Neutral — Warm slate (clean, readable)
                slate: {
                    50:  '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Keep wood for backward compat (maps to sage)
                wood: {
                    50:  '#f4f7f4',
                    100: '#e6ede6',
                    200: '#cddcce',
                    300: '#a7c2a9',
                    400: '#7ba47e',
                    500: '#5a8a5e',
                    600: '#466f49',
                    700: '#3a5a3d',
                    800: '#314933',
                    900: '#293d2c',
                    950: '#132116',
                },
                beige: {
                    50:  '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                cream: {
                    50:  '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                },
            },
        },
    },
    plugins: [],
}
