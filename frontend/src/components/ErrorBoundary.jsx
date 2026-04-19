import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('[HealHive] UI runtime error', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
                    <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h1 className="text-xl font-semibold text-slate-800">Something went wrong</h1>
                        <p className="text-sm text-slate-600 mt-2">
                            The page hit an unexpected issue. Refresh to recover.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
