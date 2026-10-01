import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Database, ChevronLeft } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  /** Second step for the destructive action, so it cannot be a stray tap. */
  isConfirmingReset: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isConfirmingReset: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private retry = () => {
    this.setState({ hasError: false, error: null, isConfirmingReset: false });
  };

  private resetData = () => {
    localStorage.clear();
    indexedDB.deleteDatabase("keyval-store");
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { isConfirmingReset, error } = this.state;

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div
            className="grid place-items-center w-14 h-14 rounded-panel squircle mb-6"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-destructive) 14%, transparent)",
              color: "var(--color-destructive)",
            }}
          >
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>

          <h1 className="text-title-2 font-semibold text-text tracking-[-0.02em]">
            Something went wrong
          </h1>
          <p className="text-subheadline text-muted max-w-[360px] mt-2 leading-relaxed">
            {isConfirmingReset
              ? "This deletes every project, collection and preference stored in this browser. It cannot be undone."
              : "The app hit an unexpected error. Your projects and library are saved locally, so trying again costs nothing."}
          </p>

          {error?.message && !isConfirmingReset && (
            <details className="mt-4 max-w-[420px] w-full">
              <summary className="text-caption-1 text-faint cursor-pointer hover:text-muted transition-colors">
                Technical details
              </summary>
              <pre className="mt-2 p-3 rounded-control bg-surface text-left text-caption-2 text-muted overflow-auto max-h-32 scrollbar-ios">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2.5 w-full max-w-[280px] mt-8">
            {isConfirmingReset ? (
              <>
                <button
                  type="button"
                  onClick={this.resetData}
                  className="w-full h-12 rounded-control text-body font-semibold text-white
                             active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: "var(--color-destructive)" }}
                >
                  Erase everything
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ isConfirmingReset: false })}
                  className="w-full h-12 rounded-control text-body font-medium text-text
                             bg-surface active:scale-[0.98] transition-transform
                             inline-flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Keep my data
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={this.retry}
                  className="w-full h-12 rounded-control text-body font-semibold
                             text-white active:scale-[0.98] transition-transform
                             inline-flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <RotateCcw size={17} /> Try again
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ isConfirmingReset: true })}
                  className="w-full h-12 rounded-control text-body font-medium text-muted
                             hover:text-text bg-surface active:scale-[0.98]
                             transition-[transform,color] inline-flex items-center
                             justify-center gap-2"
                >
                  <Database size={16} /> Reset local data
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
