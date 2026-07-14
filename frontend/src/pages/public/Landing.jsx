import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
    motion, useInView, useScroll, useTransform,
    useMotionValue, useSpring,
} from 'framer-motion'
import {
    MessageCircle, Shield, UserCheck, Video,
    Heart, Lock, ArrowRight, Mail, Phone, MapPin, Leaf,
    Star, Zap, Users
} from 'lucide-react'
import { fadeUp, fadeLeft, fadeRight, scaleIn, stagger, labelSlide } from '../../utils/motion'

/* ─── Scroll-reveal wrapper ─────────────────────────────── */
function Reveal({ children, variants = fadeUp, delay = 0, className = '' }) {
    const ref     = useRef(null)
    const inView  = useInView(ref, { once: true, amount: 0.18 })
    return (
        <motion.div
            ref={ref}
            className={className}
            variants={variants}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            transition={{ delay }}
        >
            {children}
        </motion.div>
    )
}

/* ─── 3D Tilt card ─────────────────────────────────────── */
function TiltCard({ children, className = '', style = {} }) {
    const ref  = useRef(null)
    const rotX = useMotionValue(0)
    const rotY = useMotionValue(0)

    const springConfig = { stiffness: 200, damping: 24 }
    const springX = useSpring(rotX, springConfig)
    const springY = useSpring(rotY, springConfig)

    const handleMouseMove = (e) => {
        const rect  = ref.current?.getBoundingClientRect()
        if (!rect) return
        const cx = rect.left + rect.width  / 2
        const cy = rect.top  + rect.height / 2
        const dx = (e.clientX - cx) / (rect.width  / 2)
        const dy = (e.clientY - cy) / (rect.height / 2)
        rotX.set(-dy * 6)   // max ±6deg vertical tilt
        rotY.set( dx * 6)   // max ±6deg horizontal tilt
    }

    const handleMouseLeave = () => { rotX.set(0); rotY.set(0) }

    return (
        <motion.div
            ref={ref}
            className={`card-tilt ${className}`}
            style={{
                rotateX: springX,
                rotateY: springY,
                transformPerspective: 900,
                ...style,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
            {children}
        </motion.div>
    )
}

/* ─── Stats counter ─────────────────────────────────────── */
const stats = [
    { value: 'Growing', label: 'Network of licensed therapists', icon: Users },
    { value: 'Privacy', label: 'Built as a first principle', icon: Shield },
    { value: '24/7', label: 'AI Support',           icon: Zap   },
]

/* ─── Steps ─────────────────────────────────────────────── */
const steps = [
    {
        number: '01',
        icon:  MessageCircle,
        title: 'Start a Conversation',
        desc:  'Chat anonymously with our AI assistant. No login, no judgment — just support.',
        gradient: 'linear-gradient(135deg, #0f5238, #2d6b4f)',
    },
    {
        number: '02',
        icon:  UserCheck,
        title: 'Get Matched',
        desc:  'Based on your needs, we connect you with a verified, licensed therapist.',
        gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    },
    {
        number: '03',
        icon:  Video,
        title: 'Begin Healing',
        desc:  'Book sessions, join video calls, and take your first steps toward wellness.',
        gradient: 'linear-gradient(135deg, #2d6b4f, #059669)',
    },
]

/* ─── Stagger container ─────────────────────────────────── */
const containerVariants = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.10, delayChildren: 0.05 } },
}
const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Landing() {
    /* Parallax hero */
    const heroRef   = useRef(null)
    const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroY     = useTransform(heroScroll, [0, 1], [0, 80])
    const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0])

    return (
        <div className="pt-16 overflow-x-hidden">

            {/* ════════════════════ HERO ════════════════════ */}
            <section
                ref={heroRef}
                className="relative min-h-[92vh] flex items-center overflow-hidden"
                style={{ background: 'var(--color-surface)' }}
            >
                {/* Mesh gradient background — parallaxed */}
                <motion.div
                    className="absolute inset-0 gradient-bg noise-overlay"
                    style={{ y: heroY }}
                />

                {/* Botanical orbs */}
                <div className="floating-orb orb-1" />
                <div className="floating-orb orb-2" />
                <div className="floating-orb orb-3" />
                <div className="floating-orb orb-4" />

                {/* Content */}
                <motion.div
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 w-full"
                    style={{ opacity: heroOpacity }}
                >
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Badge — fades in first */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.90, y: -10 }}
                            animate={{ opacity: 1, scale: 1,    y: 0    }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
                            style={{
                                background: 'rgba(180,241,205,0.28)',
                                border: '1px solid rgba(45,107,79,0.22)',
                                color: 'var(--color-primary)',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <Leaf className="w-3.5 h-3.5" />
                            Private, ethical, AI-powered support
                        </motion.div>

                        {/* Headline — staggered words */}
                        <motion.h1
                            className="text-5xl sm:text-6xl lg:text-7xl font-light leading-tight mb-6"
                            style={{
                                fontFamily: "'Newsreader', Georgia, serif",
                                color: 'var(--color-on-surface)',
                                letterSpacing: '-0.025em',
                            }}
                        >
                            <motion.span
                                className="block"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0  }}
                                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            >
                                Your safe space for
                            </motion.span>
                            <motion.span
                                className="gradient-shimmer font-semibold"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0  }}
                                transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            >
                                mental wellness
                            </motion.span>
                        </motion.h1>

                        {/* Sub */}
                        <motion.p
                            className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
                            style={{ color: 'var(--color-on-surface-variant)' }}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0  }}
                            transition={{ duration: 0.65, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        >
                            Start an anonymous conversation, get matched with a licensed therapist,
                            and begin your journey to healing — all in one place.
                        </motion.p>

                        {/* CTA Buttons — staggered */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0  }}
                            transition={{ duration: 0.6, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Link
                                to="/chat"
                                className="btn-primary group flex items-center gap-2"
                                style={{ display: 'inline-flex', textDecoration: 'none', padding: '14px 28px', fontSize: '15px', fontWeight: 600 }}
                            >
                                Start Anonymous Chat
                                <motion.span
                                    className="inline-block"
                                    whileHover={{ x: 4 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </motion.span>
                            </Link>
                            <Link
                                to="/login"
                                className="btn-secondary flex items-center"
                                style={{ display: 'inline-flex', textDecoration: 'none', padding: '13px 24px', fontSize: '15px' }}
                            >
                                I have an account
                            </Link>
                            <Link
                                to="/signup"
                                style={{
                                    display: 'inline-flex',
                                    padding: '13px 24px',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    borderRadius: '12px',
                                    border: '1.5px solid rgba(124,58,237,0.25)',
                                    color: '#7c3aed',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    background: 'transparent',
                                }}
                            >
                                Sign up free
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll hint */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                >
                    <motion.div
                        className="w-0.5 h-8 rounded-full"
                        style={{ background: 'var(--color-outline)' }}
                        animate={{ scaleY: [1, 0.3, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>
            </section>

            {/* ════════ STATS STRIP ════════ */}
            <section style={{ background: 'var(--color-inverse-surface)' }} className="py-10">
                <div className="max-w-5xl mx-auto px-4">
                    <motion.div
                        className="grid grid-cols-3 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        {stats.map((s, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                className="text-center"
                            >
                                <p className="text-3xl font-bold mb-1"
                                   style={{ fontFamily: "'Newsreader', serif", color: 'var(--color-primary-fixed-dim)' }}>
                                    {s.value}
                                </p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    {s.label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ════════ HOW IT WORKS ════════ */}
            <section
                id="how-it-works"
                className="py-28 sm:py-36 relative overflow-hidden"
                style={{ background: 'var(--color-surface-container-lowest)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Heading */}
                    <Reveal className="text-center mb-20">
                        <motion.p className="section-label mb-3" variants={labelSlide}>Process</motion.p>
                        <h2 className="display-heading text-4xl sm:text-5xl mb-4">How It Works</h2>
                        <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Three simple steps to connect with professional support.
                        </p>
                    </Reveal>

                    {/* Cards Grid */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                    >
                        {steps.map((step, i) => (
                            <motion.div key={i} variants={itemVariants}>
                                <TiltCard className="p-8 h-full" style={{ position: 'relative', overflow: 'hidden' }}>
                                    {/* Large ghost step number */}
                                    <span className="step-number">{step.number}</span>

                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                        style={{ background: step.gradient }}
                                    >
                                        <step.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest"
                                          style={{ color: 'var(--color-outline)' }}>
                                        Step {i + 1}
                                    </span>
                                    <h3 className="text-xl font-semibold mt-2 mb-3"
                                        style={{ color: 'var(--color-on-surface)' }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed"
                                       style={{ color: 'var(--color-on-surface-variant)' }}>
                                        {step.desc}
                                    </p>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ════════ PRIVACY & ETHICS ════════ */}
            <section
                id="privacy"
                className="py-28 sm:py-36"
                style={{ background: 'var(--color-surface-container-low)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                        {/* Left text */}
                        <Reveal variants={fadeLeft}>
                            <motion.p className="section-label mb-3" variants={labelSlide}>Trust</motion.p>
                            <h2 className="display-heading text-4xl mb-5">Privacy &amp; Ethics First</h2>
                            <p className="text-base leading-relaxed mb-8"
                               style={{ color: 'var(--color-on-surface-variant)' }}>
                                Your mental health journey is deeply personal. We're committed to protecting
                                your privacy and maintaining the highest ethical standards.
                            </p>
                            <Link to="/signup"
                                  className="btn-primary inline-flex items-center gap-2"
                                  style={{ textDecoration: 'none', padding: '12px 22px', fontSize: '14px' }}>
                                Get Started Privately
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Reveal>

                        {/* Right cards */}
                        <motion.div
                            className="space-y-3"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {[
                                { icon: Lock,   title: 'Anonymous by Default',
                                  desc: 'Chat without creating an account. Your identity stays private.' },
                                { icon: Shield, title: 'No Data Selling',
                                  desc: 'We never sell, share, or monetize your personal information.' },
                                { icon: Heart,  title: 'Ethical AI',
                                  desc: 'Our AI never diagnoses. It supports, listens, and connects you with real professionals.' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className="flex gap-4 p-5 rounded-2xl group cursor-default"
                                    style={{ background: 'var(--color-surface-container-lowest)' }}
                                    whileHover={{
                                        y: -3,
                                        boxShadow: '0 8px 32px rgba(11,31,23,0.09)',
                                        transition: { duration: 0.25 },
                                    }}
                                >
                                    <motion.div
                                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--color-surface-container)' }}
                                        whileHover={{ scale: 1.12, rotate: 5 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <item.icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                                    </motion.div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1"
                                            style={{ color: 'var(--color-on-surface)' }}>
                                            {item.title}
                                        </h4>
                                        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ════════ FOR THERAPISTS ════════ */}
            <section
                id="for-therapists"
                className="py-28 sm:py-36"
                style={{ background: 'var(--color-surface-container-lowest)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">

                        <Reveal>
                            <p className="section-label mb-3">Join Us</p>
                            <h2 className="display-heading text-4xl sm:text-5xl mb-4">For Therapists</h2>
                            <p className="text-base max-w-2xl mx-auto mb-16"
                               style={{ color: 'var(--color-on-surface-variant)' }}>
                                Join a growing community of licensed professionals making mental health
                                support more accessible.
                            </p>
                        </Reveal>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {[
                                { title: 'Verified Clients',
                                  desc: 'AI pre-screens clients so you get relevant, informed referrals.' },
                                { title: 'Flexible Schedule',
                                  desc: 'Set your own availability. Work on your terms.' },
                                { title: 'Compliance',
                                  desc: 'Privacy-first infrastructure for safe, professional sessions.' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className="p-6 rounded-2xl text-left"
                                    style={{ background: 'var(--color-surface-container-low)' }}
                                    whileHover={{
                                        y: -4,
                                        background: 'var(--color-surface-container)',
                                        boxShadow: '0 8px 28px rgba(11,31,23,0.08)',
                                        transition: { duration: 0.25 },
                                    }}
                                >
                                    <h4 className="font-semibold mb-2"
                                        style={{ color: 'var(--color-on-surface)' }}>
                                        {item.title}
                                    </h4>
                                    <p className="text-sm"
                                       style={{ color: 'var(--color-on-surface-variant)' }}>
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        <Reveal variants={scaleIn}>
                            <Link
                                to="/therapist/signup"
                                className="btn-primary inline-flex items-center gap-2"
                                style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '15px' }}
                            >
                                Apply to Join
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ════════ CONTACT ════════ */}
            <section
                id="contact"
                className="py-28 sm:py-36"
                style={{ background: 'var(--color-surface-container-low)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto text-center">

                        <Reveal>
                            <p className="section-label mb-3">Support</p>
                            <h2 className="display-heading text-4xl mb-4">Get in Touch</h2>
                            <p className="text-base mb-14" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Have questions? We're here to help.
                            </p>
                        </Reveal>

                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            {[
                                { icon: Mail,   label: 'Email',       value: 'support@healhive.com' },
                                { icon: Phone,  label: 'Crisis Lines', value: (
                                    <>
                                        988 (US)<br/>
                                        Samaritans 116 123 (UK)<br/>
                                        <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>findahelpline.com</a>
                                    </>
                                ) },
                                { icon: MapPin, label: 'Location',    value: 'Remote-first'         },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className="card-flat flex flex-col items-center gap-3 p-6"
                                    whileHover={{ y: -5, transition: { duration: 0.25 } }}
                                >
                                    <motion.div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--color-surface-container-high)' }}
                                        whileHover={{ scale: 1.10, rotate: -6 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <item.icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                                    </motion.div>
                                    <span className="section-label">{item.label}</span>
                                    <span className="text-sm font-medium"
                                          style={{ color: 'var(--color-on-surface)' }}>
                                        {item.value}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    )
}
