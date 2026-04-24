import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  EyeOff,
  FileText,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'

const severityStyles = {
  EMERGENCY: {
    badge: 'bg-red-100 text-red-800 ring-red-200',
    panel: 'from-red-50 via-red-50 to-white border-red-200',
    accent: 'text-red-700',
    pill: 'bg-red-600 text-white',
    icon: AlertTriangle,
  },
  CRITICAL: {
    badge: 'bg-red-100 text-red-800 ring-red-200',
    panel: 'from-red-50 via-red-50 to-white border-red-200',
    accent: 'text-red-700',
    pill: 'bg-red-600 text-white',
    icon: AlertTriangle,
  },
  HIGH: {
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    panel: 'from-orange-50 via-orange-50 to-white border-orange-200',
    accent: 'text-orange-700',
    pill: 'bg-orange-600 text-white',
    icon: ShieldAlert,
  },
  MEDIUM: {
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    panel: 'from-amber-50 via-amber-50 to-white border-amber-200',
    accent: 'text-amber-700',
    pill: 'bg-amber-500 text-white',
    icon: HeartPulse,
  },
  LOW: {
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    panel: 'from-emerald-50 via-emerald-50 to-white border-emerald-200',
    accent: 'text-emerald-700',
    pill: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
  },
}

const sectionCard = 'rounded-2xl border border-slate-100 bg-white/90 shadow-sm backdrop-blur'

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|\r|•|\u2022|;|\|/)
      .map(item => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

function parseReportInput(reportData) {
  const base = reportData?.report ?? reportData ?? {}

  if (typeof base === 'string') {
    try {
      return JSON.parse(base)
    } catch {
      return {}
    }
  }

  return base && typeof base === 'object' ? base : {}
}

function formatReportDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date)

  const getPart = type => parts.find(part => part.type === type)?.value || ''
  const dayPeriod = getPart('dayPeriod').toUpperCase()

  return `${getPart('day')} ${getPart('month')} ${getPart('year')}, ${getPart('hour')}:${getPart('minute')} ${dayPeriod}`
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children, tone = 'slate' }) {
  const toneMap = {
    slate: 'text-slate-600 bg-slate-100',
    emerald: 'text-emerald-700 bg-emerald-100',
    amber: 'text-amber-700 bg-amber-100',
    orange: 'text-orange-700 bg-orange-100',
    red: 'text-red-700 bg-red-100',
    blue: 'text-blue-700 bg-blue-100',
  }

  return (
    <div className={sectionCard}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneMap[tone] || toneMap.slate}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default function TherapistReport({ reportData, viewer = 'therapist' }) {
  const report = parseReportInput(reportData)
  const isTherapistView = viewer === 'therapist'
  const visibleToTherapist = report.visible_to_therapist ?? reportData?.visible_to_therapist ?? true
  const visibleToUser = report.visible_to_user ?? reportData?.visible_to_user ?? false
  const canSeeClinicalDetails = isTherapistView ? visibleToTherapist : false

  const userId = report.user_id || reportData?.user_id || reportData?.anonymous_user_id || 'Unknown user'
  const summary = report.summary || 'No summary available.'
  const keyIssues = normalizeArray(report.key_issues)
  const severityScore = report.severity_score ?? reportData?.severity_score
  const severityLevel = String(report.severity_level || reportData?.severity_level || 'LOW').toUpperCase()
  const recommendation = report.recommendation || 'No recommendation available.'
  const suggestedActions = normalizeArray(report.suggested_actions)
  const generatedAt = formatReportDate(report.generated_at || reportData?.generated_at || reportData?.updated_at || reportData?.created_at)

  const severity = severityStyles[severityLevel] || severityStyles.LOW
  const SeverityIcon = severity.icon

  if (!canSeeClinicalDetails) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <EyeOff className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Clinical details restricted</p>
            <p className="mt-1 text-sm text-slate-600">
              This report is not available in the current view. {visibleToUser ? 'A user-safe summary can be shown instead.' : 'It is currently visible only to the therapist.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className={`rounded-3xl border bg-gradient-to-br ${severity.panel} p-5 shadow-sm`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                <UserRound className="h-3.5 w-3.5" /> User {userId}
              </span>
              {severityLevel === 'EMERGENCY' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Emergency
                </span>
              )}
              {visibleToTherapist && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 backdrop-blur">
                  Therapist visible
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Generated</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{generatedAt}</p>
          </div>

          <div className={`inline-flex items-stretch overflow-hidden rounded-3xl border border-white/70 shadow-sm ${severity.badge}`}>
            <div className={`flex min-w-[150px] items-center gap-3 px-4 py-4 ${severity.pill}`}>
              <SeverityIcon className="h-5 w-5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-85">Severity</p>
                <p className="text-lg font-bold leading-none">{severityLevel}</p>
              </div>
            </div>
            <div className="flex items-center px-4 py-4 text-slate-800">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Score</p>
                <p className={`text-2xl font-bold ${severity.accent}`}>{severityScore ?? 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoRow icon={FileText} label="User ID" value={userId} />
        <InfoRow icon={CalendarClock} label="Date / Time" value={generatedAt} />
      </div>

      <SectionCard icon={ClipboardList} title="Key Issues" tone="orange">
        {keyIssues.length > 0 ? (
          <ul className="space-y-3">
            {keyIssues.map(issue => (
              <li key={issue} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No key issues were identified.</p>
        )}
      </SectionCard>

      <SectionCard icon={Sparkles} title="Session Summary" tone="blue">
        <p className="text-sm leading-7 text-slate-700">{summary}</p>
      </SectionCard>

      <SectionCard icon={Target} title="Recommendation" tone="emerald">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-sm leading-7 font-medium text-emerald-900">{recommendation}</p>
        </div>
      </SectionCard>

      <SectionCard icon={CheckCircle2} title="Suggested Actions" tone="slate">
        {suggestedActions.length > 0 ? (
          <ul className="space-y-3">
            {suggestedActions.map(action => (
              <li key={action} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No suggested actions were provided.</p>
        )}
      </SectionCard>
    </motion.div>
  )
}