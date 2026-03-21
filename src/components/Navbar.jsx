import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, Leaf } from 'lucide-react'

export default function Navbar() {
    const { user, role, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/')
        setMobileOpen(false)
    }

    const dashboardPath = {
        user: '/user/dashboard',
        therapist: '/therapist/dashboard',
        admin: '/admin',
    }[role]

    const isLanding = location.pathname === '/'

    const navLinks = [
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'Privacy', href: '/#privacy' },
        { label: 'For Therapists', href: '/#for-therapists' },
        { label: 'Contact', href: '/#contact' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isLanding ? 'bg-white/70 backdrop-blur-xl border-b border-sage-200/20' : 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'
                }`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-500 to-sage-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            <span className="text-slate-800">Heal</span>
                            <span className="bg-gradient-to-r from-sage-600 to-sage-400 bg-clip-text text-transparent">Hive</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {isLanding && navLinks.map(link => (
                            <a key={link.label} href={link.href}
                                className="px-3 py-2 text-sm text-slate-600 hover:text-sage-700 rounded-lg hover:bg-sage-50/60 transition-all duration-200">
                                {link.label}
                            </a>
                        ))}

                        <div className="w-px h-6 bg-slate-200 mx-2" />

                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link to={dashboardPath}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-sage-700 hover:bg-sage-50 rounded-lg transition-all">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login"
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-sage-700 hover:bg-sage-50 rounded-lg transition-all">
                                    Login
                                </Link>
                                <Link to="/chat"
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 rounded-xl hover:shadow-lg hover:shadow-sage-300/30 transition-all duration-300">
                                    Start Chat
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-600 hover:text-sage-700 rounded-lg">
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
                        {isLanding && navLinks.map(link => (
                            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 text-sm text-slate-600 hover:text-sage-700 hover:bg-sage-50 rounded-lg transition-all">
                                {link.label}
                            </a>
                        ))}
                        <div className="h-px bg-slate-100 my-2" />
                        {user ? (
                            <>
                                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2.5 text-sm font-medium text-sage-700 hover:bg-sage-50 rounded-lg">
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout}
                                    className="block w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2.5 text-sm text-slate-600 hover:bg-sage-50 rounded-lg">
                                    Login
                                </Link>
                                <Link to="/chat" onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2.5 text-sm font-medium text-sage-600 hover:bg-sage-50 rounded-lg">
                                    Start Anonymous Chat
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
