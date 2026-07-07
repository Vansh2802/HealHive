import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { login as apiLogin } from '../../services/api/auth'
import {
    Eye, EyeOff, AlertCircle, Loader2, Stethoscope,
    User, ShieldCheck, Leaf, Clock, CheckCircle, Lock, Heart
} from 'lucide-react'

const roles = [
    { key: 'user',      label: 'User',      icon: User,        desc: 'Access therapy sessions & support' },
    { key: 'therapist', label: 'Therapist', icon: Stethoscope, desc: 'Manage your professional dashboard' },
    { key: 'admin',     label: 'Admin',     icon: ShieldCheck, desc: 'Platform administration' },
]

const trustBadges = [
    { icon: CheckCircle, label: '500+ Therapists' },
    { icon: Lock,        label: 'Anonymous & Private' },
    { icon: Heart,       label: 'HIPAA Aware' },
]

export default function Login() {
    const { login } = useAuth()
    const navigate   = useNavigate()
    const location   = useLocation()
    const from       = location.state?.from?.pathname

    const [activeRole,          setActiveRole]          = useState('user')
    const [email,               setEmail]               = useState('')
    const [password,            setPassword]            = useState('')
    const [showPassword,        setShowPassword]        = useState(false)
    const [error,               setError]               = useState('')
    const [pendingVerification, setPendingVerification] = useState(false)
    const [loading,             setLoading]             = useState(false)

    const currentRole = roles.find(r => r.key === activeRole)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.')
            return
        }
        setError('')
        setPendingVerification(false)
        setLoading(true)

        const result = await apiLogin(email.trim(), password, activeRole)

        if (result.success) {
            login(result.user)
            const dest = from || {
                user:      '/user/dashboard',
                therapist: '/therapist/dashboard',
                admin:     '/admin',
            }[activeRole]
            navigate(dest, { replace: true })
        } else {
            setError(result.error || 'Login failed. Please try again.')
            if (result.pendingVerification) setPendingVerification(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT HERO PANEL ── */}
            <div className="hidden lg:flex lg:w-[58%] hero-panel flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
                {/* Animated bg orbs */}
                <motion.div className="hero-panel-orb w-96 h-96 top-[-60px] left-[-60px]"
                     style={{ background: 'radial-gradient(circle, rgba(148,212,178,0.35), transparent 70%)' }}
                     animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
                     transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="hero-panel-orb w-72 h-72 bottom-[-40px] right-[-40px]"
                     style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.25), transparent 70%)' }}
                     animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.25, 0.15] }}
                     transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
                <div className="hero-panel-orb w-52 h-52 top-[40%] right-[10%]"
                     style={{ background: 'radial-gradient(circle, rgba(148,212,178,0.20), transparent 70%)' }} />

                {/* Logo */}
                <motion.div
                    className="relative z-10 flex items-center gap-2.5"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
                        whileHover={{ rotate: -12, scale: 1.12 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                    >
                        <Leaf className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Heal<span style={{ color: 'rgba(148,212,178,0.9)' }}>Hive</span>
                    </span>
                </motion.div>

                {/* Hero Text — staggered blocks */}
                <motion.div
                    className="relative z-10"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
                >
                    <motion.p
                        className="text-sm font-medium mb-6"
                        style={{ color: 'rgba(148,212,178,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
                    >
                        Mental Wellness Platform
                    </motion.p>
                    <motion.h1
                        className="text-4xl xl:text-5xl font-light text-white leading-tight mb-5"
                        style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                        variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16,1,0.3,1] } } }}
                    >
                        Your healing<br />
                        <em className="font-normal" style={{ color: 'rgba(148,212,178,0.9)' }}>journey starts</em><br />
                        here.
                    </motion.h1>
                    <motion.p
                        className="text-base leading-relaxed max-w-sm"
                        style={{ color: 'rgba(255,255,255,0.58)' }}
                        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
                    >
                        Join thousands finding peace, one step at a time. Professional support, privacy-first, always.
                    </motion.p>
                </motion.div>

                {/* Trust Badges — staggered */}
                <motion.div
                    className="relative z-10 flex flex-wrap gap-3"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.10, delayChildren: 0.55 } } }}
                >
                    {trustBadges.map((badge, i) => (
                        <motion.span
                            key={i}
                            className="trust-badge"
                            variants={{ hidden: { opacity: 0, y: 10, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } } }}
                        >
                            <badge.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {badge.label}
                        </motion.span>
                    ))}
                </motion.div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
                 style={{ background: 'var(--color-surface-container-lowest)' }}>

                <motion.div
                    className="w-full max-w-md"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
                >
                    {/* Mobile Logo */}
                    <motion.div
                        className="flex items-center gap-2 mb-8 lg:hidden"
                        variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #0f5238, #2d6b4f)' }}>
                            <Leaf className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold"
                              style={{ color: 'var(--color-on-surface)' }}>
                            Heal<span style={{ color: 'var(--color-primary-container)' }}>Hive</span>
                        </span>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        className="mb-8"
                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
                    >
                        <h2 className="text-3xl font-bold mb-1.5"
                            style={{ color: 'var(--color-on-surface)', fontFamily: "'Newsreader', Georgia, serif", letterSpacing: '-0.02em' }}>
                            Welcome back
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--color-outline)' }}>
                            Sign in to your HealHive account
                        </p>
                    </motion.div>

                    {/* Role Selector */}
                    <motion.div
                        className="role-pill-group mb-6"
                        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } } }}
                    >
                        {roles.map(role => (
                            <motion.button
                                key={role.key}
                                type="button"
                                onClick={() => { setActiveRole(role.key); setError(''); setPendingVerification(false) }}
                                className={`role-pill ${activeRole === role.key ? 'active' : ''}`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <role.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                {role.label}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Role Description */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeRole}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs mb-6 text-center"
                            style={{ color: 'var(--color-outline)' }}
                        >
                            {currentRole.desc}
                        </motion.p>
                    </AnimatePresence>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
                    >
                        {/* Email */}
                        <div>
                            <label htmlFor="login-email"
                                   className="block text-sm font-medium mb-1.5"
                                   style={{ color: 'var(--color-on-surface-variant)' }}>
                                Email address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                autoComplete="email"
                                className="input-primary"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password"
                                   className="block text-sm font-medium mb-1.5"
                                   style={{ color: 'var(--color-on-surface-variant)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="input-primary pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                                    style={{ color: 'var(--color-outline)' }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={pendingVerification ? 'alert-warning' : 'alert-error'}
                                    role="alert"
                                >
                                    {pendingVerification
                                        ? <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={loading || !email.trim() || !password.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                            style={{ padding: '13px 24px', fontSize: '15px' }}
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                                : 'Sign In'}
                        </button>
                    </motion.form>

                    {/* Footer Links */}
                    <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-outline)' }}>
                        {activeRole === 'therapist' ? (
                            <p>Not registered?{' '}
                                <Link to="/therapist/signup"
                                      className="font-semibold transition-colors hover:underline"
                                      style={{ color: 'var(--color-primary)' }}>
                                    Apply as Therapist
                                </Link>
                            </p>
                        ) : activeRole === 'user' ? (
                            <p>New here?{' '}
                                <Link to="/signup"
                                      className="font-semibold transition-colors hover:underline"
                                      style={{ color: 'var(--color-primary)' }}>
                                    Create an account
                                </Link>
                            </p>
                        ) : null}
                    </div>


                    {/* Demo Credentials — only visible during local development, never in production builds */}
                    {import.meta.env.DEV && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="demo-box mt-5"
                        >
                            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Demo accounts <span style={{ color: 'var(--color-primary)' }}>(dev only)</span>
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>User: user@healhive.com / user123</p>
                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Therapist: therapist@healhive.com / therapist123</p>
                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Admin: admin@healhive.com / admin123</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
