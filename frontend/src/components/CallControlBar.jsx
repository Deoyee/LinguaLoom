import { useEffect, useState } from "react";
import {
  CancelCallButton,
  RecordCallButton,
  ReactionsButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

const CallControlBar = ({ onLeave }) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute, isSpeakingWhileMuted } = useMicrophoneState();
  const [showMutedHint, setShowMutedHint] = useState(false);

  useEffect(() => {
    if (!isMute) {
      setShowMutedHint(false);
    } else if (isSpeakingWhileMuted) {
      setShowMutedHint(true);
    }
  }, [isMute, isSpeakingWhileMuted]);

  return (
    <div className="relative w-full">
      {showMutedHint && (
        <p
          role="status"
          className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-full border border-amber-400/25 bg-neutral-900/95 px-3 py-1.5 text-xs font-medium text-amber-200 shadow-lg"
        >
          Microphone is muted. Unmute to speak.
        </p>
      )}
      <div className="str-video__call-controls">
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
        <ReactionsButton />
        <ScreenShareButton />
        <RecordCallButton />
        <CancelCallButton onClick={onLeave} />
      </div>
    </div>
  );
};

export default CallControlBar;