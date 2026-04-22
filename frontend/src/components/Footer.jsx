import { Link } from 'react-router-dom'
import { Leaf, Shield, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="footer-premium">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ background: 'rgba(148,212,178,0.15)', border: '1px solid rgba(148,212,178,0.25)' }}>
                                <Leaf className="w-4 h-4" style={{ color: 'var(--color-primary-fixed-dim)' }} />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">
                                Heal<span style={{ color: 'var(--color-primary-fixed-dim)' }}>Hive</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            A safe, ethical platform connecting you with licensed mental health professionals.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
                        <ul className="space-y-2.5 text-sm">
                            {[
                                { to: '/chat',   label: 'Anonymous Chat' },
                                { to: '/login',  label: 'Login' },
                                { href: '/#how-it-works', label: 'How It Works' },
                            ].map((item, i) => (
                                <li key={i}>
                                    {item.to
                                        ? <Link to={item.to}
                                                className="transition-colors hover:text-white"
                                                style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                              {item.label}
                                          </Link>
                                        : <a href={item.href}
                                             className="transition-colors hover:text-white"
                                             style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                              {item.label}
                                          </a>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Professionals */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">For Professionals</h4>
                        <ul className="space-y-2.5 text-sm">
                            {[
                                { to: '/therapist/signup', label: 'Join as Therapist' },
                                { href: '/#for-therapists',label: 'Why HealHive' },
                            ].map((item, i) => (
                                <li key={i}>
                                    {item.to
                                        ? <Link to={item.to}
                                                className="transition-colors hover:text-white"
                                                style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                              {item.label}
                                          </Link>
                                        : <a href={item.href}
                                             className="transition-colors hover:text-white"
                                             style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                              {item.label}
                                          </a>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trust & Safety */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Trust &amp; Safety</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-primary-fixed-dim)' }} />
                                <a href="/#privacy"
                                   className="transition-colors hover:text-white"
                                   style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                    Privacy Policy
                                </a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-primary-fixed-dim)' }} />
                                <a href="/#contact"
                                   className="transition-colors hover:text-white"
                                   style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        © {new Date().getFullYear()} HealHive. Compassionate care, powered by technology.
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
                        HealHive does not provide medical diagnoses. If you are in crisis, please contact your local emergency services.
                    </p>
                </div>
            </div>
        </footer>
    )
}
