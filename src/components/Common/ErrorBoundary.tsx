"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryKey: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Pick<State, "hasError" | "error"> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.name || "Default"}]:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/[0.04] border border-white/10 m-4 h-32 overflow-hidden">
          <div className="text-[13px] font-black uppercase tracking-widest text-[#ff3b30] mb-2 px-2 py-0.5 bg-black">
             Runtime Exception Detected
          </div>
          <p className="text-[12px] font-black uppercase text-center max-w-[200px] leading-tight text-white/60">
             {this.props.name ? `${this.props.name} temporarily unavailable` : "Operation Surface temporarily unavailable"}
          </p>
          <button
             onClick={() => this.setState((prev) => ({ hasError: false, retryKey: prev.retryKey + 1 }))}
             className="text-[12px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 border border-white/15 px-2 py-1 mt-2 cursor-pointer"
          >
             Retry
          </button>
        </div>
      );
    }

    return <div key={this.state.retryKey} className="h-full w-full">{this.props.children}</div>;
  }
}
