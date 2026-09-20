import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = (error?.message || "").toLowerCase();
    const name = error?.name || "";
    if (
      name === "SecurityError" ||
      msg.includes("insecure") ||
      msg.includes("securityerror") ||
      msg.includes("script error")
    ) {
      // Non-fatal browser sandbox / iframe permission error - do not crash application
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = (error?.message || "").toLowerCase();
    const name = error?.name || "";
    if (
      name === "SecurityError" ||
      msg.includes("insecure") ||
      msg.includes("securityerror") ||
      msg.includes("script error")
    ) {
      return;
    }
    console.warn("Caught in ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-teal-500/20 shadow-2xl backdrop-blur-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">PerioDash v15 Pro</h2>
            <p className="text-sm text-slate-400">
              La sesión clínica se ha reiniciado de forma segura para proteger la integridad de los datos.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
