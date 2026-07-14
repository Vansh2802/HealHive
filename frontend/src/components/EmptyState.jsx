import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * EmptyState — warm, on-brand empty state with optional CTA.
 *
 * @param {import('lucide-react').LucideIcon} icon  — Lucide icon component
 * @param {string}   message   — headline (serif, warm copy)
 * @param {string}   [subtext] — optional secondary line
 * @param {string}   [ctaLabel]  — CTA button text
 * @param {string}   [ctaTo]     — route for <Link> CTA
 * @param {function} [ctaOnClick] — handler for <button> CTA
 * @param {string}   [className] — extra container class
 */
export default function EmptyState({
    icon: Icon,
    message,
    subtext,
    ctaLabel,
    ctaTo,
    ctaOnClick,
    className = '',
}) {
    return (
        <div className={`empty-state ${className}`}>
            {Icon && (
                <div className="empty-state-icon">
                    <Icon style={{ width: 24, height: 24, color: 'var(--color-primary)' }} />
                </div>
            )}
            {message && <p className="empty-state-message">{message}</p>}
            {subtext && <p className="empty-state-sub">{subtext}</p>}

            {ctaLabel && ctaTo && (
                <Link to={ctaTo} className="empty-state-cta">
                    {ctaLabel}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
            )}
            {ctaLabel && ctaOnClick && !ctaTo && (
                <button onClick={ctaOnClick} className="empty-state-cta">
                    {ctaLabel}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
            )}
        </div>
    )
}
