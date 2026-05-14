"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "error" | "success" | "info";

type ToastInput = {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type GlobalToastContextValue = {
  pushToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
};

const GlobalToastContext = createContext<GlobalToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 7000;

const variantClasses: Record<ToastVariant, string> = {
  error: "border-[#f2c7ce] bg-[#fff7f8] text-[#7f1d2d]",
  success: "border-[#cbe8d1] bg-[#f6fff8] text-[#1f5c2e]",
  info: "border-[#d7defe] bg-[#f7f9ff] text-[#213a8f]",
};

const GlobalToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}) => {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      style={{ zIndex: 100 }}
    >
      {toasts.map((toast) => {
        const variant = toast.variant ?? "info";

        return (
          <section
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_16px_40px_rgba(26,31,44,0.12)] backdrop-blur-sm ${variantClasses[variant]}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-5">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-5 opacity-90">{toast.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full px-2 py-1 text-xs font-semibold opacity-80 transition hover:opacity-100"
                aria-label="Cerrar notificacion"
              >
                Cerrar
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export function GlobalToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ duration = DEFAULT_DURATION_MS, ...toast }: ToastInput) => {
      const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((current) => {
        const nextToast = { ...toast, id };
        const withoutDuplicate = current.filter((item) => item.id !== id);

        return [...withoutDuplicate, nextToast];
      });

      const existingTimer = timersRef.current.get(id);

      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);

      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }

      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ pushToast, dismissToast }),
    [dismissToast, pushToast],
  );

  return (
    <GlobalToastContext.Provider value={value}>
      {children}
      <GlobalToastViewport toasts={toasts} onDismiss={dismissToast} />
    </GlobalToastContext.Provider>
  );
}

export function useGlobalToast() {
  const context = useContext(GlobalToastContext);

  if (!context) {
    throw new Error("useGlobalToast must be used within GlobalToastProvider");
  }

  return context;
}