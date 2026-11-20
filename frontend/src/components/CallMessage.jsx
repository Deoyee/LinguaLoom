import React from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  VideoOff,
  Clock,
} from "lucide-react";

export const CallMessage = ({ message, isMyMessage, onCallBack }) => {
  const text = message?.text || "";
  const lowerText = text.toLowerCase();

  const isAudio =
    message?.call_type === "audio" ||
    lowerText.includes("voice") ||
    text.includes("type=audio") ||
    text.startsWith("📞");

  const isEnded =
    message?.call_status === "ended" ||
    lowerText.includes("ended") ||
    lowerText.includes("call ended");

  const isDeclined =
    message?.call_status === "declined" || lowerText.includes("declined");
  const isCancelled =
    message?.call_status === "cancelled" || lowerText.includes("cancelled");
  const isMissed =
    !isEnded && !isDeclined && !isCancelled &&
    (message?.call_status === "missed" ||
      lowerText.includes("missed") ||
      lowerText.includes("no answer"));

  // Extract duration from text e.g. "📞 Voice call ended • 01:23"
  const durationMatch = text.match(/(\d{1,2}:\d{2})/);
  const durationText = message?.call_duration
    ? typeof message.call_duration === "number"
      ? `${Math.floor(message.call_duration / 60)
          .toString()
          .padStart(2, "0")}:${(message.call_duration % 60)
          .toString()
          .padStart(2, "0")}`
      : String(message.call_duration)
    : durationMatch
    ? durationMatch[0]
    : null;

  // Format timestamp nicely
  const timeStr = message?.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  let title = "";
  if (isDeclined) {
    title = isAudio ? "Voice Call Declined" : "Video Call Declined";
  } else if (isCancelled) {
    title = isAudio ? "Voice Call Cancelled" : "Video Call Cancelled";
  } else if (isMissed) {
    title = isAudio ? "Missed Voice Call" : "Missed Video Call";
  } else if (isEnded) {
    title = isAudio ? "Voice Call Ended" : "Video Call Ended";
  } else if (isMyMessage) {
    title = isAudio ? "Outgoing Voice Call" : "Outgoing Video Call";
  } else {
    title = isAudio ? "Incoming Voice Call" : "Incoming Video Call";
  }

  const subtitle = isDeclined
    ? "Declined"
    : isCancelled
    ? "Cancelled"
    : isMissed
    ? "No answer"
    : isEnded
    ? durationText
      ? `Duration: ${durationText}`
      : "Call ended"
    : isMyMessage
    ? "Calling..."
    : "Incoming call...";

  return (
    <div
      className={`flex items-center gap-2.5 my-1 px-3 py-2 rounded-xl max-w-[280px] transition-all shadow-sm select-none ${
        isMissed
          ? "mr-auto bg-base-100 border border-rose-500/35 text-rose-500"
          : isEnded
          ? isMyMessage
            ? "ml-auto bg-base-100 border border-primary/30 text-base-content"
            : "mr-auto bg-base-100 border border-base-content/12 text-base-content"
          : isMyMessage
          ? "ml-auto bg-primary/15 text-primary border border-primary/35"
          : "mr-auto bg-base-100 border border-base-content/12 text-base-content"
      }`}
    >
      {/* Call Icon Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
          isMissed
            ? "bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/30"
            : isEnded
            ? "bg-primary/15 text-primary ring-1 ring-primary/30"
            : isMyMessage
            ? "bg-primary/25 text-primary ring-1 ring-primary/30"
            : "bg-primary/20 text-primary ring-1 ring-primary/30"
        }`}
      >
        {isAudio ? (
          isMissed ? (
            <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
          ) : isMyMessage ? (
            <PhoneOutgoing className="w-3.5 h-3.5 text-primary" />
          ) : (
            <PhoneIncoming className="w-3.5 h-3.5 text-primary" />
          )
        ) : isMissed ? (
          <VideoOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        ) : (
          <Video className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      {/* Title & Status */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={`text-sm font-bold leading-snug truncate ${
            isMissed
              ? "text-rose-500 font-extrabold"
              : isEnded
              ? "text-base-content"
              : isMyMessage
              ? "text-base-content font-extrabold"
              : "text-base-content font-bold"
          }`}
        >
          {title}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-base-content/80 mt-0.5 font-medium">
          <span>{timeStr}</span>
          <span>&bull;</span>
          <span
            className={
              isMissed
                ? "text-rose-500 font-semibold"
                : isEnded
                ? "text-primary font-semibold"
                : "text-base-content/85"
            }
          >
            {subtitle}
          </span>
        </div>
      </div>

      {/* Call-back action button */}
      {onCallBack && (
        <button
          type="button"
          onClick={() => onCallBack(isAudio)}
          className={`btn btn-circle btn-sm border-0 transition-transform active:scale-95 shrink-0 ${
            isMissed
              ? "bg-rose-500/20 hover:bg-rose-600 text-rose-500 hover:text-white"
              : "bg-primary/20 hover:bg-primary text-primary hover:text-primary-content"
          }`}
          title={isAudio ? "Voice call back" : "Video call back"}
        >
          {isAudio ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default CallMessage;
