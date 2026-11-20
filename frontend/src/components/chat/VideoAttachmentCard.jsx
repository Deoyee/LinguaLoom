import React, { useState } from "react";
import { Play, Maximize2, Download, X } from "lucide-react";

export const VideoAttachmentCard = ({ attachment, isMyMessage = false }) => {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoUrl = attachment.asset_url || attachment.video_url || attachment.url;
  const thumbUrl = attachment.thumb_url || attachment.image_url;
  const title = attachment.title || attachment.fallback || "Video attachment";
  const fileSize = attachment.file_size
    ? `${(attachment.file_size / (1024 * 1024)).toFixed(1)} MB`
    : null;

  return (
    <>
      <div
        className={`rounded-2xl overflow-hidden max-w-[360px] sm:max-w-[400px] shadow-md transition-all ${
          isMyMessage
            ? "bg-primary text-primary-content"
            : "bg-base-200/90 border border-base-content/10 text-base-content"
        }`}
      >
        <div className="relative aspect-video bg-black/60 overflow-hidden group">
          {isPlayingInline ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-base-300/60">
                  <Play className="size-10 text-white/50" />
                </div>
              )}

              {/* Play Overlay */}
              <div
                className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center cursor-pointer group-hover:bg-black/25 transition-all"
                onClick={() => setIsPlayingInline(true)}
              >
                <div className="w-13 h-13 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform">
                  <Play className="size-6 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Fullscreen Modal Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-transform"
                title="Open in fullscreen"
              >
                <Maximize2 className="size-3.5" />
              </button>

              {/* Bottom Metadata Badges */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-white/90 backdrop-blur-md truncate max-w-[70%]">
                  {title} {fileSize ? `• ${fileSize}` : ""}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-emerald-400 backdrop-blur-md">
                  HD Video
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-black/70 border-b border-white/10">
              <span className="text-xs font-medium text-white truncate">{title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={videoUrl}
                  download={title}
                  className="btn btn-circle btn-xs btn-ghost text-white"
                  title="Download"
                >
                  <Download className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-circle btn-xs btn-ghost text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video src={videoUrl} controls autoPlay className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoAttachmentCard;

