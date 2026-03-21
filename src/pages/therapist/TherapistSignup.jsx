import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { register } from '../../services/api/auth'

export default function TherapistSignup() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', license: '', university: '', specialization: '', bio: '', password: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const specializations = [
        'Anxiety & Depression', 'Trauma & PTSD', 'Relationships & Family',
        'Substance Abuse', 'Eating Disorders', 'Child & Adolescent', 'Grief & Loss', 'Other',
    ]

    const validate = () => {
        const errs = {}
        if (!form.name.trim()) errs.name = 'Full name is required'
        if (!form.email.trim()) errs.email = 'Email is required'
        if (!form.license.trim()) errs.license = 'License number is required'
        if (!form.university.trim()) errs.university = 'University name is required'
        if (!form.specialization) errs.specialization = 'Please select a specialization'
        if (!form.bio.trim()) errs.bio = 'Brief bio is required'
        if (!form.password.trim()) errs.password = 'Password is required'
        else if (form.password.length < 8) errs.password = 'Must be at least 8 characters'
        return errs
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setErrors({})
        setLoading(true)
        const result = await register(form.name.trim(), form.email.trim(), form.password, 'therapist', {
            specialization: form.specialization,
            license_number: form.license.trim(),
            university_name: form.university.trim(),
            bio: form.bio.trim(),
        })
        if (result.success) setSubmitted(true)
        else setErrors({ submit: typeof result.error === 'string' ? result.error : 'Unable to submit application.' })
        setLoading(false)
    }

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }

    if (submitted) {
        return (
            <div className="pt-16 min-h-screen gradient-bg relative flex items-center justify-center p-4 overflow-hidden">
                <div className="floating-orb orb-1" /><div className="floating-orb orb-2" />
                <div className="relative z-10 text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-wood-800 mb-2">Application Submitted!</h2>
                    <p className="text-wood-500 text-sm mb-1">Thank you, {form.name}.</p>
                    <p className="text-xs text-wood-400 mb-6">Our team will review your credentials and verify your license. You'll be notified once approved.</p>
                    <button onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-wood-700 to-wood-600 hover:shadow-lg transition-all">
                        Go to Login <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    const inputCls = (field) => `w-full px-4 py-3 rounded-xl border text-sm text-wood-800 placeholder-wood-400 bg-white/80 outline-none transition-all focus:border-wood-500 focus:ring-2 focus:ring-wood-200 ${errors[field] ? 'border-red-300 bg-red-50/50' : 'border-wood-200'}`

    return (
        <div className="pt-16 min-h-screen gradient-bg relative overflow-hidden">
            <div className="floating-orb orb-1" /><div className="floating-orb orb-2" />
            <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-wood-900 tracking-tight mb-2">Join HealHive</h1>
                    <p className="text-wood-500 text-sm">Apply as a licensed therapist</p>
                </div>

                <div className="glass-card rounded-3xl p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">Full Name</label>
                            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Dr. Jane Smith" className={inputCls('name')} />
                            {errors.name && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">Professional Email</label>
                            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@clinic.com" className={inputCls('email')} />
                            {errors.email && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">License Number</label>
                            <input value={form.license} onChange={e => update('license', e.target.value)} placeholder="PSY-2024-XXXX" className={inputCls('license')} />
                            {errors.license && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.license}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">University Name</label>
                            <input value={form.university} onChange={e => update('university', e.target.value)} placeholder="e.g. Stanford University" className={inputCls('university')} />
                            {errors.university && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.university}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">Specialization</label>
                            <select value={form.specialization} onChange={e => update('specialization', e.target.value)}
                                className={`${inputCls('specialization')} ${!form.specialization ? 'text-wood-400' : ''}`}>
                                <option value="">Select specialization</option>
                                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.specialization && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.specialization}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">Brief Bio</label>
                            <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3}
                                placeholder="Tell us about your experience and approach..." className={`${inputCls('bio')} resize-none`} />
                            {errors.bio && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.bio}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-wood-700 mb-1.5">Password</label>
                            <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" className={inputCls('password')} />
                            {errors.password && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-wood-700 to-wood-600 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
                        </button>
                        {errors.submit && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{errors.submit}</p>}
                    </form>

                    <p className="text-center text-sm text-wood-500 mt-6">
                        Already registered? <Link to="/login" className="font-medium text-wood-600 hover:text-wood-800 transition-colors">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
