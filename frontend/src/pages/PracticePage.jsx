import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { LANGUAGES } from "../constants";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import { PRACTICE_LEVELS, PRACTICE_QUESTIONS } from "../data/practiceCourse.js";

const emptyProgress = () => ({ totalPoints: 0, languages: {} });

const readProgress = (key) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || "null");
    if (saved && Number.isFinite(saved.totalPoints) && saved.languages) return saved;
  } catch {
    // Keep the practice page usable if browser storage is unavailable.
  }
  return emptyProgress();
};

const normalizeAnswer = (value) =>
  value
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const PracticePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const storageKey = `hime-practice-v1:${authUser?._id || authUser?.id || "guest"}`;
  const [selectedLanguage, setSelectedLanguage] = useState(
    authUser?.learningLanguage || "Spanish"
  );
  const [progress, setProgress] = useState(emptyProgress);
  const [loadedKey, setLoadedKey] = useState(null);
  const [activeLevelId, setActiveLevelId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setProgress(readProgress(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Scoring continues for this session when storage is disabled.
    }
  }, [loadedKey, storageKey, progress]);

  useEffect(() => {
    if (authUser?.learningLanguage) {
      setSelectedLanguage(authUser.learningLanguage);
    }
  }, [authUser?.learningLanguage]);

  const languageProgress = progress.languages[selectedLanguage] || {
    unlockedLevel: 1,
    passedLevels: [],
    bestScores: {},
  };
  const activeLevel = PRACTICE_LEVELS.find((level) => level.id === activeLevelId);
  const levelQuestions = useMemo(
    () =>
      activeLevel
        ? activeLevel.questionIds
            .map((id) => PRACTICE_QUESTIONS.find((question) => question.id === id))
            .filter(Boolean)
        : [],
    [activeLevel]
  );
  const currentQuestion = levelQuestions[questionIndex];
  const nativeLanguage = authUser?.nativeLanguage || "English";
  const promptLanguage =
    nativeLanguage === selectedLanguage
      ? selectedLanguage === "English"
        ? "Spanish"
        : "English"
      : nativeLanguage;
  const acceptedAnswers = currentQuestion
    ? (Array.isArray(currentQuestion.translations[selectedLanguage])
        ? currentQuestion.translations[selectedLanguage]
        : [currentQuestion.translations[selectedLanguage]]) || []
    : [];
  const targetAnswer = acceptedAnswers[0] || "";
  const sourcePrompt = currentQuestion?.translations[promptLanguage] || currentQuestion?.prompt;
  const totalPassed = Object.values(progress.languages).reduce(
    (total, language) => total + (language.passedLevels?.length || 0),
    0
  );

  const choices = useMemo(() => {
    if (!activeLevel || !currentQuestion) return [];
    const answers = levelQuestions.map((question) => ({
      id: question.id,
      label: Array.isArray(question.translations[selectedLanguage])
        ? question.translations[selectedLanguage][0]
        : question.translations[selectedLanguage],
    }));
    const correctIndex = answers.findIndex((answer) => answer.id === currentQuestion.id);
    const desiredIndex = (questionIndex + 1) % answers.length;
    const [correct] = answers.splice(correctIndex, 1);
    answers.splice(desiredIndex, 0, correct);
    return answers;
  }, [activeLevel, currentQuestion, levelQuestions, questionIndex, selectedLanguage]);

  const beginLevel = (levelId) => {
    setActiveLevelId(levelId);
    setQuestionIndex(0);
    setRoundPoints(0);
    setAnswerText("");
    setFeedback(null);
    setResult(null);
  };

  const gradeAnswer = (answer) => {
    if (!currentQuestion || feedback) return;
    const correct = currentQuestion.type === "choice"
      ? answer === currentQuestion.id
      : acceptedAnswers.some(
          (accepted) => normalizeAnswer(answer) === normalizeAnswer(accepted)
        );
    setFeedback({ correct, answer: targetAnswer });
    if (correct) setRoundPoints((points) => points + 10);
  };

  const finishLevel = () => {
    const previousBest = languageProgress.bestScores[activeLevelId] || 0;
    const passed = roundPoints >= 20;
    const pointsEarned = Math.max(0, roundPoints - previousBest);
    const passedLevels = passed
      ? [...new Set([...languageProgress.passedLevels, activeLevelId])]
      : languageProgress.passedLevels;
    const nextLanguageProgress = {
      unlockedLevel: passed
        ? Math.max(
            languageProgress.unlockedLevel,
            Math.min(PRACTICE_LEVELS.length, activeLevelId + 1)
          )
        : languageProgress.unlockedLevel,
      passedLevels,
      bestScores: {
        ...languageProgress.bestScores,
        [activeLevelId]: Math.max(previousBest, roundPoints),
      },
    };

    setProgress((current) => ({
      totalPoints: current.totalPoints + pointsEarned,
      languages: {
        ...current.languages,
        [selectedLanguage]: nextLanguageProgress,
      },
    }));
    setResult({
      score: roundPoints,
      passed,
      pointsEarned,
      grade: roundPoints === 30 ? "A" : roundPoints >= 20 ? "B" : "Try again",
    });
  };

  const continueLevel = () => {
    if (questionIndex === levelQuestions.length - 1) {
      finishLevel();
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswerText("");
    setFeedback(null);
  };

  const changeLanguage = (language) => {
    setSelectedLanguage(language);
    setActiveLevelId(null);
    setResult(null);
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6 lg:p-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-base-content/10 pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <BookOpen className="size-4" /> Language practice
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Practice Room</h1>
          <p className="mt-1 max-w-2xl text-sm text-base-content/70">
            Take short, interactive challenges. Pass milestones to unlock the next level.
          </p>
        </div>
        <label className="form-control w-full max-w-xs">
          <span className="label pb-1 text-xs font-semibold text-base-content/65">
            Learning language
          </span>
          <select
            className="select select-bordered select-sm w-full"
            value={selectedLanguage}
            onChange={(event) => changeLanguage(event.target.value)}
            disabled={Boolean(activeLevel)}
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-base-content/10 pb-5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-primary">
          <Sparkles className="size-4" /> {progress.totalPoints} points
        </span>
        <span className="flex items-center gap-2 font-semibold text-base-content/70">
          <Trophy className="size-4" /> {totalPassed} milestones passed
        </span>
        <span className="flex items-center gap-2 font-semibold text-base-content/70">
          <Target className="size-4" /> {getLanguageFlag(selectedLanguage)} {selectedLanguage}
        </span>
      </section>

      {result ? (
        <section className="mx-auto max-w-2xl py-10 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            {result.passed ? <Award className="size-7" /> : <RotateCcw className="size-6" />}
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-base-content/55">
            Level {activeLevelId} {result.passed ? "passed" : "not passed yet"}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold">
            {result.score}/30 <span className="text-primary">· {result.grade}</span>
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-base-content/70">
            {result.passed
              ? `Milestone complete. You earned ${result.pointsEarned} new points.`
              : "Score at least 20 points to pass and unlock the next level."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setActiveLevelId(null);
                setResult(null);
              }}
            >
              All levels
            </button>
            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => beginLevel(activeLevelId)}>
              <RotateCcw className="size-4" /> Try again
            </button>
          </div>
        </section>
      ) : activeLevel ? (
        <section className="mx-auto max-w-3xl py-3">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm -ml-3"
              onClick={() => setActiveLevelId(null)}
            >
              All levels
            </button>
            <span className="text-xs font-bold text-base-content/65">
              Level {activeLevelId} · Question {questionIndex + 1} of {levelQuestions.length} · {roundPoints} pts
            </span>
          </div>
          <progress
            className="progress progress-primary mb-6 h-2 w-full"
            value={questionIndex + (feedback ? 1 : 0)}
            max={levelQuestions.length}
          />
          <div className="border-l-2 border-primary pl-5 sm:pl-7">
            <p className="text-xs font-bold uppercase tracking-wider text-base-content/55">
              {currentQuestion?.type === "type" ? "Type the translation" : "Choose the correct translation"}
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{sourcePrompt}</h2>
            <p className="mt-2 text-sm text-base-content/60">
              {promptLanguage} to {selectedLanguage}
            </p>
          </div>

          {currentQuestion?.type === "choice" ? (
            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {choices.map((choice) => {
                const isCorrect = choice.id === currentQuestion.id;
                const stateClass = !feedback
                  ? "border-base-content/10 hover:border-primary/50 hover:bg-primary/5"
                  : isCorrect
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-base-content/10 opacity-55";
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => gradeAnswer(choice.id)}
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border bg-base-200/50 p-4 text-left text-sm font-semibold transition-colors disabled:cursor-default ${stateClass}`}
                  >
                    {choice.label}
                    {feedback && isCorrect && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              className="mt-7 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                gradeAnswer(answerText);
              }}
            >
              <input
                className="input input-bordered min-w-0 flex-1"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                disabled={Boolean(feedback)}
                aria-label="Type your translation"
                autoComplete="off"
              />
              {!feedback && (
                <button type="submit" className="btn btn-primary" disabled={!answerText.trim()}>
                  Check answer
                </button>
              )}
            </form>
          )}

          {feedback && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-base-content/10 pt-4">
              <p className={`text-sm font-semibold ${feedback.correct ? "text-success" : "text-error"}`}>
                {feedback.correct ? "Correct · +10 points" : `Not quite · ${feedback.answer}`}
              </p>
              <button type="button" className="btn btn-primary btn-sm gap-1" onClick={continueLevel}>
                {questionIndex === levelQuestions.length - 1 ? "Finish level" : "Next question"}
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Your milestones</h2>
              <p className="mt-1 text-sm text-base-content/65">
                Earn 20 of 30 points to pass a level and unlock the next.
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm gap-2" onClick={() => navigate("/")}>
              Back to dashboard
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {PRACTICE_LEVELS.map((level) => {
              const unlocked = level.id <= languageProgress.unlockedLevel;
              const passed = languageProgress.passedLevels.includes(level.id);
              const bestScore = languageProgress.bestScores[level.id] || 0;
              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => beginLevel(level.id)}
                  className={`flex min-h-44 flex-col border p-4 text-left transition-colors ${
                    unlocked
                      ? "border-base-content/10 bg-base-200/50 hover:border-primary/40 hover:bg-primary/5"
                      : "cursor-not-allowed border-base-content/5 bg-base-200/20 opacity-50"
                  }`}
                >
                  <span className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-primary">
                    Level {level.id}
                    {passed ? <CheckCircle2 className="size-5 text-success" /> : unlocked ? <ChevronRight className="size-5" /> : <LockKeyhole className="size-4 text-base-content/50" />}
                  </span>
                  <span className="mt-4 font-bold">{level.title}</span>
                  <span className="mt-1 text-xs leading-relaxed text-base-content/65">{level.description}</span>
                  <span className="mt-auto pt-4 text-xs font-semibold text-base-content/55">Best score: {bestScore}/30</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default PracticePage;