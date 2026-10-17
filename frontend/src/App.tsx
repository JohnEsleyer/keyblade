import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "./components/Dialog";
import { FileDropZone } from "./components/FileDropZone";
import { QRModal } from "./components/QRModal";
import { TOTPCard, type AccountView } from "./components/TOTPCard";
import { ToastStack, type Toast, type ToastKind } from "./components/Toast";
import { KeyIcon, PlusIcon, ShieldIcon, UploadIcon } from "./components/Icons";
import {
  AddAccount,
  DeleteAccount,
  GetAccountQRCodeBase64,
  GetAccounts,
  ParseQRFromBase64,
} from "../wailsjs/go/main/App";

const uid = () => Math.random().toString(36).slice(2);

export default function App() {
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeQR, setActiveQR] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTarget, setQrTarget] = useState<{ issuer: string; account: string }>({
    issuer: "",
    account: "",
  });

  const [showManualModal, setShowManualModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AccountView | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const [issuer, setIssuer] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secret, setSecret] = useState("");
  const [formError, setFormError] = useState("");

  const pushToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = uid();
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = (await GetAccounts()) as unknown as AccountView[];
      setAccounts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    const interval = window.setInterval(fetchAccounts, 1000);
    return () => window.clearInterval(interval);
  }, [fetchAccounts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        !showManualModal
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showManualModal]);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const acc = (await ParseQRFromBase64(
            reader.result as string
          )) as unknown as AccountView;
          await fetchAccounts();
          pushToast(
            `Imported ${acc?.issuer || "account"}`,
            "success"
          );
        } catch (err) {
          pushToast(cleanError(err), "error");
        }
      };
      reader.onerror = () => pushToast("Could not read that file", "error");
      reader.readAsDataURL(file);
    },
    [fetchAccounts, pushToast]
  );

  const handleWindowDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types || []).includes("Files")) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const handleWindowDragLeave = (e: React.DragEvent) => {
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  };
  const handleWindowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleShowQR = async (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    setQrTarget({ issuer: acc?.issuer ?? "", account: acc?.account ?? "" });
    setActiveQR("");
    setShowQRModal(true);
    try {
      const qr = (await GetAccountQRCodeBase64(id)) as unknown as string;
      setActiveQR(qr);
    } catch (err) {
      pushToast(cleanError(err), "error");
      setShowQRModal(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await DeleteAccount(pendingDelete.id);
      pushToast(`Removed ${pendingDelete.issuer || "account"}`, "info");
      setPendingDelete(null);
      await fetchAccounts();
    } catch (err) {
      pushToast(cleanError(err), "error");
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await AddAccount(issuer, accountName, secret);
      setShowManualModal(false);
      setIssuer("");
      setAccountName("");
      setSecret("");
      await fetchAccounts();
      pushToast("Account added", "success");
    } catch (err) {
      setFormError(cleanError(err));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.issuer.toLowerCase().includes(q) ||
        a.account.toLowerCase().includes(q)
    );
  }, [accounts, query]);

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100"
      onDragEnter={handleWindowDragEnter}
      onDragLeave={handleWindowDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleWindowDrop}
    >
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(244,244,245,0.06),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-900/80 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="glow-ring flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <KeyIcon className="h-4 w-4 text-zinc-200" />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold leading-none tracking-wide text-zinc-100">
              Keyblade
            </h1>
            <p className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Authenticator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100">
            <UploadIcon className="h-3.5 w-3.5" />
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => {
              setFormError("");
              setShowManualModal(true);
            }}
            className="flex h-8 items-center gap-1 rounded-lg bg-zinc-100 px-2.5 text-[11px] font-semibold text-zinc-950 transition-colors hover:bg-white"
          >
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            Add
          </button>
        </div>
      </header>

      {/* Search */}
      {accounts.length > 0 && (
        <div className="relative z-10 px-5 pt-3.5">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts"
            className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-600 focus:bg-zinc-900/70 focus:outline-none"
          />
        </div>
      )}

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <FileDropZone onFile={handleFile} className="w-full" />
            <button
              onClick={() => {
                setFormError("");
                setShowManualModal(true);
              }}
              className="mt-3 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-300"
            >
              or enter a key manually
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-xs text-zinc-500">
              No accounts match “{query}”
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((acc, i) => (
              <div
                key={acc.id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              >
                <TOTPCard
                  account={acc}
                  onShowQR={handleShowQR}
                  onDelete={(id) =>
                    setPendingDelete(accounts.find((a) => a.id === id) ?? null)
                  }
                  onCopied={(label) => pushToast(`Copied ${label}`, "success")}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer status */}
      <footer className="relative z-10 flex items-center justify-between border-t border-zinc-900/80 px-5 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
          <ShieldIcon className="h-3 w-3" />
          <span className="font-mono uppercase tracking-widest">
            Local · Offline
          </span>
        </div>
        <span className="text-[10px] text-zinc-600">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
      </footer>

      {/* Global drag overlay */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-600 px-10 py-8">
            <UploadIcon className="h-7 w-7 text-zinc-200" />
            <p className="text-sm font-medium text-zinc-200">
              Drop QR code to import
            </p>
          </div>
        </div>
      )}

      {/* Manual entry */}
      <Dialog
        isOpen={showManualModal}
        title="New Account"
        description="Enter the details from your provider's setup page."
        onClose={() => setShowManualModal(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="manual-form"
              className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white"
            >
              Save Key
            </button>
          </>
        }
      >
        <form id="manual-form" onSubmit={handleManualAdd} className="space-y-3.5">
          <Field
            label="Issuer / Service"
            placeholder="GitHub"
            value={issuer}
            onChange={setIssuer}
            autoFocus
          />
          <Field
            label="Account"
            placeholder="you@domain.com"
            value={accountName}
            onChange={setAccountName}
          />
          <Field
            label="Secret Key (Base32)"
            placeholder="JBSWY3DPEHPK3PXP"
            value={secret}
            onChange={(v) => setSecret(v.toUpperCase())}
            mono
          />
          {formError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        isOpen={!!pendingDelete}
        title="Delete Account"
        description={
          pendingDelete
            ? `${pendingDelete.issuer} · ${pendingDelete.account}`
            : undefined
        }
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <button
              onClick={() => setPendingDelete(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-500/90 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-[11px] leading-relaxed text-zinc-400">
          This permanently removes the account from your local vault. Make sure
          you have another way to generate its codes.
        </p>
      </Dialog>

      {/* QR viewer */}
      <QRModal
        isOpen={showQRModal}
        qrData={activeQR}
        issuer={qrTarget.issuer}
        account={qrTarget.account}
        onClose={() => setShowQRModal(false)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

const Field: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  autoFocus?: boolean;
}> = ({ label, placeholder, value, onChange, mono, autoFocus }) => (
  <div>
    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
      {label}
    </label>
    <input
      required
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-600 focus:bg-zinc-900 focus:outline-none ${
        mono ? "font-mono tracking-wide" : ""
      }`}
    />
  </div>
);

function cleanError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : String(err ?? "Something went wrong");
  return raw.replace(/^Error:\s*/i, "").trim() || "Something went wrong";
}
