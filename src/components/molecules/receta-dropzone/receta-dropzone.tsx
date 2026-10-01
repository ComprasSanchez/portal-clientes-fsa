"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";

const ACCEPTED_TYPES = "image/jpeg,image/png,application/pdf";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type Props = {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
};

export function RecetaDropzone({ file, onSelect, onRemove, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl =
    file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  const handleFile = (candidate: File | undefined) => {
    if (!candidate) return;

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setLocalError("El archivo no puede superar los 10MB.");
      return;
    }

    setLocalError(null);
    onSelect(candidate);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#e2daf3] bg-[#faf7ff] p-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={file.name}
            className="h-14 w-14 rounded-xl object-cover"
          />
        ) : (
          <FileText className="h-9 w-9 shrink-0 text-[#8f63d9]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#2f3042]">
            {file.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-[#b03c55] hover:underline"
          >
            Quitar archivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? "border-[#8f63d9] bg-[#faf7ff]"
            : "border-[#ddd6eb] bg-white"
        }`}
      >
        <FileText className="h-8 w-8 text-[#8f63d9]" />
        <p className="text-sm font-semibold text-[#2f3042]">
          Subí una foto o PDF de tu receta
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center rounded-2xl bg-[#8f63d9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
        >
          Elegir archivo
        </button>
        <p className="text-xs text-[#8f7fa0]">
          o arrastralo acá · JPG, PNG o PDF · hasta 10MB
        </p>
      </div>
      {(localError || error) && (
        <p className="mt-2 text-xs font-medium text-[#b03c55]">
          {localError || error}
        </p>
      )}
    </div>
  );
}
