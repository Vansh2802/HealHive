import { ShieldAlert } from 'lucide-react'

export default function DisclaimerBanner({ compact = false }) {
    if (compact) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>This AI assistant is not a medical professional and cannot provide diagnoses.</span>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-r from-beige-100 to-wood-50 border border-wood-200/60 rounded-2xl p-4 sm:p-5">
            <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-wood-100 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-wood-600" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-wood-800 mb-1">Important Disclaimer</h4>
                    <p className="text-xs text-wood-600 leading-relaxed">
                        This AI assistant is designed to provide initial support and is <strong>not a substitute for professional medical advice</strong>.
                        It cannot diagnose conditions or prescribe treatment. If you are in crisis or experiencing a medical emergency,
                        please contact your local emergency services or a crisis helpline immediately.
                    </p>
                </div>
            </div>
        </div>
    )
}
