import { createContext, useContext, useState, type ReactNode } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function toast(item: Omit<ToastItem, "id">) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...item, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-none text-xs transition-opacity duration-150"
          >
            <span className="mt-0.5 shrink-0">
              {t.type === "success" && <Check size={14} className="text-[var(--status-success)]" />}
              {t.type === "error" && <AlertCircle size={14} className="text-[var(--status-danger)]" />}
              {t.type === "info" && <Info size={14} className="text-[var(--text-secondary)]" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)]">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-[var(--text-secondary)] text-[12px] leading-normal">{t.description}</p>
              )}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 rounded-[var(--radius-xs)]"
              aria-label="Dismiss toast"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
