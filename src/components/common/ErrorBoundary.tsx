import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log safely without exposing private data
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught error:', error.message, errorInfo)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-ivory-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-ivory-50 border border-terracotta-200 rounded-2xl p-8 shadow-elevated text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
              Something encountered an issue
            </h2>
            <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">
              Celebrio AI caught an unexpected interface disruption. Your saved plan data
              is safe in local persistence.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={this.handleReset}
              className="w-full"
            >
              Reload Planner Workspace
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

