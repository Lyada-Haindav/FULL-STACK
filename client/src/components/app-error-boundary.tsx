import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: undefined,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error.",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef3ff] px-4">
        <div className="w-full max-w-lg rounded-3xl border border-[#d8e2f3] bg-white p-8 shadow-[0_18px_40px_rgba(24,48,112,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6b82ab]">App Recovery</p>
          <h1 className="mt-3 text-3xl font-display font-bold text-[#1a2a4b]">We hit an unexpected error</h1>
          <p className="mt-3 text-sm leading-6 text-[#607399]">
            We kept the app from crashing into a blank white page. Refresh once, and if the same screen comes back,
            there is still a page-level bug we should patch.
          </p>
          {this.state.message ? (
            <div className="mt-5 rounded-2xl border border-[#e4d3d3] bg-[#fff6f6] px-4 py-3 text-sm text-[#8c3d3d]">
              {this.state.message}
            </div>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button onClick={this.handleReset}>Refresh app</Button>
            <Button variant="outline" onClick={() => window.location.assign("/")}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
