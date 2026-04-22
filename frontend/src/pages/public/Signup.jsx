import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { register } from '../../services/api/auth'
import { Leaf, User, Stethoscope, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

const roleCards = [
    {
        key:      'user',
        label:    'I need support',
        desc:     'Access therapy sessions and anonymous chat',
        icon:     User,
        gradient: 'linear-gradient(135deg, #0f5238, #2d6b4f)',
    },
    {
        key:      'therapist',
        label:    "I'm a therapist",
        desc:     'Apply to join the HealHive platform',
        icon:     Stethoscope,
        gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    },
]

export default function Signup() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' })
    const [error,        setError]        = useState('')
    const [loading,      setLoading]      = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const nameRef = useRef(null)

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.role)              { setError('Please select a role'); return }
        if (!form.name.trim())       { setError('Name is required'); nameRef.current?.focus(); return }
        if (!form.email.trim())      { setError('Email is required'); return }
        if (form.password.length < 8){ setError('Password must be at least 8 characters'); return }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }

        setLoading(true)
        try {
            const data = await register(form.name.trim(), form.email.trim(), form.password, form.role)
            if (!data.success) {
                const err = typeof data.error === 'string' ? data.error : 'Signup failed. Please try again.'
                throw new Error(err.includes('already') ? 'Email already exists. Please log in.' : err)
            }
            navigate('/login')
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const selectedCard = roleCards.find(r => r.key === form.role)

    return (
        <div className="pt-16 min-h-screen flex items-center justify-center p-4 relative overflow-hidden gradient-bg">
            <div className="floating-orb orb-1" />
            <div className="floating-orb orb-2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}>
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-semibold mb-2"
                        style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>
                        Create your account
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-outline)' }}>
                        Join HealHive and begin your wellness journey
                    </p>
                </div>

                <div className="glass-card rounded-3xl p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                        {!form.role ? (
                            /* ── Role Selection ── */
                            <motion.div
                                key="role-select"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                className="space-y-4"
                            >
                                <p className="text-sm font-medium text-center mb-4"
                                   style={{ color: 'var(--color-on-surface-variant)' }}>
                                    I am...
                                </p>
                                {roleCards.map(r => (
                                    <motion.button
                                        key={r.key}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setForm({ ...form, role: r.key })}
                                        className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300"
                                        style={{
                                            background: 'var(--color-surface-container-lowest)',
                                            border: '1.5px solid rgba(191,201,193,0.25)',
                                            boxShadow: 'var(--shadow-card)',
                                        }}
                                    >
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                             style={{ background: r.gradient }}>
                                            <r.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                                {r.label}
                                            </h3>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
                                                {r.desc}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            /* ── Registration Form ── */
                            <motion.form
                                key="registration-form"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                onSubmit={handleSubmit}
                                className="space-y-5"
                            >
                                {/* Role badge + change */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                             style={{ background: selectedCard?.gradient }}>
                                            {form.role === 'user'
                                                ? <User className="w-4 h-4 text-white" />
                                                : <Stethoscope className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                                            {form.role === 'user' ? 'User Account' : 'Therapist Application'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, role: '' })}
                                        className="flex items-center gap-1 text-xs font-medium transition-colors"
                                        style={{ color: 'var(--color-primary)' }}
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        Change
                                    </button>
                                </div>

                                {/* Therapist note */}
                                {form.role === 'therapist' && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                                         style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', color: '#5b21b6' }}>
                                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        <span>Your application will be reviewed by an admin before you can access the platform.</span>
                                    </div>
                                )}

                                {/* Fields */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Full Name</label>
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="input-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        className="input-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Create a password (min 8 chars)"
                                            className="input-primary pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                                            style={{ color: 'var(--color-outline)' }}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        className="input-primary"
                                    />
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="alert-error"
                                            role="alert"
                                        >
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                    style={{ padding: '13px 24px', fontSize: '15px' }}
                                >
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                                        : form.role === 'therapist' ? 'Submit Application' : 'Create Account'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-outline)' }}>
                        Already have an account?{' '}
                        <Link to="/login"
                              className="font-semibold transition-colors hover:underline"
                              style={{ color: 'var(--color-primary)' }}>
                            Log in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
