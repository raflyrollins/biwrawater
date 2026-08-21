import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('UI error:', error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.error) {
            return (
                <div className="bg-bg-page flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
                    <h1 className="text-xl font-bold text-heading">
                        Terjadi kesalahan pada tampilan
                    </h1>
                    <p className="max-w-md text-sm text-body">
                        Halaman mengalami galat saat dirender. Muat ulang untuk
                        melanjutkan.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="btn btn-brand px-5 py-2.5"
                    >
                        Muat Ulang
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
