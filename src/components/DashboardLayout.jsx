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
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 z-40 transition-all duration-300 flex flex-col ${collapsed ? 'w-[68px]' : 'w-60'}`}>
                {/* Logo */}
                <div className={`flex items-center h-16 px-4 border-b border-slate-100 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-500 to-sage-400 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight">
                            <span className="text-slate-800">Heal</span>
                            <span className="text-sage-500">Hive</span>
                        </span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-sage-50 text-sage-700'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="p-3 border-t border-slate-100 space-y-2">
                    {/* User info */}
                    {!collapsed && user && (
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                    )}
                    <button onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all ${collapsed ? 'justify-center' : ''}`}>
                        <LogOut className="w-[18px] h-[18px]" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main content */}
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-60'}`}>
                {/* Top bar */}
                <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-100 flex items-center px-6 sticky top-0 z-30">
                    <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
                </header>

                {/* Page content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
