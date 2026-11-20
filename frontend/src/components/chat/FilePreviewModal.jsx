import { Download, FileText, X } from "lucide-react";

const getPreviewType = (file) => {
  const fileName = file?.name || file?.title || "";
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeType = (file?.mimeType || file?.mime_type || file?.type || "").toLowerCase();

  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image";
  if (mimeType.startsWith("video/") || ["mp4", "webm", "mov"].includes(extension)) return "video";
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(extension)) return "audio";
  if (mimeType.includes("pdf") || extension === "pdf") return "pdf";
  if (mimeType.startsWith("text/") || ["txt", "md", "csv", "json", "xml"].includes(extension)) return "text";
  return "unsupported";
};

const FilePreviewModal = ({ file, onClose = () => {} }) => {
  if (!file) return null;

  const url = file.url || file.asset_url;
  const name = file.name || file.title || "Shared file";
  const previewType = getPreviewType(file);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${name}`}
        className="flex h-[min(90dvh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-base-100 shadow-2xl"
      >
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-base-content/10 bg-base-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-primary" />
            <h2 className="truncate text-sm font-semibold">{name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {url && (
              <a
                href={url}
                download={name}
                className="btn btn-ghost btn-sm gap-2"
                title={`Download ${name}`}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-950">
          {!url ? (
            <p className="px-6 text-center text-sm text-white/70">This attachment has no preview URL.</p>
          ) : previewType === "image" ? (
            <img src={url} alt={name} className="max-h-full max-w-full object-contain" />
          ) : previewType === "video" ? (
            <video src={url} controls autoPlay className="max-h-full max-w-full" />
          ) : previewType === "audio" ? (
            <audio src={url} controls autoPlay className="w-full max-w-xl px-5" />
          ) : previewType === "pdf" || previewType === "text" ? (
            <iframe src={url} title={`Preview ${name}`} className="h-full w-full border-0 bg-white" />
          ) : (
            <div className="max-w-md px-6 text-center text-white/75">
              <FileText className="mx-auto size-10 text-white/50" />
              <p className="mt-4 font-semibold">Preview isn’t available for this file type.</p>
              <p className="mt-1 text-sm">Download it here to open it in a compatible app.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FilePreviewModal;