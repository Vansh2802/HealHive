import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Public pages
import Landing from './pages/public/Landing'
import AnonymousChat from './pages/public/AnonymousChat'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'

// User pages
import UserDashboard from './pages/user/UserDashboard'
import BookSession from './pages/user/BookSession'
import VideoSession from './pages/user/VideoSession'

// Therapist pages
import TherapistSignup from './pages/therapist/TherapistSignup'
import TherapistDashboard from './pages/therapist/TherapistDashboard'
import VerificationStatus from './pages/therapist/VerificationStatus'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

function AppLayout() {
    const location = useLocation()
    const path = location.pathname

    // Dashboard pages use their own sidebar layout — hide global navbar/footer
    const isDashboard = path.startsWith('/user/dashboard') ||
                        path.startsWith('/therapist/dashboard') ||
                        path.startsWith('/admin')
    const isVideoSession = path === '/user/session'
    const isChat = path === '/chat'

    const hideNavbar = isDashboard || isVideoSession
    const hideFooter = isDashboard || isVideoSession || isChat

    return (
        <div className="min-h-screen flex flex-col">
            {!hideNavbar && <Navbar />}

            <main className={`flex-1 ${isDashboard ? '' : ''}`}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {/* Public */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/chat" element={<AnonymousChat />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        {/* User — Protected */}
                        <Route path="/user/dashboard" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/user/book" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <BookSession />
                            </ProtectedRoute>
                        } />
                        <Route path="/user/session" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <VideoSession />
                            </ProtectedRoute>
                        } />

                        {/* Therapist — Protected */}
                        <Route path="/therapist/signup" element={<TherapistSignup />} />
                        <Route path="/therapist/dashboard" element={
                            <ProtectedRoute allowedRoles={['therapist']}>
                                <TherapistDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/therapist/verification" element={
                            <ProtectedRoute allowedRoles={['therapist']}>
                                <VerificationStatus />
                            </ProtectedRoute>
                        } />

                        {/* Admin */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        {/* 404 */}
                        <Route path="*" element={
                            <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-b from-sage-50 to-white">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-sage-200 mb-4">404</h1>
                                    <p className="text-slate-500 mb-6">Page not found</p>
                                    <a href="/" className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-lg transition-all">
                                        Go Home
                                    </a>
                                </div>
                            </div>
                        } />
                    </Routes>
                </AnimatePresence>
            </main>

            {!hideFooter && <Footer />}
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppLayout />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
