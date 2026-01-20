"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
            toast.variant === "destructive"
              ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
              : toast.variant === "success"
              ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
          )}
        >
          <div className="grid gap-1">
            {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
            {toast.description && (
              <p className="text-sm opacity-90">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function toast(props: Omit<Toast, "id">) {
  // This is a placeholder for direct toast calls
  // In practice, use the useToast hook
  console.log("Toast:", props);
}
