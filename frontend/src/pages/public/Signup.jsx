import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { register } from '../../services/api/auth'
import { Leaf, User, Stethoscope, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

const roleCards = [
    { key: 'user', label: 'I need support', desc: 'Access therapy sessions and anonymous chat', icon: User, gradient: 'from-sage-500 to-sage-400' },
    { key: 'therapist', label: 'I\'m a therapist', desc: 'Apply to join the HealHive platform', icon: Stethoscope, gradient: 'from-lavender-500 to-lavender-400' },
]

export default function Signup() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const nameRef = useRef(null)

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.role) { setError('Please select a role'); return }
        if (!form.name.trim()) { setError('Name is required'); nameRef.current?.focus(); return }
        if (!form.email.trim()) { setError('Email is required'); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }

        setLoading(true)
        try {
            const data = await register(form.name.trim(), form.email, form.password, form.role)
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

    return (
        <div className="pt-16 min-h-screen gradient-bg relative flex items-center justify-center p-4 overflow-hidden">
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage-500 to-lavender-400 flex items-center justify-center mx-auto mb-4">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Create your account</h1>
                    <p className="text-slate-500">Join HealHive and begin your wellness journey</p>
                </div>

                <div className="glass-card rounded-3xl p-6 sm:p-8">
                    {/* Role Selection */}
                    {!form.role ? (
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-slate-700 text-center mb-2">I am...</p>
                            {roleCards.map(r => (
                                <motion.button
                                    key={r.key}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setForm({ ...form, role: r.key })}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-sage-300 hover:shadow-md bg-white/60 text-left transition-all duration-300"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <r.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">{r.label}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Selected role badge */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleCards.find(r => r.key === form.role)?.gradient} flex items-center justify-center`}>
                                        {form.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Stethoscope className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {form.role === 'user' ? 'User Account' : 'Therapist Application'}
                                    </span>
                                </div>
                                <button type="button" onClick={() => setForm({ ...form, role: '' })} className="text-xs text-sage-500 hover:text-sage-700 transition-colors">
                                    Change
                                </button>
                            </div>

                            {form.role === 'therapist' && (
                                <div className="p-3 bg-lavender-50 border border-lavender-200 rounded-xl text-xs text-lavender-700 flex items-start gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    <span>Your application will be reviewed by an admin before you can access the platform.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <input ref={nameRef} type="text" name="name" value={form.name} onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 bg-white/80 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 bg-white/80 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                        placeholder="Create a password (min 6 chars)"
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 bg-white/80 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 bg-white/80 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all" />
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-sage-600 to-sage-500 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sage-300/30 transition-all duration-300 flex items-center justify-center gap-2">
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : form.role === 'therapist' ? 'Submit Application' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account? <Link to="/login" className="font-medium text-sage-600 hover:text-sage-700 transition-colors">Log in</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
