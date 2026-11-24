import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  Mic,
  MicOff,
  Flame,
  Zap,
  Play,
  Layers,
  Gamepad2,
  MessageCircle,
  HelpCircle,
  Clock,
  Shuffle,
  ThumbsUp,
  X,
  Plus,
  Loader2,
  Bookmark,
  Compass,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { LANGUAGES } from "../constants";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import {
  PRACTICE_LEVELS,
  PRACTICE_QUESTIONS,
  PRACTICE_VOCAB_PAIRS,
  PRACTICE_SCENARIOS,
  ACHIEVEMENTS_LIST,
} from "../data/practiceCourse.js";
import {
  speakText,
  stopSpeech,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from "../lib/speechUtils.js";
import { generatePracticeLessonApi } from "../lib/api.js";
import toast from "react-hot-toast";

const normalizeAnswer = (value) =>
  String(value || "")
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const initialUserData = () => ({
  totalXp: 0,
  streak: 1,
  lastActiveDate: new Date().toDateString(),
  unlockedLevels: { Spanish: 1 },
  passedLevels: { Spanish: [] },
  masteredCards: [],
  customVocab: [],
  matchHighScore: 0,
  unlockedBadges: ["first-lesson"],
  scenariosCompleted: [],
});

const AI_SUGGESTION_CHIPS = [
  { label: "🌮 Street Food & Tacos", topic: "Ordering street food and tacos" },
  { label: "🛫 Airport & Boarding", topic: "Navigating airport, boarding, customs" },
  { label: "💼 Job Interview", topic: "Job interview self-introduction and skills" },
  { label: "💻 Tech & Coding", topic: "Software development and team meetings" },
  { label: "❤️ Dating & Compliments", topic: "Asking someone out on a date and compliments" },
  { label: "🩺 Doctor & Pharmacy", topic: "Explaining symptoms to doctor or pharmacist" },
  { label: "⚽ Football & Sports", topic: "Watching a match and talking football" },
  { label: "🏨 Luxury Hotel Stay", topic: "Checking in and asking for room upgrades" },
];

export const PracticePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const storageKey = `hime-practice-v2:${authUser?._id || authUser?.id || "guest"}`;

  const [selectedLanguage, setSelectedLanguage] = useState(
    authUser?.learningLanguage || "Spanish"
  );
  const nativeLanguage = authUser?.nativeLanguage || "English";

  // App mode tabs: 'lessons' | 'flashcards' | 'match' | 'roleplay'
  const [activeTab, setActiveTab] = useState("lessons");

  // User state
  const [userData, setUserData] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved.totalXp === "number") return saved;
    } catch {
      // fallback
    }
    return initialUserData();
  });

  // Modal states
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);

  // AI Generation State
  const [aiLessonPack, setAiLessonPack] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [aiLevelInput, setAiLevelInput] = useState("Intermediate");

  // Custom Word State
  const [customWordNative, setCustomWordNative] = useState("");
  const [customWordTarget, setCustomWordTarget] = useState("");
  const [customWordCategory, setCustomWordCategory] = useState("My Notebook");

  // Sync to storage
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(userData));
    } catch {
      // ignore
    }
  }, [userData, storageKey]);

  // Streak logic on mount
  useEffect(() => {
    const today = new Date().toDateString();
    if (userData.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      setUserData((prev) => ({
        ...prev,
        lastActiveDate: today,
        streak: prev.lastActiveDate === yesterday ? prev.streak + 1 : 1,
      }));
    }
  }, []);

  const addXp = useCallback((points, reason) => {
    setUserData((prev) => {
      const nextXp = prev.totalXp + points;
      const nextBadges = [...(prev.unlockedBadges || [])];
      if (nextXp >= 100 && !nextBadges.includes("streak-3")) {
        nextBadges.push("streak-3");
      }
      return {
        ...prev,
        totalXp: nextXp,
        unlockedBadges: nextBadges,
      };
    });
    toast.success(`+${points} XP ${reason ? `• ${reason}` : ""}`, {
      icon: "⚡",
      duration: 2500,
    });
  }, []);

  // Level computation based on total XP
  const userLevel = useMemo(() => {
    return Math.floor(userData.totalXp / 100) + 1;
  }, [userData.totalXp]);

  // AI Generator Handler
  const handleGenerateAiLesson = async (chosenTopic) => {
    const topicToUse = chosenTopic || aiTopicInput || "Street Food & Cafe";
    try {
      setIsGeneratingAi(true);
      const res = await generatePracticeLessonApi({
        topic: topicToUse,
        targetLanguage: selectedLanguage,
        nativeLanguage,
        level: aiLevelInput,
      });

      if (res?.data) {
        setAiLessonPack(res.data);
        toast.success(`✨ Fresh lesson generated for "${topicToUse}"!`, { duration: 3500 });
        setIsAiModalOpen(false);
        setAiTopicInput("");
      }
    } catch (err) {
      console.error("AI Lesson error:", err);
      toast.error("Could not generate lesson. Please try again.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Custom Word Adder Handler
  const handleAddCustomWord = (e) => {
    e.preventDefault();
    if (!customWordNative.trim() || !customWordTarget.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    const newEntry = {
      id: `custom-${Date.now()}`,
      category: customWordCategory.trim() || "My Notebook",
      translations: {
        [nativeLanguage]: customWordNative.trim(),
        English: customWordNative.trim(),
        [selectedLanguage]: customWordTarget.trim(),
      },
    };

    setUserData((prev) => ({
      ...prev,
      customVocab: [newEntry, ...(prev.customVocab || [])],
    }));

    toast.success(`Added "${customWordTarget}" to your personal practice deck! 🎉`);
    setCustomWordNative("");
    setCustomWordTarget("");
    setIsAddWordModalOpen(false);
  };

  // Combined vocabulary: Custom user words + AI generated words + Base curriculum
  const combinedVocab = useMemo(() => {
    const base = aiLessonPack?.vocabulary?.length
      ? aiLessonPack.vocabulary.map((v) => ({
          id: v.id,
          category: "AI Topic",
          translations: {
            [nativeLanguage]: v.native,
            English: v.native,
            [selectedLanguage]: v.target,
          },
        }))
      : PRACTICE_VOCAB_PAIRS;

    const userSaved = userData.customVocab || [];
    return [...userSaved, ...base];
  }, [aiLessonPack, nativeLanguage, selectedLanguage, userData.customVocab]);

  // =========================================================================
  // TAB 1: LESSONS & QUIZ STATE
  // =========================================================================
  const [activeLevelId, setActiveLevelId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [levelFinished, setLevelFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef(null);

  const activeLevel = useMemo(() => {
    if (activeLevelId === "ai-pack" && aiLessonPack) {
      return {
        id: "ai-pack",
        title: aiLessonPack.topic || "AI Generated Lesson",
        description: aiLessonPack.overview || "Custom AI-tailored practice",
        questionIds: aiLessonPack.questions.map((q) => q.id),
        icon: "✨",
      };
    }
    return PRACTICE_LEVELS.find((lvl) => lvl.id === activeLevelId);
  }, [activeLevelId, aiLessonPack]);

  const levelQuestions = useMemo(() => {
    if (activeLevelId === "ai-pack" && aiLessonPack) {
      return aiLessonPack.questions.map((q) => ({
        id: q.id,
        type: q.type || "choice",
        prompt: q.prompt,
        targetAnswer: q.targetAnswer,
        options: q.options,
        translations: {
          [selectedLanguage]: q.targetAnswer,
          [nativeLanguage]: q.prompt,
        },
      }));
    }
    return activeLevel
      ? activeLevel.questionIds
          .map((id) => PRACTICE_QUESTIONS.find((q) => q.id === id))
          .filter(Boolean)
      : [];
  }, [activeLevel, activeLevelId, aiLessonPack, nativeLanguage, selectedLanguage]);

  const currentQuestion = levelQuestions[questionIndex];

  const acceptedAnswers = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.targetAnswer) return [currentQuestion.targetAnswer];
    const val = currentQuestion.translations[selectedLanguage];
    return Array.isArray(val) ? val : [val].filter(Boolean);
  }, [currentQuestion, selectedLanguage]);

  const primaryTargetAnswer = acceptedAnswers[0] || "";

  const promptLanguage =
    nativeLanguage === selectedLanguage
      ? selectedLanguage === "English"
        ? "Spanish"
        : "English"
      : nativeLanguage;

  const currentPromptText =
    currentQuestion?.prompt || currentQuestion?.translations[promptLanguage] || "";

  const choices = useMemo(() => {
    if (!activeLevel || !currentQuestion) return [];

    // If options are explicitly provided by AI
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      return currentQuestion.options.map((opt, i) => ({
        id: `opt-${i}`,
        label: opt,
        isCorrect: normalizeAnswer(opt) === normalizeAnswer(primaryTargetAnswer),
      }));
    }

    const pool = levelQuestions.map((q) => {
      const val = q.translations[selectedLanguage];
      return {
        id: q.id,
        label: Array.isArray(val) ? val[0] : val,
        isCorrect: q.id === currentQuestion.id,
      };
    });
    const correctIdx = pool.findIndex((item) => item.id === currentQuestion.id);
    if (correctIdx !== -1) {
      const [correct] = pool.splice(correctIdx, 1);
      const insertAt = (questionIndex + 1) % (pool.length + 1);
      pool.splice(insertAt, 0, correct);
    }
    return pool;
  }, [activeLevel, currentQuestion, levelQuestions, questionIndex, selectedLanguage, primaryTargetAnswer]);

  const startLevel = (lvlId) => {
    setActiveLevelId(lvlId);
    setQuestionIndex(0);
    setRoundPoints(0);
    setAnswerText("");
    setFeedback(null);
    setLevelFinished(false);
  };

  const handleGrade = (ans) => {
    if (!currentQuestion || feedback) return;

    let isCorrect = false;
    let chosenLabel = ans;

    if (currentQuestion.type === "choice") {
      const matchedChoice = choices.find((c) => c.id === ans);
      isCorrect = matchedChoice?.isCorrect || normalizeAnswer(matchedChoice?.label) === normalizeAnswer(primaryTargetAnswer);
      chosenLabel = matchedChoice?.label || ans;
    } else {
      isCorrect = acceptedAnswers.some(
        (acc) => normalizeAnswer(ans) === normalizeAnswer(acc)
      );
    }

    setFeedback({
      correct: isCorrect,
      correctAnswer: primaryTargetAnswer,
      userAnswer: chosenLabel,
    });

    if (isCorrect) {
      setRoundPoints((pts) => pts + 25);
      speakText(primaryTargetAnswer, selectedLanguage);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 < levelQuestions.length) {
      setQuestionIndex((idx) => idx + 1);
      setAnswerText("");
      setFeedback(null);
    } else {
      setLevelFinished(true);
      const passed = roundPoints >= 50;
      if (passed) {
        addXp(50, `${activeLevel.title} Completed`);
        if (activeLevelId !== "ai-pack") {
          setUserData((prev) => {
            const langLevels = prev.unlockedLevels[selectedLanguage] || 1;
            const passedLvls = prev.passedLevels[selectedLanguage] || [];
            return {
              ...prev,
              unlockedLevels: {
                ...prev.unlockedLevels,
                [selectedLanguage]: Math.max(langLevels, activeLevelId + 1),
              },
              passedLevels: {
                ...prev.passedLevels,
                [selectedLanguage]: Array.from(new Set([...passedLvls, activeLevelId])),
              },
            };
          });
        }
      }
    }
  };

  // Mic speech recognition
  const toggleSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      selectedLanguage,
      (transcript) => {
        setAnswerText(transcript);
        setIsListening(false);
        handleGrade(transcript);
      },
      (err) => {
        setIsListening(false);
        if (err !== "no-speech") toast.error("Could not capture speech. Try again.");
      },
      () => setIsListening(false)
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      setIsListening(true);
      recognizer.start();
      toast("Listening... Speak the phrase now!", { icon: "🎙️" });
    }
  };

  // =========================================================================
  // TAB 2: FLASHCARDS STATE
  // =========================================================================
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const currentFlashcard = combinedVocab[flashcardIndex];
  const cardNativeWord = currentFlashcard?.translations[nativeLanguage] || currentFlashcard?.translations.English;
  const cardTargetWord = currentFlashcard?.translations[selectedLanguage];
  const isCardMastered = userData.masteredCards?.includes(currentFlashcard?.id);

  const handleCardMaster = () => {
    if (!currentFlashcard) return;
    setUserData((prev) => ({
      ...prev,
      masteredCards: Array.from(new Set([...(prev.masteredCards || []), currentFlashcard.id])),
    }));
    addXp(15, "Word Mastered");
    setIsCardFlipped(false);
    setFlashcardIndex((idx) => (idx + 1) % combinedVocab.length);
  };

  const handleNextCard = () => {
    setIsCardFlipped(false);
    setFlashcardIndex((idx) => (idx + 1) % combinedVocab.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setFlashcardIndex((idx) =>
      idx === 0 ? combinedVocab.length - 1 : idx - 1
    );
  };

  // =========================================================================
  // TAB 3: SPEED WORD MATCH MINI-GAME STATE
  // =========================================================================
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [gameTiles, setGameTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const timerRef = useRef(null);

  const generateMatchRound = useCallback(() => {
    const shuffledVocab = [...combinedVocab]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    const tiles = [];
    shuffledVocab.forEach((v) => {
      tiles.push({
        id: `${v.id}-native`,
        pairId: v.id,
        text: v.translations[nativeLanguage] || v.translations.English,
        isTarget: false,
      });
      tiles.push({
        id: `${v.id}-target`,
        pairId: v.id,
        text: v.translations[selectedLanguage],
        isTarget: true,
      });
    });

    setGameTiles(tiles.sort(() => 0.5 - Math.random()));
    setMatchedPairs(new Set());
    setSelectedTile(null);
  }, [combinedVocab, nativeLanguage, selectedLanguage]);

  const startMatchGame = () => {
    setGameActive(true);
    setTimeLeft(30);
    setScore(0);
    setCombo(1);
    generateMatchRound();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!gameActive && score > 0) {
      if (score > (userData.matchHighScore || 0)) {
        setUserData((prev) => ({
          ...prev,
          matchHighScore: score,
          unlockedBadges: Array.from(new Set([...(prev.unlockedBadges || []), "match-champion"])),
        }));
        toast.success(`🎉 New Personal Best: ${score} points!`);
      }
      addXp(Math.floor(score / 5), "Speed Match Finish");
    }
  }, [gameActive]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleTileClick = (tile) => {
    if (!gameActive || matchedPairs.has(tile.pairId)) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      if (tile.isTarget) speakText(tile.text, selectedLanguage);
      return;
    }

    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    if (selectedTile.pairId === tile.pairId && selectedTile.isTarget !== tile.isTarget) {
      const nextMatched = new Set(matchedPairs);
      nextMatched.add(tile.pairId);
      setMatchedPairs(nextMatched);
      setSelectedTile(null);

      const pts = 20 * combo;
      setScore((s) => s + pts);
      setCombo((c) => Math.min(c + 1, 4));

      const targetWord = tile.isTarget ? tile.text : selectedTile.text;
      speakText(targetWord, selectedLanguage);

      if (nextMatched.size === 4) {
        toast.success("Awesome! Next round!", { duration: 1500 });
        setTimeout(() => {
          generateMatchRound();
        }, 500);
      }
    } else {
      setCombo(1);
      setSelectedTile(null);
      toast.error("Not a match!", { duration: 1000 });
    }
  };

  // =========================================================================
  // TAB 4: REAL-WORLD SCENARIOS / ROLEPLAY STATE
  // =========================================================================
  const [activeScenarioId, setActiveScenarioId] = useState("cafe-order");
  const [scenarioStepIndex, setScenarioStepIndex] = useState(0);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);

  const activeScenariosList = useMemo(() => {
    const list = [...PRACTICE_SCENARIOS];
    if (aiLessonPack?.scenario) {
      list.unshift({
        id: "ai-scenario",
        title: aiLessonPack.scenario.title || aiLessonPack.topic,
        description: `AI dialogue simulation for ${aiLessonPack.topic}`,
        icon: "✨",
        character: {
          name: aiLessonPack.scenario.characterName || "Partner",
          role: aiLessonPack.scenario.characterRole || "Local Speaker",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        },
        steps: aiLessonPack.scenario.steps.map((st) => ({
          characterText: {
            [selectedLanguage]: st.characterText,
            [nativeLanguage]: st.characterTextNative,
          },
          options: st.options.map((op) => ({
            id: op.id,
            text: {
              [selectedLanguage]: op.target,
              [nativeLanguage]: op.native,
            },
            replyFeedback: op.feedback,
          })),
        })),
      });
    }
    return list;
  }, [aiLessonPack, nativeLanguage, selectedLanguage]);

  const currentScenario = useMemo(
    () => activeScenariosList.find((s) => s.id === activeScenarioId) || activeScenariosList[0],
    [activeScenarioId, activeScenariosList]
  );

  const currentScenarioStep = currentScenario?.steps[scenarioStepIndex];

  const handleScenarioOptionChoose = (option) => {
    speakText(option.text[selectedLanguage] || option.text.English, selectedLanguage);
    toast.success(option.replyFeedback || "Great response!", { icon: "💬" });

    if (scenarioStepIndex + 1 < currentScenario.steps.length) {
      setScenarioStepIndex((idx) => idx + 1);
    } else {
      setScenarioCompleted(true);
      addXp(40, `${currentScenario.title} Completed`);
      setUserData((prev) => ({
        ...prev,
        scenariosCompleted: Array.from(new Set([...(prev.scenariosCompleted || []), currentScenario.id])),
        unlockedBadges: Array.from(new Set([...(prev.unlockedBadges || []), "roleplay-ace"])),
      }));
    }
  };

  const restartScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
    setScenarioStepIndex(0);
    setScenarioCompleted(false);
  };

  return (
    <div className="w-full min-h-screen bg-base-100 flex flex-col p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ================================================================= */}
      {/* TOP HEADER: Language Selector, AI Generator, & Gamification Stats */}
      {/* ================================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content shadow-lg shadow-primary/25 text-2xl font-bold">
            {getLanguageFlag(selectedLanguage) || "🗣️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-base-content tracking-tight">
                Language Practice Studio
              </h2>
              <span className="badge badge-primary badge-sm font-bold">
                Lvl {userLevel}
              </span>
            </div>
            <p className="text-xs text-base-content/70">
              Practicing <span className="font-bold text-primary">{selectedLanguage}</span> from {nativeLanguage}
            </p>
          </div>
        </div>

        {/* Action Controls & Stats */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {/* ✨ AI Topic Generator Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="btn btn-primary btn-sm rounded-2xl font-bold gap-1.5 shadow-md shadow-primary/20 text-xs"
          >
            <Sparkles className="size-3.5" />
            <span>Generate Any Topic</span>
          </button>

          {/* 📝 Add Custom Word Button */}
          <button
            type="button"
            onClick={() => setIsAddWordModalOpen(true)}
            className="btn btn-outline btn-sm rounded-2xl font-bold text-xs gap-1 border-base-content/20"
            title="Add your own custom word or phrase"
          >
            <Plus className="size-3.5" />
            <span>My Words</span>
          </button>

          {/* Language Switcher Dropdown */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="select select-bordered select-sm rounded-2xl bg-base-100 text-xs font-bold"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Daily Streak */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 font-bold text-xs"
            title="Consecutive practice streak"
          >
            <Flame className="size-4 animate-pulse" />
            <span>{userData.streak}d</span>
          </div>

          {/* XP Counter */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 text-primary border border-primary/25 font-bold text-xs"
            title="Total Experience Points"
          >
            <Zap className="size-4" />
            <span>{userData.totalXp} XP</span>
          </div>

          {/* Achievements Trigger */}
          <button
            type="button"
            onClick={() => setIsAchievementsOpen(true)}
            className="btn btn-ghost btn-circle btn-sm text-base-content/75 hover:text-primary hover:bg-base-300"
            title="View Achievements"
          >
            <Trophy className="size-4" />
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ACTIVE AI TOPIC BANNER (If a custom AI lesson is loaded)          */}
      {/* ================================================================= */}
      {aiLessonPack && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 border border-primary/25 flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-base-content">
                  Active Custom Lesson: {aiLessonPack.topic}
                </h4>
                <span className="badge badge-primary badge-xs font-bold">Custom Pack</span>
              </div>
              <p className="text-xs text-base-content/70 mt-0.5">
                {aiLessonPack.overview || "Customized interactive lesson loaded across quizzes, flashcards and roleplay."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAiLessonPack(null);
              toast("Restored Core Curriculum", { icon: "📚" });
            }}
            className="btn btn-ghost btn-sm rounded-xl text-xs text-base-content/70 hover:text-error"
          >
            Reset to Core
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODE SELECTOR: Lessons, Flashcards, Speed Match, Roleplay         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: "lessons", label: "Lessons & Quiz", icon: BookOpen, color: "text-primary", desc: "Structured levels & mic" },
          { id: "flashcards", label: `Flashcards (${combinedVocab.length})`, icon: Layers, color: "text-emerald-500", desc: "3D flip vocabulary" },
          { id: "match", label: "Speed Match", icon: Gamepad2, color: "text-amber-500", desc: "Rapid word matching" },
          { id: "roleplay", label: "Dialogue Roleplay", icon: MessageCircle, color: "text-secondary", desc: "Real cafe & hotel scenes" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3.5 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/10 scale-[1.01]"
                  : "border-base-content/10 bg-base-200/60 hover:bg-base-200 text-base-content/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${tab.color}`} />
                <span className="font-bold text-xs sm:text-sm">{tab.label}</span>
              </div>
              <span className="text-[11px] text-base-content/60 mt-1 truncate">
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: LESSONS & QUIZ VIEW                                        */}
      {/* ================================================================= */}
      {activeTab === "lessons" && (
        <div className="space-y-6">
          {!activeLevelId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show Custom AI Lesson Card if one was generated */}
              {aiLessonPack && (
                <div className="p-5 rounded-3xl border-2 border-primary bg-primary/10 shadow-md flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center text-xl shadow-md">
                        ✨
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-base-content">
                          {aiLessonPack.topic}
                        </h4>
                        <p className="text-xs text-base-content/75 mt-0.5">
                          {aiLessonPack.overview || "Custom AI Generated Lesson"}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-primary font-bold">New</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-primary/20">
                    <span className="text-xs text-primary font-bold">
                      {aiLessonPack.questions?.length || 4} Custom AI Questions
                    </span>
                    <button
                      type="button"
                      onClick={() => startLevel("ai-pack")}
                      className="btn btn-sm btn-primary rounded-2xl gap-2 font-bold shadow-md shadow-primary/25"
                    >
                      <Play className="size-3.5" /> Start AI Pack
                    </button>
                  </div>
                </div>
              )}

              {/* Core Curriculum Levels */}
              {PRACTICE_LEVELS.map((lvl) => {
                const unlocked = (userData.unlockedLevels[selectedLanguage] || 1) >= lvl.id;
                const isPassed = (userData.passedLevels[selectedLanguage] || []).includes(lvl.id);

                return (
                  <div
                    key={lvl.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      unlocked
                        ? "bg-base-200 border-base-content/15 hover:border-primary/50 shadow-sm"
                        : "bg-base-200/40 border-base-content/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-base-100 flex items-center justify-center text-xl shadow-inner">
                          {lvl.icon}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-base-content">
                            Level {lvl.id}: {lvl.title}
                          </h4>
                          <p className="text-xs text-base-content/65 mt-0.5">
                            {lvl.description}
                          </p>
                        </div>
                      </div>
                      {isPassed && (
                        <span className="badge badge-success badge-sm gap-1 text-white font-bold">
                          <Check className="size-3" /> Passed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-base-content/10">
                      <span className="text-xs text-base-content/60 font-medium">
                        {lvl.questionIds.length} challenge phrases
                      </span>
                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => startLevel(lvl.id)}
                        className={`btn btn-sm rounded-2xl gap-2 font-bold ${
                          unlocked ? "btn-primary" : "btn-disabled"
                        }`}
                      >
                        <Play className="size-3.5" />
                        {isPassed ? "Review" : "Start Level"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Active Quiz Screen */
            <div className="p-6 rounded-3xl bg-base-200 border border-base-content/15 shadow-xl max-w-2xl mx-auto space-y-6">
              {/* Quiz Header & Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveLevelId(null)}
                    className="btn btn-ghost btn-sm rounded-xl text-xs gap-1.5"
                  >
                    ← Exit Quiz
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-base-content/70">
                      Question {questionIndex + 1} of {levelQuestions.length}
                    </span>
                    <span className="badge badge-primary font-bold">
                      {roundPoints} Pts
                    </span>
                  </div>
                </div>

                <progress
                  className="progress progress-primary w-full h-2 rounded-full"
                  value={questionIndex + 1}
                  max={levelQuestions.length}
                />
              </div>

              {!levelFinished ? (
                /* Question Canvas */
                <div className="space-y-6 py-2">
                  {/* Prompt Card */}
                  <div className="p-6 rounded-3xl bg-base-100 border border-base-content/10 shadow-sm text-center relative space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Translate this into {selectedLanguage}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-base-content">
                      {currentPromptText}
                    </h3>

                    {/* Audio Hint Button */}
                    <button
                      type="button"
                      onClick={() => speakText(primaryTargetAnswer, selectedLanguage)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors mt-2"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="size-4" />
                      <span>Hear Pronunciation</span>
                    </button>
                  </div>

                  {/* Multiple Choice Options or Type Input */}
                  {currentQuestion?.type === "choice" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {choices.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          disabled={Boolean(feedback)}
                          onClick={() => handleGrade(choice.id)}
                          className="p-4 rounded-2xl border border-base-content/15 bg-base-100 hover:bg-base-300/60 font-bold text-sm text-left transition-all active:scale-95 shadow-sm hover:border-primary/40 flex items-center justify-between"
                        >
                          <span>{choice.label}</span>
                          <Volume2
                            className="size-4 text-base-content/40 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(choice.label, selectedLanguage);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Type Input with Speech Mic option */
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={answerText}
                          disabled={Boolean(feedback)}
                          onChange={(e) => setAnswerText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleGrade(answerText)}
                          placeholder={`Type the ${selectedLanguage} translation...`}
                          className="input input-bordered flex-1 rounded-2xl bg-base-100 text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={toggleSpeechRecognition}
                          className={`btn rounded-2xl ${
                            isListening ? "btn-error animate-pulse text-white" : "btn-outline border-base-content/20"
                          }`}
                          title="Speak answer via microphone"
                        >
                          {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(feedback) || !answerText.trim()}
                          onClick={() => handleGrade(answerText)}
                          className="btn btn-primary rounded-2xl font-bold px-5"
                        >
                          Check
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Banner */}
                  {feedback && (
                    <div
                      className={`p-4 rounded-2xl flex items-center justify-between animate-fadeIn ${
                        feedback.correct
                          ? "bg-success/15 border border-success/30 text-success"
                          : "bg-error/15 border border-error/30 text-error"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {feedback.correct ? (
                          <CheckCircle2 className="size-6 text-success" />
                        ) : (
                          <HelpCircle className="size-6 text-error" />
                        )}
                        <div>
                          <p className="font-extrabold text-sm">
                            {feedback.correct ? "Spot on! Well done 🎉" : "Not quite, correct answer is:"}
                          </p>
                          {!feedback.correct && (
                            <p className="text-xs font-bold text-base-content mt-0.5">
                              {feedback.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="btn btn-sm btn-primary rounded-xl font-bold px-4"
                      >
                        Continue →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Level Completed Celebration */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-primary/20 text-primary flex items-center justify-center mx-auto text-3xl shadow-lg shadow-primary/25">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-base-content">
                      Level Finished!
                    </h3>
                    <p className="text-xs text-base-content/70 mt-1">
                      You earned {roundPoints} points and progressed your language skills!
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => startLevel(activeLevelId)}
                      className="btn btn-outline rounded-2xl text-xs gap-1.5"
                    >
                      <RotateCcw className="size-4" /> Practice Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLevelId(null)}
                      className="btn btn-primary rounded-2xl text-xs gap-1.5 font-bold"
                    >
                      Choose Next Level →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SMART 3D FLASHCARDS                                        */}
      {/* ================================================================= */}
      {activeTab === "flashcards" && (
        <div className="max-w-xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-base-content">
                Vocabulary Flashcards
              </h3>
              <p className="text-xs text-base-content/65">
                Tap card to reveal translation & audio
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddWordModalOpen(true)}
                className="btn btn-outline btn-xs rounded-xl font-bold gap-1"
              >
                <Plus className="size-3" /> Add Word
              </button>
              <span className="badge badge-primary font-bold">
                Card {flashcardIndex + 1} of {combinedVocab.length}
              </span>
            </div>
          </div>

          {/* 3D Flip Card Component */}
          <div
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className="w-full h-72 sm:h-80 rounded-3xl bg-base-200 border border-base-content/15 shadow-xl flex flex-col justify-between p-6 sm:p-8 cursor-pointer select-none transition-all hover:scale-[1.01] hover:border-primary/50 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-base-100 text-base-content/70 border border-base-content/10">
                {currentFlashcard?.category || "Essential"}
              </span>
              {isCardMastered && (
                <span className="badge badge-success badge-sm gap-1 text-white font-bold">
                  <Check className="size-3" /> Mastered
                </span>
              )}
            </div>

            {/* Center Word Display */}
            <div className="text-center space-y-2 py-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                {isCardFlipped ? selectedLanguage : nativeLanguage}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content">
                {isCardFlipped ? cardTargetWord : cardNativeWord}
              </h2>
              <p className="text-xs text-base-content/50 italic">
                {isCardFlipped ? "Tap to flip back" : "Tap anywhere to flip card"}
              </p>
            </div>

            {/* Bottom Audio Trigger */}
            <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(cardTargetWord, selectedLanguage);
                }}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Speak in target language"
              >
                <Volume2 className="size-5" />
              </button>
              <span className="text-[11px] text-base-content/60 font-medium">
                {selectedLanguage} Pronunciation
              </span>
            </div>
          </div>

          {/* Flashcard Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevCard}
              className="btn btn-outline rounded-2xl btn-sm font-bold"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleCardMaster}
              className="btn btn-success text-white rounded-2xl btn-sm font-bold gap-1.5 shadow-sm"
            >
              <ThumbsUp className="size-3.5" />
              Mark Mastered (+15 XP)
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              className="btn btn-primary rounded-2xl btn-sm font-bold"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: SPEED WORD MATCH MINI-GAME                                 */}
      {/* ================================================================= */}
      {activeTab === "match" && (
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {!gameActive ? (
            <div className="p-8 rounded-3xl bg-base-200 border border-base-content/15 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto text-3xl shadow-inner">
                ⚡
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-base-content">
                  Speed Word Match
                </h3>
                <p className="text-xs text-base-content/70 mt-1 max-w-sm mx-auto">
                  Match the {nativeLanguage} word to its {selectedLanguage} translation as fast as you can before the 30-second timer runs out!
                </p>
              </div>

              {userData.matchHighScore > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100 border border-base-content/10 text-xs font-bold text-amber-500">
                  <Trophy className="size-4" />
                  <span>High Score: {userData.matchHighScore} pts</span>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={startMatchGame}
                  className="btn btn-primary btn-wide rounded-2xl font-extrabold gap-2 text-sm shadow-lg shadow-primary/25"
                >
                  <Play className="size-4" /> Start Challenge (30s)
                </button>
              </div>
            </div>
          ) : (
            /* Active Game Canvas */
            <div className="p-6 rounded-3xl bg-base-200 border border-base-content/15 shadow-xl space-y-6">
              {/* Game Stats Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-base-100 border border-base-content/10 font-bold text-xs">
                <div className="flex items-center gap-1.5 text-error">
                  <Clock className="size-4 animate-spin" />
                  <span>{timeLeft}s remaining</span>
                </div>
                <div className="text-primary">
                  <span>Score: {score}</span>
                </div>
                <div className="text-amber-500">
                  <span>Combo: x{combo}</span>
                </div>
              </div>

              {/* 8-Tile Match Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gameTiles.map((tile) => {
                  const isSelected = selectedTile?.id === tile.id;
                  const isMatched = matchedPairs.has(tile.pairId);

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => handleTileClick(tile)}
                      className={`h-24 p-3 rounded-2xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center text-center transition-all duration-200 select-none ${
                        isMatched
                          ? "bg-success/20 border-success/40 text-success opacity-40 line-through"
                          : isSelected
                          ? "bg-primary text-primary-content border-primary shadow-lg scale-105"
                          : "bg-base-100 border-base-content/15 hover:border-primary/50 text-base-content hover:bg-base-300/40"
                      }`}
                    >
                      <span className="truncate w-full">{tile.text}</span>
                      <span className="text-[10px] font-normal opacity-60 mt-1">
                        {tile.isTarget ? selectedLanguage : nativeLanguage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: REAL-WORLD SCENARIOS / DIALOGUE ROLEPLAY                   */}
      {/* ================================================================= */}
      {activeTab === "roleplay" && (
        <div className="space-y-6">
          {/* Scenario Selector Carousel/Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeScenariosList.map((sc) => {
              const isSelected = sc.id === activeScenarioId;
              const completed = (userData.scenariosCompleted || []).includes(sc.id);

              return (
                <div
                  key={sc.id}
                  onClick={() => restartScenario(sc.id)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary shadow-md"
                      : "bg-base-200 border-base-content/10 hover:border-primary/40 text-base-content"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-base-100 flex items-center justify-center text-xl shadow-inner">
                      {sc.icon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-base-content">
                        {sc.title}
                      </h4>
                      <p className="text-xs text-base-content/65 truncate max-w-xs">
                        {sc.description}
                      </p>
                    </div>
                  </div>
                  {completed && (
                    <span className="badge badge-success badge-sm gap-1 text-white font-bold flex-shrink-0">
                      <Check className="size-3" /> Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Conversation Stage */}
          <div className="p-6 rounded-3xl bg-base-200 border border-base-content/15 shadow-xl max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentScenario.character.avatar}
                  alt={currentScenario.character.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-sm text-base-content">
                    {currentScenario.character.name}
                  </h4>
                  <p className="text-xs text-base-content/60">
                    {currentScenario.character.role} • {currentScenario.title}
                  </p>
                </div>
              </div>
              <span className="badge badge-primary badge-sm font-bold">
                Step {scenarioStepIndex + 1} of {currentScenario.steps.length}
              </span>
            </div>

            {/* Character Speech Bubble */}
            <div className="p-5 rounded-3xl bg-base-100 border border-base-content/10 shadow-sm space-y-2 relative">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {currentScenario.character.name} says:
              </span>
              <p className="text-base sm:text-lg font-bold text-base-content">
                {currentScenarioStep?.characterText[selectedLanguage] ||
                  currentScenarioStep?.characterText.English}
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      currentScenarioStep?.characterText[selectedLanguage] ||
                        currentScenarioStep?.characterText.English,
                      selectedLanguage
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                >
                  <Volume2 className="size-3.5" />
                  <span>Listen to Character</span>
                </button>
                <span className="text-[11px] text-base-content/50 italic">
                  ({currentScenarioStep?.characterText[nativeLanguage] || "English translation available"})
                </span>
              </div>
            </div>

            {/* User Dialogue Choices */}
            {!scenarioCompleted ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-base-content/75">
                  Choose your response in {selectedLanguage}:
                </label>
                <div className="space-y-2">
                  {currentScenarioStep?.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleScenarioOptionChoose(opt)}
                      className="w-full p-4 rounded-2xl border border-base-content/15 bg-base-100 hover:bg-base-300/60 font-bold text-xs sm:text-sm text-left transition-all hover:border-primary flex items-center justify-between shadow-sm group"
                    >
                      <div className="pr-2">
                        <p className="text-base-content group-hover:text-primary transition-colors">
                          {opt.text[selectedLanguage] || opt.text.English}
                        </p>
                        <p className="text-[11px] text-base-content/50 font-normal mt-0.5">
                          {opt.text[nativeLanguage] || opt.text.English}
                        </p>
                      </div>
                      <Volume2
                        className="size-4 text-base-content/40 hover:text-primary flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(opt.text[selectedLanguage] || opt.text.English, selectedLanguage);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <span className="text-4xl">🌟</span>
                <h4 className="text-xl font-extrabold text-base-content">
                  Scenario Mastered!
                </h4>
                <p className="text-xs text-base-content/70">
                  You successfully conducted a conversation in {selectedLanguage}!
                </p>
                <button
                  type="button"
                  onClick={() => restartScenario(activeScenarioId)}
                  className="btn btn-primary rounded-2xl font-bold btn-sm mt-2"
                >
                  Practice Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ✨ AI LESSON GENERATOR MODAL                                      */}
      {/* ================================================================= */}
      {isAiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div
            className="bg-base-200 border border-base-content/15 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-base-content">
                    AI Lesson Generator
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Generate infinite fresh lessons for {selectedLanguage} on any topic
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Input Prompt */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-base-content">
                What would you like to practice today?
              </label>
              <input
                type="text"
                value={aiTopicInput}
                onChange={(e) => setAiTopicInput(e.target.value)}
                placeholder="e.g. Street food in Mexico City, Renting an apartment, Football match..."
                className="input input-bordered w-full rounded-2xl bg-base-100 text-sm"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-base-content/70">
                Or pick a popular topic:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AI_SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.topic}
                    type="button"
                    onClick={() => handleGenerateAiLesson(chip.topic)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-base-100 hover:bg-primary hover:text-primary-content border border-base-content/10 transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-base-content">Difficulty:</span>
              <div className="join">
                {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAiLevelInput(lvl)}
                    className={`join-item btn btn-xs ${
                      aiLevelInput === lvl ? "btn-primary font-bold" : "btn-ghost"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-content/10">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="btn btn-ghost btn-sm rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={() => handleGenerateAiLesson()}
                className="btn btn-primary btn-sm rounded-2xl font-bold gap-2 shadow-md shadow-primary/20 text-xs px-5"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating Pack...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Generate Pack</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 📝 ADD CUSTOM WORD / PHRASE MODAL                                */}
      {/* ================================================================= */}
      {isAddWordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsAddWordModalOpen(false)}
        >
          <div
            className="bg-base-200 border border-base-content/15 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <Bookmark className="size-5 text-primary" />
                <h3 className="font-extrabold text-base text-base-content">
                  Add Word to Personal Notebook
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWordModalOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomWord} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-base-content mb-1">
                  Word in {nativeLanguage} (Meaning)
                </label>
                <input
                  type="text"
                  value={customWordNative}
                  onChange={(e) => setCustomWordNative(e.target.value)}
                  placeholder="e.g. Awesome / That's cool"
                  className="input input-bordered w-full rounded-2xl bg-base-100 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-base-content mb-1">
                  Translation in {selectedLanguage}
                </label>
                <input
                  type="text"
                  value={customWordTarget}
                  onChange={(e) => setCustomWordTarget(e.target.value)}
                  placeholder={`e.g. ¡Qué chulo! / Genial`}
                  className="input input-bordered w-full rounded-2xl bg-base-100 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-base-content mb-1">
                  Category / Tag
                </label>
                <input
                  type="text"
                  value={customWordCategory}
                  onChange={(e) => setCustomWordCategory(e.target.value)}
                  placeholder="e.g. Slang, From chat with Carlos, Music"
                  className="input input-bordered w-full rounded-2xl bg-base-100 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-content/10">
                <button
                  type="button"
                  onClick={() => setIsAddWordModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-2xl font-bold px-5"
                >
                  Save to Flashcards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ACHIEVEMENTS MODAL                                                */}
      {/* ================================================================= */}
      {isAchievementsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsAchievementsOpen(false)}
        >
          <div
            className="bg-base-200 border border-base-content/15 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-base-content">
                  Language Achievements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAchievementsOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const unlocked = userData.unlockedBadges?.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                      unlocked
                        ? "bg-base-100 border-amber-500/30 text-base-content shadow-sm"
                        : "bg-base-100/40 border-base-content/10 opacity-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-base-200 flex items-center justify-center text-xl">
                      {ach.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm truncate">
                          {ach.title}
                        </h4>
                        {unlocked && (
                          <span className="badge badge-success badge-xs text-white">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-base-content/65 truncate">
                        {ach.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticePage;
