import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Shield, UserCheck, Video, Heart, Lock, ArrowRight, Sparkles, Mail, Phone, MapPin, Leaf } from 'lucide-react'

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

export default function Landing() {
    const steps = [
        { icon: MessageCircle, title: 'Start a Conversation', desc: 'Chat anonymously with our AI assistant. No login, no judgment — just support.', gradient: 'from-sage-500 to-sage-400' },
        { icon: UserCheck, title: 'Get Matched', desc: 'Based on your needs, we connect you with a verified, licensed therapist.', gradient: 'from-lavender-500 to-lavender-400' },
        { icon: Video, title: 'Begin Healing', desc: 'Book sessions, join video calls, and take your first steps toward wellness.', gradient: 'from-sage-400 to-lavender-400' },
    ]

    return (
        <div className="pt-16">
            {/* ─── Hero ─── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 gradient-bg opacity-70" />
                <div className="absolute inset-0">
                    <div className="floating-orb orb-1" />
                    <div className="floating-orb orb-2" />
                    <div className="floating-orb orb-3" />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage-50/80 border border-sage-200/50 text-sage-700 text-xs font-medium mb-6 backdrop-blur-sm">
                            <Leaf className="w-3.5 h-3.5" />
                            Private, ethical, AI-powered support
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 tracking-tight leading-tight mb-6">
                            Your safe space for{' '}
                            <span className="bg-gradient-to-r from-sage-600 via-sage-500 to-lavender-500 bg-clip-text text-transparent">
                                mental wellness
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Start an anonymous conversation, get matched with a licensed therapist,
                            and begin your journey to healing — all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/chat"
                                className="group flex items-center gap-2 px-8 py-4 text-white font-medium rounded-2xl bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-xl hover:shadow-sage-300/30 transition-all duration-300 hover:-translate-y-0.5">
                                Start Anonymous Chat
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login"
                                className="px-8 py-4 text-slate-600 font-medium rounded-2xl border border-sage-200 hover:bg-white/60 hover:border-sage-300 transition-all duration-300">
                                I have an account
                            </Link>
                            <Link to="/signup"
                                className="px-8 py-4 text-lavender-600 font-medium rounded-2xl border border-lavender-200 hover:bg-lavender-50/60 hover:border-lavender-300 transition-all duration-300">
                                Sign up
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section id="how-it-works" className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div className="text-center mb-16" {...fadeUp} transition={{ delay: 0.1 }}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-4">How It Works</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">Three simple steps to connect with professional support.</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <motion.div key={i} {...fadeUp} transition={{ delay: 0.15 + i * 0.1 }} className="relative group">
                                <div className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-xl hover:shadow-sage-100/50 hover:border-sage-200/50 transition-all duration-500 h-full">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <step.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-sage-300 uppercase tracking-wider">Step {i + 1}</span>
                                    <h3 className="text-xl font-semibold text-slate-800 mt-2 mb-3">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Privacy & Ethics ─── */}
            <section id="privacy" className="py-20 sm:py-28 bg-gradient-to-b from-sage-50/50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                                <div className="w-14 h-14 rounded-2xl bg-lavender-100 flex items-center justify-center mb-6">
                                    <Shield className="w-7 h-7 text-lavender-600" />
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-4">
                                    Privacy & Ethics First
                                </h2>
                                <p className="text-slate-500 leading-relaxed mb-6">
                                    Your mental health journey is deeply personal. We're committed to protecting your privacy and maintaining the highest ethical standards.
                                </p>
                            </motion.div>
                            <div className="space-y-4">
                                {[
                                    { icon: Lock, title: 'Anonymous by Default', desc: 'Chat without creating an account. Your identity stays private.' },
                                    { icon: Shield, title: 'No Data Selling', desc: 'We never sell, share, or monetize your personal information.' },
                                    { icon: Heart, title: 'Ethical AI', desc: 'Our AI never diagnoses. It supports, listens, and connects you with real professionals.' },
                                ].map((item, i) => (
                                    <motion.div key={i} {...fadeUp} transition={{ delay: 0.2 + i * 0.08 }}
                                        className="flex gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                                            <item.icon className="w-5 h-5 text-sage-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{item.title}</h4>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── For Therapists ─── */}
            <section id="for-therapists" className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div className="max-w-4xl mx-auto text-center" {...fadeUp} transition={{ delay: 0.1 }}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-4">
                            For Therapists
                        </h2>
                        <p className="text-slate-500 max-w-2xl mx-auto mb-10">
                            Join a growing community of licensed professionals making mental health support more accessible.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                            {[
                                { title: 'Verified Clients', desc: 'AI pre-screens clients so you get relevant, informed referrals.' },
                                { title: 'Flexible Schedule', desc: 'Set your own availability. Work on your terms.' },
                                { title: 'Secure Platform', desc: 'HIPAA-aware infrastructure for safe, professional sessions.' },
                            ].map((item, i) => (
                                <motion.div key={i} {...fadeUp} transition={{ delay: 0.2 + i * 0.08 }}
                                    className="p-6 rounded-2xl bg-sage-50/50 border border-sage-100/50 hover:shadow-md hover:border-sage-200 transition-all duration-300">
                                    <h4 className="font-semibold text-slate-800 mb-2">{item.title}</h4>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                        <Link to="/therapist/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 text-white font-medium rounded-2xl bg-gradient-to-r from-sage-600 to-sage-500 hover:shadow-xl hover:shadow-sage-300/30 transition-all duration-300">
                            Apply to Join
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ─── Contact ─── */}
            <section id="contact" className="py-20 sm:py-28 bg-gradient-to-b from-sage-50/40 to-lavender-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-4">Get in Touch</h2>
                        <p className="text-slate-500 mb-10">Have questions? We're here to help.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { icon: Mail, label: 'Email', value: 'support@healhive.com' },
                                { icon: Phone, label: 'Crisis Line', value: '988 (US)' },
                                { icon: MapPin, label: 'Location', value: 'Remote-first' },
                            ].map((item, i) => (
                                <motion.div key={i} {...fadeUp} transition={{ delay: 0.1 + i * 0.08 }}
                                    className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <item.icon className="w-5 h-5 text-sage-500" />
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{item.label}</span>
                                    <span className="text-sm font-medium text-slate-700">{item.value}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
