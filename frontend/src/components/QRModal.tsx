import React from "react";
import { Dialog } from "./Dialog";
import { QrIcon } from "./Icons";

interface QRModalProps {
  isOpen: boolean;
  qrData: string;
  issuer?: string;
  account?: string;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  qrData,
  issuer,
  account,
  onClose,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      title="Account QR Code"
      description={
        issuer
          ? `${issuer}${account ? ` \u00b7 ${account}` : ""}`
          : "Scan with another authenticator to replicate this token."
      }
      onClose={onClose}
      size="sm"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <div
            className="absolute -inset-4 rounded-3xl bg-zinc-100/5 blur-2xl animate-pulse-glow"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl bg-white p-3.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]">
            {qrData ? (
              <img
                src={qrData}
                alt="TOTP QR Code"
                draggable={false}
                className="h-48 w-48 select-none"
              />
            ) : (
              <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 text-zinc-400">
                <QrIcon className="h-6 w-6 animate-pulse" />
                <span className="text-[11px] font-medium">Generating…</span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-500">
          Keep this code private. Anyone who scans it can generate your
          one-time passwords.
        </p>
      </div>
    </Dialog>
  );
};
