import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] Erro do app capturado:", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      href: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-red-700">Ops, algo falhou no aplicativo</h1>
            <p className="mt-2 text-sm text-gray-600">O erro foi registrado no console para diagnóstico.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error("[window.error] Runtime error:", {
        message: event?.message,
        filename: event?.filename,
        lineno: event?.lineno,
        colno: event?.colno,
        href: window.location.href,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[unhandledrejection] Promise rejeitada:", {
        reason: event?.reason,
        href: window.location.href,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AppErrorBoundary>
  );
}