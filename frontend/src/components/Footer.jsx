import { Link } from 'react-router-dom'
import { Leaf, Shield, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <Leaf className="w-5 h-5 text-sage-400" />
                            <span className="text-lg font-bold text-white">
                                Heal<span className="text-sage-400">Hive</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            A safe, ethical platform connecting you with licensed mental health professionals.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/chat" className="hover:text-white transition-colors">Anonymous Chat</Link></li>
                            <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                            <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                        </ul>
                    </div>

                    {/* For Professionals */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">For Professionals</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/therapist/signup" className="hover:text-white transition-colors">Join as Therapist</Link></li>
                            <li><a href="/#for-therapists" className="hover:text-white transition-colors">Why HealHive</a></li>
                        </ul>
                    </div>

                    {/* Ethics */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Trust & Safety</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-sage-400" />
                                <a href="/#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-sage-400" />
                                <a href="/#contact" className="hover:text-white transition-colors">Contact Us</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs">
                        © {new Date().getFullYear()} HealHive. Compassionate care, powered by technology.
                    </p>
                    <p className="text-xs text-slate-600">
                        HealHive does not provide medical diagnoses. If you are in crisis, please contact your local emergency services.
                    </p>
                </div>
            </div>
        </footer>
    )
}
