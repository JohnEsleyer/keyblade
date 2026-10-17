import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CheckIcon } from "./Icons";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

const ToastRow: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), 3200);
    return () => window.clearTimeout(t);
  }, [toast.id, onDismiss]);

  const palette: Record<ToastKind, string> = {
    success: "border-emerald-500/25 text-emerald-300",
    error: "border-red-500/25 text-red-300",
    info: "border-zinc-700 text-zinc-300",
  };

  const icon =
    toast.kind === "success" ? (
      <CheckIcon className="h-3.5 w-3.5" />
    ) : toast.kind === "error" ? (
      <AlertIcon className="h-3.5 w-3.5" />
    ) : (
      <AlertIcon className="h-3.5 w-3.5" />
    );

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto flex cursor-pointer items-center gap-2.5 rounded-xl border bg-zinc-900/95 px-3.5 py-2.5 text-xs font-medium shadow-2xl backdrop-blur-xl animate-slide-up ${palette[toast.kind]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="pr-1 text-zinc-100">{toast.message}</span>
    </div>
  );
};

export const ToastStack: React.FC<{
  toasts: Toast[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
};
