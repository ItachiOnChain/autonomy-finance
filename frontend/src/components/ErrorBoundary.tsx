import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors and display a fallback UI
 * instead of a black screen. Prevents the entire app from crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(_error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        // Reload the page to reset state
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI or use provided fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-white flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">⚠️</div>
                            <h1 className="text-xl font-bold text-red-900">
                                Something went wrong
                            </h1>
                        </div>

                        <p className="text-sm text-red-800 mb-4">
                            The application encountered an unexpected error. This has been logged for investigation.
                        </p>

                        {this.state.error && (
                            <details className="mb-4">
                                <summary className="text-xs text-red-700 cursor-pointer hover:underline">
                                    Error details (for developers)
                                </summary>
                                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
