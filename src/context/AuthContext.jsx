import { createContext, useContext, useState, useEffect } from 'react'
import { fetchMe, clearToken } from '../services/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // On mount, try to rehydrate session from stored JWT
    useEffect(() => {
        fetchMe().then(u => {
            setUser(u)
            setLoading(false)
        })
    }, [])

    const login = (userData) => {
        // userData comes from /api/login response — token already stored by src/api/auth.js
        setUser(userData)
    }

    const logout = () => {
        clearToken()
        setUser(null)
    }

    const value = {
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
