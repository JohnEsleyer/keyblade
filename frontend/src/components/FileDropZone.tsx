import React, { useCallback, useRef, useState } from "react";
import { ImageIcon } from "./Icons";

interface FileDropZoneProps {
  onFile: (file: File) => void;
  hint?: string;
  className?: string;
}

const isImage = (file: File) => file.type.startsWith("image/");

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFile,
  hint = "Drag & drop a QR code image",
  className = "",
}) => {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (isImage(file)) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setActive(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setActive(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
        active
          ? "border-zinc-500 bg-zinc-900/70"
          : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
      } ${className}`}
    >
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 ${
          active
            ? "border-zinc-600 bg-zinc-800 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/80 text-zinc-500 group-hover:text-zinc-300"
        }`}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-zinc-300">
        {active ? "Release to import" : "Upload QR code"}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
        PNG · JPG · WEBP
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
};
