import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "./Dropdown";
import { CheckIcon, CopyIcon, QrIcon, TrashIcon } from "./Icons";

export interface AccountView {
  id: string;
  issuer: string;
  account: string;
  current_code: string;
  seconds_left: number;
}

interface Props {
  account: AccountView;
  onShowQR: (id: string) => void;
  onDelete: (id: string) => void;
  onCopied?: (label: string) => void;
}

const RADIUS = 14;
const CIRC = 2 * Math.PI * RADIUS;

export const TOTPCard: React.FC<Props> = ({
  account,
  onShowQR,
  onDelete,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  const progress = Math.max(0, Math.min(1, account.seconds_left / 30));
  const strokeOffset = CIRC * (1 - progress);
  const expiring = account.seconds_left <= 5;

  const code = account.current_code;

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopied?.(account.issuer || "Account");
    } catch {
      /* clipboard unavailable */
    }
  };

  const formatted = useMemo(
    () => (code.includes(" ") ? code : `${code.slice(0, 3)} ${code.slice(3)}`),
    [code]
  );

  return (
    <div className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3.5 pl-4 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/60 hover:shadow-[0_8px_30px_-16px_rgba(0,0,0,0.9)]">
      <span
        className={`absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-zinc-200/70 transition-opacity ${
          expiring ? "opacity-30" : "opacity-0 group-hover:opacity-100"
        }`}
        aria-hidden="true"
      />

      <div
        className="min-w-0 flex-1 cursor-pointer select-none"
        onClick={copyCode}
        title="Click to copy"
      >
        <div className="flex items-center gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {account.issuer || "Unknown"}
          </span>
          {copied && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-400 animate-fade-in">
              <CheckIcon className="h-2.5 w-2.5" />
              COPIED
            </span>
          )}
        </div>

        <div className="mt-1 font-mono text-[26px] font-semibold leading-none tracking-[0.12em] text-zinc-100">
          {formatted}
        </div>

        <p className="mt-1.5 max-w-[190px] truncate text-[11px] text-zinc-500">
          {account.account}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="transparent"
              strokeWidth="2.5"
              className="text-zinc-800"
              stroke="currentColor"
            />
            <circle
              cx="18"
              cy="18"
              r={RADIUS}
              fill="transparent"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={strokeOffset}
              className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${
                expiring ? "text-red-500" : "text-zinc-300"
              }`}
              stroke="currentColor"
            />
          </svg>
          <span
            className={`absolute font-mono text-[10px] font-medium ${
              expiring ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {account.seconds_left}
          </span>
        </div>

        <Dropdown
          items={[
            {
              label: "Display QR Code",
              icon: <QrIcon className="h-3.5 w-3.5" />,
              onClick: () => onShowQR(account.id),
            },
            {
              label: "Copy Code",
              icon: <CopyIcon className="h-3.5 w-3.5" />,
              onClick: copyCode,
            },
            {
              label: "Delete Account",
              icon: <TrashIcon className="h-3.5 w-3.5" />,
              destructive: true,
              onClick: () => onDelete(account.id),
            },
          ]}
        />
      </div>
    </div>
  );
};
