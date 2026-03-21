// ─── Toast Notification Component ───
import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm max-w-sm animate-slide-in ${
                            toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' :
                            toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
                            'bg-wood-50/95 border-wood-200 text-wood-800'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-wood-500 flex-shrink-0" />}
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-0.5 rounded-md hover:bg-black/5 transition-colors flex-shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}
