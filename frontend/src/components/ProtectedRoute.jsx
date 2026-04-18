import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role } = useAuth()
    const location = useLocation()

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect to their own dashboard based on role
        const dashboardMap = {
            user: '/user/dashboard',
            therapist: '/therapist/dashboard',
            admin: '/admin',
        }
        return <Navigate to={dashboardMap[role] || '/'} replace />
    }

    return children
}
