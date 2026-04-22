import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardLayout({ children, navItems = [], title = 'Dashboard' }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-surface-container-low)' }}>

            {/* ── Sidebar ── */}
            <aside className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 sidebar ${collapsed ? 'w-[68px]' : 'w-60'}`}>

                {/* Logo */}
                <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
                     style={{ borderBottom: '1px solid rgba(191,201,193,0.20)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}>
                        <Leaf style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
                            Heal<span className="gradient-text-sage">Hive</span>
                        </span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            <item.icon style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(191,201,193,0.20)' }}>
                    {!collapsed && user && (
                        <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--color-surface-container-low)' }}>
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-on-surface)' }}>
                                {user.name}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-outline)' }}>
                                {user.email}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
                        style={{ color: 'var(--color-outline)' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(186,26,26,0.07)'
                            e.currentTarget.style.color = '#991b1b'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--color-outline)'
                        }}
                    >
                        <LogOut style={{ width: '16px', height: '16px' }} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-200"
                    style={{
                        background: 'var(--color-surface-container-lowest)',
                        border: '1px solid rgba(191,201,193,0.30)',
                        color: 'var(--color-outline)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-outline)'}
                >
                    {collapsed
                        ? <ChevronRight style={{ width: '11px', height: '11px' }} />
                        : <ChevronLeft  style={{ width: '11px', height: '11px' }} />}
                </button>
            </aside>

            {/* ── Main Content ── */}
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-60'} min-w-0`}>
                {/* Top Bar */}
                <header className="h-16 sticky top-0 z-30 flex items-center px-6"
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(16px)',
                            borderBottom: '1px solid rgba(191,201,193,0.20)',
                            boxShadow: '0 1px 16px rgba(11,31,23,0.04)',
                        }}>
                    <h1 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)', fontFamily: "'Newsreader', Georgia, serif" }}>
                        {title}
                    </h1>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
