/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                serif:   ['Newsreader', 'Georgia', 'serif'],
                display: ['Newsreader', 'Georgia', 'serif'],
            },
            colors: {
                // ── Stitch "Sage & Slate Sanctuary" Design System ──
                // Primary — Deep Sage Green (growth, healing)
                sage: {
                    50:  '#f4f7f4',
                    100: '#e7fff1',
                    200: '#b0f1cd',
                    300: '#94d4b2',
                    400: '#4ade80',
                    500: '#2d6b4f',
                    600: '#0f5238',
                    700: '#0c5137',
                    800: '#0a3d29',
                    900: '#20342b',
                    950: '#0b1f17',
                },
                // Secondary — Muted sage (supporting tones)
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
                // Surface hierarchy
                surface: {
                    base:    '#e7fff1',
                    low:     '#e1f9eb',
                    DEFAULT: '#dcf4e5',
                    high:    '#d6eee0',
                    highest: '#d0e8da',
                    lowest:  '#ffffff',
                    dim:     '#c8e0d2',
                    tint:    '#2b694e',
                    variant: '#d0e8da',
                },
                // Neutral tones
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
                // Backwards compat
                wood:  {
                    50: '#f4f7f4', 100: '#e6ede6', 200: '#cddcce',
                    300: '#a7c2a9', 400: '#7ba47e', 500: '#5a8a5e',
                    600: '#466f49', 700: '#3a5a3d', 800: '#314933',
                    900: '#293d2c', 950: '#132116',
                },
                beige: {
                    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
                    300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6',
                    600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6',
                    900: '#4c1d95', 950: '#2e1065',
                },
                cream: {
                    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
                    300: '#fdba74', 400: '#fb923c', 500: '#f97316',
                },
            },
            boxShadow: {
                'ambient': '0 20px 40px rgba(11, 31, 23, 0.06)',
                'card':    '0 4px 24px rgba(11, 31, 23, 0.08)',
                'elevated':'0 8px 48px rgba(11, 31, 23, 0.12)',
                'sage':    '0 8px 28px rgba(15, 82, 56, 0.25)',
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '24px',
                '4xl': '32px',
            },
            backgroundImage: {
                'sage-gradient': 'linear-gradient(135deg, #0f5238, #2d6b4f)',
                'lavender-gradient': 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            },
        },
    },
    plugins: [],
}
