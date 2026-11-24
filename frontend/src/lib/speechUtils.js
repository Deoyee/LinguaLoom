// Language name to BCP-47 speech language code mapping
export const LANGUAGE_SPEECH_CODES = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Mandarin: "zh-CN",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Hindi: "hi-IN",
  Russian: "ru-RU",
  Portuguese: "pt-PT",
  Arabic: "ar-SA",
  Italian: "it-IT",
  Turkish: "tr-TR",
  Dutch: "nl-NL",
};

export const getSpeechCode = (language) => {
  return LANGUAGE_SPEECH_CODES[language] || "en-US";
};

export const isSpeechSynthesisSupported = () => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

export const isSpeechRecognitionSupported = () => {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

let currentUtterance = null;

export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const speakText = (text, language = "English", rate = 0.9) => {
  if (!isSpeechSynthesisSupported() || !text) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = getSpeechCode(language);
    utterance.lang = langCode;
    utterance.rate = rate; // slightly relaxed for language learners
    utterance.pitch = 1.0;

    // Attempt to pick a natural sounding voice for this language if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
};

export const createSpeechRecognizer = (language = "English", onResult, onError, onEnd) => {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = getSpeechCode(language);
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    if (event.results && event.results[0]) {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
    }
  };

  recognition.onerror = (event) => {
    onError?.(event.error);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  return recognition;
};
