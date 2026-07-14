import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { User, Mail, Shield, Key, LogOut, Loader2, CheckCircle, Edit, Save, BookOpen, Award, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../services/api/auth'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function SettingsPage() {
    const { user, logout, setUser } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [changingPassword, setChangingPassword] = useState(false)
    const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
    const [pwError, setPwError] = useState('')

    const [isEditing, setIsEditing] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [profileData, setProfileData] = useState({
        name: '',
        specialization: '',
        specialties: '',
        yearsOfExperience: '',
        bio: '',
        licenseNumber: '',
        universityName: '',
    })

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                specialization: user.specialization || '',
                specialties: user.specialties ? user.specialties.join(', ') : '',
                yearsOfExperience: user.yearsOfExperience !== null && user.yearsOfExperience !== undefined ? user.yearsOfExperience : '',
                bio: user.bio || '',
                licenseNumber: user.licenseNumber || '',
                universityName: user.universityName || '',
            })
        }
    }, [user])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setPwError('')
        if (!pw.current || !pw.newPw || !pw.confirm) {
            setPwError('All fields are required')
            return
        }
        if (pw.newPw.length < 8) {
            setPwError('New password must be at least 8 characters')
            return
        }
        if (pw.newPw !== pw.confirm) {
            setPwError('Passwords do not match')
            return
        }
        // Note: password change API endpoint would go here
        toast.success('Password change feature coming soon')
        setPw({ current: '', newPw: '', confirm: '' })
        setChangingPassword(false)
    }

    const handleProfileSave = async (e) => {
        e.preventDefault()
        setUpdating(true)

        const specialtiesArray = profileData.specialties
            ? profileData.specialties.split(',').map(s => s.trim()).filter(Boolean)
            : []

        const payload = {
            name: profileData.name,
            specialization: profileData.specialization,
            specialties: specialtiesArray,
            yearsOfExperience: profileData.yearsOfExperience !== '' ? parseInt(profileData.yearsOfExperience) : null,
            bio: profileData.bio,
            licenseNumber: profileData.licenseNumber,
            universityName: profileData.universityName,
        }

        const res = await updateProfile(payload)
        if (res.success) {
            setUser(res.user)
            toast.success('Profile updated successfully')
            setIsEditing(false)
        } else {
            toast.error(res.error || 'Failed to update profile')
        }
        setUpdating(false)
    }

    const roleBadge = user?.role === 'therapist' ? 'Therapist'
        : user?.role === 'admin' ? 'Administrator'
        : 'Patient'

    return (
        <>
            {/* Header */}
            <motion.div {...fadeUp} className="mb-8 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-semibold"
                        style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--color-on-surface)' }}>
                        Settings
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-outline)' }}>
                        Manage your account and preferences.
                    </p>
                </div>
                {user?.role === 'therapist' && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center gap-2"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                        <Edit style={{ width: 14, height: 14 }} />
                        Edit Profile
                    </button>
                )}
            </motion.div>

            {/* Profile Info */}
            <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
                <h3 className="dashboard-section-header">
                    <User style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                    Profile Details
                </h3>

                {isEditing ? (
                    <form onSubmit={handleProfileSave} className="settings-card p-6 mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                                    className="input-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    value={profileData.specialization}
                                    onChange={e => setProfileData(p => ({ ...p, specialization: e.target.value }))}
                                    className="input-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    value={profileData.yearsOfExperience}
                                    onChange={e => setProfileData(p => ({ ...p, yearsOfExperience: e.target.value }))}
                                    className="input-primary"
                                    min="0"
                                    max="60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    University Name
                                </label>
                                <input
                                    type="text"
                                    value={profileData.universityName}
                                    onChange={e => setProfileData(p => ({ ...p, universityName: e.target.value }))}
                                    className="input-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    License Number
                                </label>
                                <input
                                    type="text"
                                    value={profileData.licenseNumber}
                                    onChange={e => setProfileData(p => ({ ...p, licenseNumber: e.target.value }))}
                                    className="input-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Specialties (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={profileData.specialties}
                                    onChange={e => setProfileData(p => ({ ...p, specialties: e.target.value }))}
                                    className="input-primary"
                                    placeholder="e.g. CBT, Trauma, Anxiety"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Bio
                            </label>
                            <textarea
                                value={profileData.bio}
                                onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))}
                                className="input-primary min-h-[100px]"
                                placeholder="Tell patients about your background and clinical approach..."
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className="btn-primary flex items-center gap-2"
                                disabled={updating}
                                style={{ padding: '10px 20px', fontSize: '13px' }}
                            >
                                {updating ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    if (user) {
                                        setProfileData({
                                            name: user.name || '',
                                            specialization: user.specialization || '',
                                            specialties: user.specialties ? user.specialties.join(', ') : '',
                                            yearsOfExperience: user.yearsOfExperience || '',
                                            bio: user.bio || '',
                                            licenseNumber: user.licenseNumber || '',
                                            universityName: user.universityName || '',
                                        })
                                    }
                                }}
                                className="btn-secondary"
                                style={{ padding: '10px 20px', fontSize: '13px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="settings-card mb-6">
                        <div className="settings-row">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                     style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))' }}>
                                    <User style={{ width: 18, height: 18, color: '#fff' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Full name</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                     style={{ background: 'var(--color-surface-container)' }}>
                                    <Mail style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                        {user?.email || '—'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Email</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                     style={{ background: 'var(--color-surface-container)' }}>
                                    <Shield style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                        {roleBadge}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Account role</p>
                                </div>
                            </div>
                            <span className="badge badge-sage">{roleBadge}</span>
                        </div>

                        {user?.role === 'therapist' && (
                            <>
                                {user?.specialization && (
                                    <div className="settings-row">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                 style={{ background: 'var(--color-surface-container)' }}>
                                                <Award style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                                    {user.specialization}
                                                    {user.yearsOfExperience !== null && user.yearsOfExperience !== undefined && (
                                                        <span className="ml-2 experience-badge">
                                                            {user.yearsOfExperience} yrs exp
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Specialization & Experience</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {user?.universityName && (
                                    <div className="settings-row">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                 style={{ background: 'var(--color-surface-container)' }}>
                                                <BookOpen style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                                    {user.universityName}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--color-outline)' }}>University</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {user?.licenseNumber && (
                                    <div className="settings-row">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                 style={{ background: 'var(--color-surface-container)' }}>
                                                <FileSpreadsheet style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                                    {user.licenseNumber}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--color-outline)' }}>License Number</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {user?.specialties && user.specialties.length > 0 && (
                                    <div className="settings-row">
                                        <div className="flex flex-col gap-1.5 py-1">
                                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Specialties</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.specialties.map(spec => (
                                                    <span key={spec} className="specialty-tag specialty-tag-muted">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {user?.bio && (
                                    <div className="settings-row">
                                        <div className="flex flex-col gap-1 py-1">
                                            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>Bio</p>
                                            <p className="text-sm" style={{ color: 'var(--color-on-surface)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {user.bio}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Security */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                <h3 className="dashboard-section-header">
                    <Key style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                    Security
                </h3>
                <div className="settings-card mb-6">
                    {!changingPassword ? (
                        <div className="settings-row">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                     style={{ background: 'var(--color-surface-container)' }}>
                                    <Key style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                                        Password
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                                        ••••••••
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setChangingPassword(true)}
                                className="btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5"
                                       style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Current password
                                </label>
                                <input
                                    type="password"
                                    value={pw.current}
                                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                                    className="input-primary"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5"
                                       style={{ color: 'var(--color-on-surface-variant)' }}>
                                    New password
                                </label>
                                <input
                                    type="password"
                                    value={pw.newPw}
                                    onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                                    className="input-primary"
                                    placeholder="Min 8 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5"
                                       style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Confirm new password
                                </label>
                                <input
                                    type="password"
                                    value={pw.confirm}
                                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                                    className="input-primary"
                                    placeholder="Repeat new password"
                                />
                            </div>
                            {pwError && (
                                <p className="text-xs" style={{ color: 'var(--color-error)' }}>{pwError}</p>
                            )}
                            <div className="flex gap-2">
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                                    Update Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setChangingPassword(false); setPwError('') }}
                                    className="btn-secondary"
                                    style={{ padding: '10px 20px', fontSize: '13px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>

            {/* Logout */}
            <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-200"
                    style={{
                        background: 'rgba(186,26,26,0.05)',
                        border: '1px solid rgba(186,26,26,0.12)',
                        color: '#991b1b',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(186,26,26,0.09)'
                        e.currentTarget.style.borderColor = 'rgba(186,26,26,0.22)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(186,26,26,0.05)'
                        e.currentTarget.style.borderColor = 'rgba(186,26,26,0.12)'
                    }}
                >
                    <LogOut style={{ width: 18, height: 18 }} />
                    Sign out of your account
                </button>
            </motion.div>
        </>
    )
}
