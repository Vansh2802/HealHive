import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as apiLogin } from '../../services/api/auth'
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2, Leaf } from 'lucide-react'

export default function AdminLogin() {
    const { login }  = useAuth()
    const navigate   = useNavigate()
    const [email,        setEmail]        = useState('')
    const [password,     setPassword]     = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error,        setError]        = useState('')
    const [loading,      setLoading]      = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
        setError('')
        setLoading(true)
        const result = await apiLogin(email.trim(), password, 'admin')
        if (result.success) { login(result.user); navigate('/admin', { replace: true }) }
        else { setError(result.error) }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
             style={{ background: 'var(--color-inverse-surface)' }}>
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                         style={{
                             background: 'rgba(148,212,178,0.12)',
                             border: '1px solid rgba(148,212,178,0.20)',
                         }}>
                        <ShieldCheck className="w-7 h-7" style={{ color: 'var(--color-primary-fixed-dim)' }} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white"
                        style={{ fontFamily: "'Newsreader', Georgia, serif" }}>
                        Admin Access
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        HealHive platform administration
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-3xl p-6 sm:p-8"
                     style={{
                         background: 'rgba(255,255,255,0.05)',
                         backdropFilter: 'blur(20px)',
                         border: '1px solid rgba(255,255,255,0.10)',
                     }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-id"
                                   className="block text-sm font-medium mb-1.5"
                                   style={{ color: 'rgba(255,255,255,0.65)' }}>
                                Admin Email
                            </label>
                            <input
                                id="admin-id"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1.5px solid rgba(255,255,255,0.12)',
                                    color: '#ffffff',
                                }}
                                onFocus={e => {
                                    e.target.style.border = '1.5px solid rgba(148,212,178,0.50)'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(148,212,178,0.12)'
                                }}
                                onBlur={e => {
                                    e.target.style.border = '1.5px solid rgba(255,255,255,0.12)'
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-pw"
                                   className="block text-sm font-medium mb-1.5"
                                   style={{ color: 'rgba(255,255,255,0.65)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="admin-pw"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1.5px solid rgba(255,255,255,0.12)',
                                        color: '#ffffff',
                                    }}
                                    onFocus={e => {
                                        e.target.style.border = '1.5px solid rgba(148,212,178,0.50)'
                                        e.target.style.boxShadow = '0 0 0 3px rgba(148,212,178,0.12)'
                                    }}
                                    onBlur={e => {
                                        e.target.style.border = '1.5px solid rgba(255,255,255,0.12)'
                                        e.target.style.boxShadow = 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                    style={{ color: 'rgba(255,255,255,0.40)' }}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl text-xs" role="alert"
                                 style={{ background: 'rgba(186,26,26,0.12)', border: '1px solid rgba(186,26,26,0.20)', color: '#fca5a5' }}>
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                                color: '#ffffff',
                                opacity: (loading || !email.trim() || !password.trim()) ? 0.45 : 1,
                                cursor: (loading || !email.trim() || !password.trim()) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 16px rgba(15,82,56,0.30)',
                            }}
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                                : 'Access Dashboard'}
                        </button>
                    </form>
                </div>

                {/* Bottom logo */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <Leaf className="w-3.5 h-3.5" style={{ color: 'rgba(148,212,178,0.50)' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        HealHive · Platform Administration
                    </p>
                </div>
            </div>
        </div>
    )
}
