import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6">
                            Aplikasi mengalami error yang tidak terduga.
                        </p>

                        {this.state.error && (
                            <div className="bg-gray-100 p-4 rounded-md text-left overflow-auto max-h-48 mb-6 text-xs font-mono border border-gray-200">
                                <p className="font-bold text-red-600 mb-2">{this.state.error.toString()}</p>
                                {this.state.errorInfo && (
                                    <pre className="text-gray-600 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Muat Ulang Halaman
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                            >
                                Kembali ke Beranda
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
