"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

const ACCEPTED_TYPES = "image/jpeg,image/png,application/pdf";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type Props = {
  onUpload: (file: File) => Promise<void>;
  title?: string;
  description?: string;
};

export function RecetaUploader({
  onUpload,
  title = "Subí tu receta",
  description = "Una foto o PDF de tu receta para que podamos preparar tu pedido.",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectFile = (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus("error");
      setErrorMessage("El archivo no puede superar los 10MB.");
      return;
    }

    setStatus("idle");
    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      await onUpload(selectedFile);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "No pudimos subir la receta.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#8f63d9]/20 bg-[#faf7ff] px-4 py-3 text-sm text-[#2f3042]">
        Receta enviada, la vamos a revisar.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#ddd6eb] bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-[#2f3042]">{title}</p>
        <p className="text-xs text-[#5f6074]">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleSelectFile(e.target.files?.[0])}
      />

      {selectedFile ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#e2daf3] bg-[#faf7ff] p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={selectedFile.name}
              className="h-14 w-14 rounded-lg object-cover"
            />
          ) : (
            <FileText className="h-8 w-8 shrink-0 text-[#8f63d9]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#2f3042]">
              {selectedFile.name}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-semibold text-[#8f63d9] hover:underline"
            >
              Elegir otro archivo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8f63d9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f56c7]"
        >
          <Upload size={16} />
          Elegir archivo
        </button>
      )}

      {selectedFile && (
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8f63d9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f56c7] disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Subiendo..." : "Subir receta"}
        </button>
      )}

      {status === "error" && errorMessage && (
        <p className="text-xs font-medium text-[#b03c55]">{errorMessage}</p>
      )}
    </div>
  );
}
