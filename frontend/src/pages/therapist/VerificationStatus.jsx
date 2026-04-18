import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Clock, XCircle, ArrowRight, FileText, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const stages = [
    { key: 'submitted', label: 'Application Submitted', icon: FileText },
    { key: 'review', label: 'Under Review', icon: Clock },
    { key: 'verification', label: 'License Verification', icon: Shield },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
]

export default function VerificationStatus() {
    const { user } = useAuth()
    const verified = !!user?.therapistVerified
    const currentStage = verified ? 3 : 1

    return (
        <div className="pt-16 min-h-screen bg-gradient-to-b from-wood-50 to-white">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-2xl sm:text-3xl font-bold text-wood-800 tracking-tight mb-2">Verification Status</h1>
                    <p className="text-wood-500 text-sm">Track the progress of your application</p>
                </div>

                <div className="bg-white rounded-3xl border border-wood-100 p-6 sm:p-8 mb-8">
                    <div className="space-y-0">
                        {stages.map((stage, i) => {
                            const isCompleted = i <= currentStage
                            const isCurrent = i === currentStage
                            const StageIcon = stage.icon
                            return (
                                <div key={stage.key} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
                                                ? isCurrent ? 'bg-wood-600 text-white shadow-lg shadow-wood-300/40' : 'bg-emerald-100 text-emerald-500'
                                                : 'bg-wood-100 text-wood-400'
                                            }`}>
                                            <StageIcon className="w-5 h-5" />
                                        </div>
                                        {i < stages.length - 1 && (
                                            <div className={`w-0.5 h-12 my-1 ${isCompleted ? 'bg-emerald-200' : 'bg-wood-100'}`} />
                                        )}
                                    </div>
                                    <div className="pt-2 pb-6">
                                        <h3 className={`text-sm font-semibold ${isCompleted ? 'text-wood-800' : 'text-wood-400'}`}>{stage.label}</h3>
                                        {isCurrent && !verified && (
                                            <p className="text-xs text-wood-500 mt-1 font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> In progress...</p>
                                        )}
                                        {isCompleted && !isCurrent && <p className="text-xs text-emerald-500 mt-1">Completed</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {verified ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-emerald-800 mb-1">You're verified!</h3>
                        <p className="text-sm text-emerald-600 mb-4">Your account is active and ready to accept patients.</p>
                        <Link to="/therapist/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg transition-all">
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                        <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-amber-800 mb-1">Under Review</h3>
                        <p className="text-sm text-amber-600">Our team is reviewing your credentials. This usually takes 1–3 business days.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
