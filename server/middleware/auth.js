import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'healhive_secret_key_change_in_prod'

// Verify JWT token and attach user to req
export function verifyToken(req, res, next) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided.' })
    }
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' })
    }
}

// Factory: require specific role(s)
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' })
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Insufficient permissions.' })
        }
        next()
    }
}
