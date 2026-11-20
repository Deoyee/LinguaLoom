import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, Mic } from "lucide-react";

const BARS_COUNT = 28;

// Deterministic waveform bar heights based on string hash or random seed
const generateWaveformHeights = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const heights = [];
  for (let i = 0; i < BARS_COUNT; i++) {
    const val = Math.abs(Math.sin((i + 1) * (hash + 13)) * 80) + 20;
    heights.push(Math.round(val));
  }
  return heights;
};

export const AudioWaveformPlayer = ({
  src,
  duration: initialDuration,
  isMyMessage = false,
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const barHeights = useRef(generateWaveformHeights(src || "audio-seed")).current;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Audio playback error:", err));
    }
  }, [isPlaying]);

  const handleScrub = (index) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const progressRatio = index / BARS_COUNT;
    const newTime = progressRatio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl w-full max-w-[340px] select-none transition-all ${
        isMyMessage
          ? "bg-emerald-600/90 text-white shadow-md shadow-emerald-900/20"
          : "bg-base-200/90 border border-base-content/10 text-base-content shadow-sm"
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button with Pulse */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md ${
          isMyMessage
            ? "bg-primary-content text-primary hover:bg-primary-content/90"
            : "bg-primary text-primary-content hover:bg-primary/90 shadow-primary/25"
        }`}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 ml-0.5 fill-current" />
        )}
      </button>

      {/* Waveform Visualization Bars */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div
          className="flex items-center gap-[2.5px] h-7 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            if (audioRef.current && duration) {
              const newTime = ratio * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }
          }}
        >
          {barHeights.map((h, i) => {
            const barProgress = (i / BARS_COUNT) * 100;
            const isFilled = barProgress <= progressPercent;

            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
                  isFilled
                    ? isMyMessage
                      ? "bg-primary-content"
                      : "bg-primary"
                    : isMyMessage
                    ? "bg-primary-content/40"
                    : "bg-base-content/20"
                }`}
              />
            );
          })}
        </div>

        {/* Time and Audio Specs */}
        <div className="flex items-center justify-between text-[10px] mt-1 font-mono opacity-80">
          <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>
          <div className="flex items-center gap-1.5 font-sans">
            <span className="flex items-center gap-0.5 text-[9px] opacity-75">
              <Mic className="size-2.5" /> 48kHz
            </span>
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-tight hover:opacity-100 transition-opacity ${
                isMyMessage
                  ? "bg-primary-content/20 text-primary-content"
                  : "bg-base-300 text-base-content"
              }`}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioWaveformPlayer;

