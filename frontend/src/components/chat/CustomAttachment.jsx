import React, { useState } from "react";
import AudioWaveformPlayer from "./AudioWaveformPlayer.jsx";
import VideoAttachmentCard from "./VideoAttachmentCard.jsx";
import FileAttachmentPill from "./FileAttachmentPill.jsx";
import { Maximize2, X, Download } from "lucide-react";

export const CustomAttachment = ({ attachments = [], isMyMessage = false }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!attachments || !attachments.length) return null;

  return (
    <>
      <div className="space-y-2 my-1.5 max-w-full">
        {attachments.map((att, idx) => {
          const type = att.type || "";
          const mime = (att.mime_type || "").toLowerCase();
          const assetUrl = (att.asset_url || att.url || "").toLowerCase();

          // 1. Audio / Voice recording
          const isAudio =
            type === "audio" ||
            mime.startsWith("audio/") ||
            assetUrl.endsWith(".mp3") ||
            assetUrl.endsWith(".webm") ||
            assetUrl.endsWith(".ogg") ||
            assetUrl.endsWith(".wav") ||
            assetUrl.endsWith(".m4a");

          if (isAudio) {
            return (
              <AudioWaveformPlayer
                key={idx}
                src={att.asset_url || att.url}
                duration={att.duration}
                isMyMessage={isMyMessage}
              />
            );
          }

          // 2. Video
          const isVideo =
            type === "video" ||
            mime.startsWith("video/") ||
            assetUrl.endsWith(".mp4") ||
            assetUrl.endsWith(".mov") ||
            assetUrl.endsWith(".webm");

          if (isVideo) {
            return (
              <VideoAttachmentCard
                key={idx}
                attachment={att}
                isMyMessage={isMyMessage}
              />
            );
          }

          // 3. Image (excluding sticker which is handled by StickerMessage)
          const isImage =
            type === "image" ||
            mime.startsWith("image/") ||
            Boolean(att.image_url);

          if (isImage && att.custom_type !== "sticker") {
            const imgUrl = att.image_url || att.asset_url || att.url;
            return (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden max-w-[340px] sm:max-w-[400px] shadow-sm border border-base-content/10 cursor-pointer group"
                onClick={() => setSelectedImage(imgUrl)}
              >
                <img
                  src={imgUrl}
                  alt={att.title || att.fallback || "Image attachment"}
                  className="w-full max-h-[300px] object-cover group-hover:scale-102 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
                    <Maximize2 className="size-4" />
                  </span>
                </div>
              </div>
            );
          }

          // 4. Document / Generic File
          return (
            <FileAttachmentPill
              key={idx}
              attachment={att}
              isMyMessage={isMyMessage}
            />
          );
        })}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a
                href={selectedImage}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-circle btn-sm bg-black/60 text-white hover:bg-black/80 border-none"
              >
                <Download className="size-4" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="btn btn-circle btn-sm bg-black/60 text-white hover:bg-black/80 border-none"
              >
                <X className="size-4" />
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomAttachment;

