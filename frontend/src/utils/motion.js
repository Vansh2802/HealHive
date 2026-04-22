/**
 * HealHive Motion System
 * Shared Framer Motion variants for consistent, calming animations.
 * All durations are gentle — this is a mental health platform.
 */

// ─── Easing presets ─────────────────────────────────────────
export const ease = {
    smooth:   [0.25, 0.46, 0.45, 0.94],
    spring:   [0.43, 0.13, 0.23, 0.96],
    gentle:   [0.16, 1, 0.3, 1],
    out:      [0.0, 0.0, 0.2, 1],
}

// ─── Scroll-reveal variants ──────────────────────────────────
export const fadeUp = {
    hidden:  { opacity: 0, y: 28 },
    show:    { opacity: 1, y: 0, transition: { duration: 0.65, ease: ease.gentle } },
}

export const fadeIn = {
    hidden:  { opacity: 0 },
    show:    { opacity: 1, transition: { duration: 0.55, ease: ease.smooth } },
}

export const fadeLeft = {
    hidden:  { opacity: 0, x: -24 },
    show:    { opacity: 1, x: 0, transition: { duration: 0.6, ease: ease.gentle } },
}

export const fadeRight = {
    hidden:  { opacity: 0, x: 24 },
    show:    { opacity: 1, x: 0, transition: { duration: 0.6, ease: ease.gentle } },
}

export const scaleIn = {
    hidden:  { opacity: 0, scale: 0.92 },
    show:    { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease.gentle } },
}

// ─── Container stagger ──────────────────────────────────────
export const stagger = (delayChildren = 0.08, staggerChildren = 0.09) => ({
    hidden:  {},
    show:    {
        transition: { delayChildren, staggerChildren },
    },
})

// ─── Hero entrance (longer, graceful) ───────────────────────
export const heroEntrance = {
    hidden:  { opacity: 0, y: 40 },
    show:    {
        opacity: 1, y: 0,
        transition: { duration: 0.9, ease: ease.gentle },
    },
}

export const heroWord = {
    hidden:  { opacity: 0, y: 20 },
    show:    { opacity: 1, y: 0, transition: { duration: 0.55, ease: ease.gentle } },
}

// ─── Card hover (3D tilt via CSS vars) ──────────────────────
export const cardHover = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -6,
        scale: 1.01,
        transition: { duration: 0.3, ease: ease.smooth },
    },
}

// ─── Section label entrance ──────────────────────────────────
export const labelSlide = {
    hidden:  { opacity: 0, x: -16, scale: 0.95 },
    show:    { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: ease.gentle } },
}

// ─── Page transition ─────────────────────────────────────────
export const pageTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: ease.smooth },
}
