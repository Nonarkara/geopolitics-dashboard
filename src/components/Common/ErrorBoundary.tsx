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
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
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
        <div className="flex flex-col items-center justify-center p-8 bg-black/5 border border-black/10 m-4 h-32 overflow-hidden">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#ff3b30] mb-2 px-2 py-0.5 bg-black">
             Runtime Exception Detected
          </div>
          <p className="text-[8px] font-black opacity-30 uppercase text-center max-w-[200px] leading-tight">
             Component trace failure in {this.props.name || "Operation Surface"}. Resetting stack...
          </p>
          <button 
             onClick={() => this.setState({ hasError: false })}
             className="mt-3 text-[8px] font-black underline uppercase tracking-widest opacity-60 hover:opacity-100"
          >
             Re-Initialize Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
