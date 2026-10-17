import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

interface DialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md";
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
  size = "sm",
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("input, button")
        ?.focus();
    }, 40);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const width = size === "md" ? "max-w-md" : "max-w-sm";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative w-full ${width} overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/85 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-scale-in`}
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-zinc-100/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-4 border-b border-zinc-900/90 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-zinc-900/90 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
