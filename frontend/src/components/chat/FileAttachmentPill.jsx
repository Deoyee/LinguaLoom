import React from "react";
import { Download, FileText, FileArchive, FileCode, File } from "lucide-react";

const getFileMeta = (filename = "", mimeType = "") => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf" || mimeType.includes("pdf")) {
    return { label: "PDF", bg: "bg-red-500/15", text: "text-red-500", Icon: FileText };
  }
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext) || mimeType.includes("word") || mimeType.includes("text")) {
    return { label: ext.toUpperCase() || "DOC", bg: "bg-blue-500/15", text: "text-blue-500", Icon: FileText };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || mimeType.includes("zip") || mimeType.includes("archive")) {
    return { label: "ZIP", bg: "bg-amber-500/15", text: "text-amber-500", Icon: FileArchive };
  }
  if (["js", "jsx", "ts", "tsx", "html", "css", "py", "json"].includes(ext)) {
    return { label: ext.toUpperCase(), bg: "bg-purple-500/15", text: "text-purple-500", Icon: FileCode };
  }
  return { label: ext.toUpperCase() || "FILE", bg: "bg-emerald-500/15", text: "text-emerald-500", Icon: File };
};

export const FileAttachmentPill = ({ attachment, isMyMessage = false }) => {
  const fileUrl = attachment.asset_url || attachment.url;
  const fileName = attachment.title || attachment.fallback || "Attached File";
  const fileSize = attachment.file_size
    ? `${(attachment.file_size / (1024 * 1024)).toFixed(1)} MB`
    : null;
  const mimeType = attachment.mime_type || "";

  const { label, bg, text, Icon } = getFileMeta(fileName, mimeType);

  return (
    <div
      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl w-full max-w-[280px] border transition-all ${
        isMyMessage
          ? "bg-base-100 border-primary/30 text-base-content shadow-sm hover:border-primary/50"
          : "bg-base-100 border-base-content/12 text-base-content shadow-sm hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg ${
            isMyMessage ? "bg-primary/15 text-primary" : `${bg} ${text}`
          } flex items-center justify-center font-bold text-[9px] tracking-wider flex-shrink-0`}
        >
          {label}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate leading-snug">{fileName}</p>
          <p className="text-[10px] opacity-60 mt-0.5">
            {fileSize ? fileSize : "Document"} • Ready to download
          </p>
        </div>
      </div>

      {fileUrl && (
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
            isMyMessage
              ? "hover:bg-white/20 text-white"
              : "hover:bg-base-300 text-base-content/80 hover:text-base-content"
          }`}
          title={`Download ${fileName}`}
        >
          <Download className="size-4" />
        </a>
      )}
    </div>
  );
};

export default FileAttachmentPill;

