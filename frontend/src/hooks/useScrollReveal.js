/**
 * useScrollReveal — triggers Framer Motion animations when
 * an element enters the viewport (true scroll-based reveals).
 *
 * Usage:
 *   const [ref, controls] = useScrollReveal()
 *   <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={controls}>
 */
import { useEffect, useRef } from 'react'
import { useAnimation } from 'framer-motion'
import { useInView } from 'framer-motion'

export function useScrollReveal(options = {}) {
    const ref      = useRef(null)
    const controls = useAnimation()
    const inView   = useInView(ref, {
        once:   options.once   ?? true,   // animate only once by default
        amount: options.amount ?? 0.18,   // trigger at 18% visible
        margin: options.margin ?? '0px',
    })

    useEffect(() => {
        if (inView) {
            controls.start('show')
        } else if (!( options.once ?? true)) {
            controls.start('hidden')
        }
    }, [inView, controls, options.once])

    return [ref, controls]
}

/**
 * useParallax — returns a motionValue-based parallax offset
 * based on scroll position.
 */
import { useScroll, useTransform } from 'framer-motion'

export function useParallax(target, outputRange = [0, -60]) {
    const { scrollYProgress } = useScroll({
        target,
        offset: ['start end', 'end start'],
    })
    return useTransform(scrollYProgress, [0, 1], outputRange)
}

/**
 * useScrollNavbar — returns scroll progress (0–1) for use in
 * scroll-aware navbar styling.
 */
export function useScrollNavbar(threshold = 60) {
    const { scrollY } = useScroll()
    const [scrolled, setScrolled] = __useStateReact(false)

    useEffect(() => {
        return scrollY.onChange((y) => setScrolled(y > threshold))
    }, [scrollY, threshold])

    return scrolled
}

// Internal forward-compat shim
import { useState as __useStateReact } from 'react'
