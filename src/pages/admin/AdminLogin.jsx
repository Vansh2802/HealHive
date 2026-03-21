import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { login as apiLogin } from '../../services/api/auth'
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminLogin() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
        <div className="min-h-screen bg-wood-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-wood-900 border border-wood-800 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-beige-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
                    <p className="text-wood-400 text-sm mt-1">HealHive platform administration</p>
                </div>

                <div className="bg-wood-900/50 backdrop-blur-xl border border-wood-800 rounded-3xl p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-id" className="block text-sm font-medium text-wood-300 mb-1.5">Admin Email</label>
                            <input id="admin-id" type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                className="w-full px-4 py-3 rounded-xl border border-wood-700 text-sm text-white placeholder-wood-500 bg-wood-800/50 outline-none transition-all focus:border-beige-400 focus:ring-2 focus:ring-beige-400/20" />
                        </div>
                        <div>
                            <label htmlFor="admin-pw" className="block text-sm font-medium text-wood-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input id="admin-pw" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-wood-700 text-sm text-white placeholder-wood-500 bg-wood-800/50 outline-none transition-all focus:border-beige-400 focus:ring-2 focus:ring-beige-400/20" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-wood-500 hover:text-wood-300 p-1">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400" role="alert">
                                <AlertCircle className="w-3.5 h-3.5" />{error}
                            </div>
                        )}

                        <button type="submit" disabled={loading || !email.trim() || !password.trim()}
                            className="w-full py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-beige-600 to-beige-500 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-beige-500/25 transition-all flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : 'Access Dashboard'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-[11px] text-wood-600 mt-4">Use your real admin account credentials</p>
            </div>
        </div>
    )
}
