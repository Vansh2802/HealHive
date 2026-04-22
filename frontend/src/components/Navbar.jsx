import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, Leaf } from 'lucide-react'

/* Scroll progress bar + navbar scroll-aware bg */
export default function Navbar() {
    const { user, role, logout } = useAuth()
    const navigate     = useNavigate()
    const location     = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [scrolled,   setScrolled]   = useState(false)

    /* Scroll progress bar */
    const { scrollYProgress } = useScroll()

    /* Detect scroll */
    useEffect(() => {
        const unsub = scrollYProgress.onChange((v) => setScrolled(v > 0.02))
        return () => unsub()
    }, [scrollYProgress])

    /* Close mobile menu on route change */
    useEffect(() => { setMobileOpen(false) }, [location.pathname])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const dashboardPath = {
        user:      '/user/dashboard',
        therapist: '/therapist/dashboard',
        admin:     '/admin',
    }[role]

    const isLanding = location.pathname === '/'

    const navLinks = [
        { label: 'How It Works',   href: '/#how-it-works' },
        { label: 'Privacy',        href: '/#privacy' },
        { label: 'For Therapists', href: '/#for-therapists' },
        { label: 'Contact',        href: '/#contact' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">

            {/* ── Scroll Progress Bar ── */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-0.5 origin-left"
                style={{
                    scaleX: scrollYProgress,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-container), #4ade80)',
                    zIndex: 60,
                }}
            />

            {/* ── Main Bar ── */}
            <div className={`navbar-glass transition-all duration-300 ${scrolled ? 'scrolled' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* ── Logo ── */}
                        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
                            <motion.div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}
                                whileHover={{ scale: 1.10, rotate: -8 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                            >
                                <Leaf style={{ width: 18, height: 18, color: '#fff' }} />
                            </motion.div>
                            <span className="text-xl font-bold tracking-tight"
                                  style={{ color: 'var(--color-on-surface)' }}>
                                Heal<span className="gradient-text-sage">Hive</span>
                            </span>
                        </Link>

                        {/* ── Desktop Nav Links ── */}
                        <div className="hidden md:flex items-center gap-1">
                            {isLanding && navLinks.map((link, i) => (
                                <motion.a
                                    key={link.label}
                                    href={link.href}
                                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                                    style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
                                    whileHover={{
                                        color: 'var(--color-primary)',
                                        backgroundColor: 'var(--color-surface-container-low)',
                                    }}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
                                >
                                    {link.label}
                                </motion.a>
                            ))}

                            <div className="vertical-divider h-5 mx-2" />

                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={dashboardPath}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all"
                                        style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <motion.button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg"
                                        style={{ color: 'var(--color-outline)' }}
                                        whileHover={{ color: '#991b1b', backgroundColor: 'rgba(186,26,26,0.06)' }}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                                        style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
                                    >
                                        Sign In
                                    </Link>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        <Link
                                            to="/chat"
                                            className="btn-primary"
                                            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '8px 16px', fontSize: '13px' }}
                                        >
                                            Start Chat
                                        </Link>
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* ── Mobile Toggle ── */}
                        <motion.button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-lg"
                            style={{ color: 'var(--color-on-surface-variant)' }}
                            whileTap={{ scale: 0.92 }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={mobileOpen ? 'close' : 'open'}
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0,   opacity: 1 }}
                                    exit={{   rotate:  90, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </motion.span>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{   opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="md:hidden overflow-hidden shadow-lg"
                        style={{
                            background: 'rgba(255,255,255,0.97)',
                            backdropFilter: 'blur(24px)',
                            borderBottom: '1px solid rgba(191,201,193,0.25)'
                        }}
                    >
                        <motion.div
                            className="max-w-7xl mx-auto px-4 py-4 space-y-1"
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: {},
                                show:   { transition: { staggerChildren: 0.06 } }
                            }}
                        >
                            {isLanding && navLinks.map(link => (
                                <motion.a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2.5 text-sm rounded-lg"
                                    style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}
                                    variants={{
                                        hidden: { opacity: 0, x: -12 },
                                        show:   { opacity: 1, x: 0, transition: { duration: 0.28 } }
                                    }}
                                >
                                    {link.label}
                                </motion.a>
                            ))}

                            <div className="h-px my-2" style={{ background: 'var(--color-surface-container)' }} />

                            {user ? (
                                <>
                                    <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                                          className="block px-3 py-2.5 text-sm font-medium rounded-lg"
                                          style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                        Dashboard
                                    </Link>
                                    <button onClick={handleLogout}
                                            className="block w-full text-left px-3 py-2.5 text-sm rounded-lg"
                                            style={{ color: '#991b1b' }}>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileOpen(false)}
                                          className="block px-3 py-2.5 text-sm rounded-lg"
                                          style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}>
                                        Sign In
                                    </Link>
                                    <Link to="/chat" onClick={() => setMobileOpen(false)}
                                          className="block px-3 py-2.5 text-sm font-semibold rounded-lg"
                                          style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                        Start Anonymous Chat
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
