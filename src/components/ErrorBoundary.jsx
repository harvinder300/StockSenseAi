import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#00ff41', padding: '2rem', fontFamily: 'monospace', background: '#050505', height: '100vh' }}>
                    <h1>// SYSTEM_FAILURE</h1>
                    <p>CRITICAL ERROR DETECTED IN RENDER LOOP.</p>
                    <pre style={{ color: '#d30000' }}>{this.state.error?.toString()}</pre>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#00ff41', border: 'none', cursor: 'pointer' }}>
                        [REBOOT_SYSTEM]
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
