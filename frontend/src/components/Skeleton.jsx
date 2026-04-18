// ─── Skeleton Loader Component ───

export default function Skeleton({ height = 'h-6', width = 'w-full', className = '', variant = 'rect', count = 1 }) {
    const baseClass = 'animate-pulse bg-slate-100 rounded-xl'
    const variantClasses = {
        rect: '',
        circle: '!rounded-full',
        text: '!rounded-lg h-4',
    }

    if (count > 1) {
        return (
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className={`${baseClass} ${variantClasses[variant] || ''} ${height} ${width} ${className}`} />
                ))}
            </div>
        )
    }

    return <div className={`${baseClass} ${variantClasses[variant] || ''} ${height} ${width} ${className}`} />
}

export { Skeleton }

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="!w-10 !h-10" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="w-3/4" />
                    <Skeleton variant="text" width="w-1/2" />
                </div>
            </div>
            <Skeleton height="h-8" />
        </div>
    )
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} height="h-24" />
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    )
}
