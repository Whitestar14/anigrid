import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Database } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="size-12 flex items-center justify-center text-destructive mb-8">
            <AlertTriangle size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-text tracking-tighter mb-3">Something went wrong</h1>
          <p className="text-muted text-base max-w-[340px] mb-10 leading-relaxed font-medium">
            The application encountered an unexpected error.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              icon={<RefreshCw size={18} />}
              className="w-full"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              variant="secondary"
              size="lg"
              icon={<Database size={18} />}
              className="w-full"
            >
              Reset All Data
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
