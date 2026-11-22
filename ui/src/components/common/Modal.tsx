import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-none"
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidth} rounded-[var(--radius-lg)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] p-6 transition-all duration-150`}
      >
        <div className="flex items-start justify-between gap-4 border-b-hairline pb-4 mb-5">
          <div>
            <h2 id="modal-title" className="font-serif text-lg font-normal text-[var(--text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--bg-subtle)]"
          >
            <X size={15} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
