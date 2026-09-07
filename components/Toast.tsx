"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type ShowToast = (type: ToastType, message: string) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/40 text-emerald-200",
  error: "border-rose-500/40 text-rose-200",
  info: "border-slate-600 text-slate-200",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback<ShowToast>((type, message) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto w-full sm:w-auto max-w-sm rounded-lg border bg-slate-900/95 backdrop-blur px-4 py-3 text-sm shadow-xl " +
              STYLES[t.type]
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
