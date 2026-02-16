/**
 * Sentry Error Boundary Component
 * Catches React component errors and sends them to Sentry
 */

"use client";

import React, { ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SentryErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Capture exception with error boundary info
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
       
      console.error("Error caught by Sentry Error Boundary:", error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: "20px",
              margin: "20px",
              border: "1px solid #ff0000",
              borderRadius: "4px",
              backgroundColor: "#ffe0e0",
              color: "#cc0000",
              fontFamily: "sans-serif",
            }}
          >
            <h2>Something went wrong</h2>
            <p>Our team has been notified. Please try refreshing the page.</p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details style={{ whiteSpace: "pre-wrap", marginTop: "10px", fontSize: "12px" }}>
                {this.state.error.toString()}
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default SentryErrorBoundary;
