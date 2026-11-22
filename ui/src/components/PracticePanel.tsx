import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Code2,
  Flame,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getTutorQuestion,
  requestTutorHint,
  skipTutorModule,
  startTutorSession,
  submitTutorAnswer,
} from "../lib/api";
import type {
  TutorAnswerResult,
  TutorHistoryEntry,
  TutorQuestion,
  TutorStatus,
} from "../types";

type PracticePanelProps = {
  spaceId: string;
  spaceName: string;
  topic: string;
  active: boolean;
  initialStatus: TutorStatus | null;
  onStatusChange: (status: TutorStatus) => void;
};

type HistoryFilter = "all" | "solved" | "review";

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value) ?? String(value);
}

function isSolved(entry: TutorHistoryEntry): boolean {
  return entry.verdict !== "skipped" && entry.score >= 0.7;
}

function attemptLabel(entry: TutorHistoryEntry): string {
  if (entry.verdict === "skipped") return "Skipped";
  return isSolved(entry) ? "Solved" : "Review";
}

function attemptStyle(entry: TutorHistoryEntry): string {
  if (entry.verdict === "skipped") return "bg-slate-100 text-slate-500";
  return isSolved(entry) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800";
}

function QuestionHistory({
  status,
  question,
  result,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
}: {
  status: TutorStatus;
  question: TutorQuestion | null;
  result: TutorAnswerResult | null;
  selectedId: string | null;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onSelect: (id: string | null) => void;
}) {
  const allAttempts = status.history ?? [];
  const solvedCount = allAttempts.filter(isSolved).length;
  const reviewCount = allAttempts.filter((entry) => entry.verdict !== "skipped" && !isSolved(entry)).length;
  const attempts = [...allAttempts]
    .reverse()
    .filter((entry) => filter === "all" || (filter === "solved" ? isSolved(entry) : entry.verdict !== "skipped" && !isSolved(entry)));
  const currentLabel = question ? "In progress" : result ? "Just checked" : status.done === status.total ? "Complete" : "Ready";

  return (
    <aside className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Question list</h3>
            <p className="mt-1 text-[10px] text-slate-400">{allAttempts.length} saved attempts</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
            {solvedCount} solved
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedId === null}
          className={`mt-4 w-full rounded-xl border p-3 text-left transition ${
            selectedId === null
              ? "border-indigo-200 bg-indigo-50/70 ring-1 ring-indigo-100"
              : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800">Current session</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              question ? "bg-indigo-100 text-indigo-700" :
                result ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}>
              {currentLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] text-slate-500">
            {question?.title ?? (result ? "Latest answer and feedback" : "Your next question")}
          </p>
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
        {([
          ["all", "All", allAttempts.length],
          ["solved", "Solved", solvedCount],
          ["review", "Review", reviewCount],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            aria-pressed={filter === id}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
              filter === id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {label} <span className={filter === id ? "text-slate-300" : "text-slate-400"}>{count}</span>
          </button>
        ))}
      </div>

      <div className="max-h-[420px] flex-1 space-y-1 overflow-y-auto p-2">
        {attempts.length ? attempts.map((entry) => {
          const solved = isSolved(entry);
          const Icon = solved ? CheckCircle2 : RotateCcw;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              aria-pressed={selectedId === entry.id}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedId === entry.id
                  ? "border-indigo-200 bg-indigo-50/70"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className={solved ? "shrink-0 text-emerald-600" : "shrink-0 text-amber-600"} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">
                  {entry.concept || `Question ${entry.number}`}
                </span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${attemptStyle(entry)}`}>
                  {attemptLabel(entry)}
                </span>
              </div>
              <p className="mt-1.5 truncate pl-[22px] text-[10px] text-slate-400">
                {entry.module_id} · {entry.type} · {Math.round(entry.score * 100)}%
              </p>
            </button>
          );
        }) : (
          <p className="px-3 py-8 text-center text-xs leading-5 text-slate-400">
            {filter === "all" ? "Answer a question and it will be saved here." : `No ${filter} questions yet.`}
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{status.stats.answered} total answers</span>
          <span className="inline-flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {status.stats.streak} streak</span>
        </div>
      </div>
    </aside>
  );
}

function HistoryReview({ entry }: { entry: TutorHistoryEntry }) {
  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${attemptStyle(entry)}`}>
            {attemptLabel(entry)}
          </span>
          <span className="text-[11px] text-slate-400">{entry.module_id} · {entry.concept} · {entry.type}</span>
        </div>
        <span className="text-xs font-bold text-slate-700">{Math.round(entry.score * 100)}%</span>
      </div>
      <h3 className="mt-5 text-base font-bold text-slate-900">Question {entry.number}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{entry.question}</p>
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Your answer</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {entry.answer || "You skipped this question without submitting an answer."}
        </p>
      </div>
      <p className="mt-4 text-[10px] text-slate-400">
        Difficulty {entry.difficulty}/5 · {entry.hints} hint{entry.hints === 1 ? "" : "s"} used
        {entry.review ? " · Review question" : ""}
      </p>
    </article>
  );
}

function ActiveQuestion({
  question,
  answer,
  hints,
  busy,
  onAnswerChange,
  onHint,
  onSkipQuestion,
  onSkipModule,
  onSubmit,
}: {
  question: TutorQuestion;
  answer: string;
  hints: string[];
  busy: string | null;
  onAnswerChange: (value: string) => void;
  onHint: () => void;
  onSkipQuestion: () => void;
  onSkipModule: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            {question.type}
          </span>
          <span className="text-[11px] text-slate-400">{question.module_id} · {question.module_title}</span>
          {question.review ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Review</span> : null}
        </div>
        <span className="text-[10px] font-medium text-slate-400">Difficulty {question.difficulty}/5</span>
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">{question.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{question.prompt}</p>

      {question.type === "mcq" && question.options ? (
        <div className="mt-5 space-y-2">
          {question.options.map((option, index) => {
            const letter = "ABCD"[index];
            const selected = answer === letter;
            return (
              <button
                key={`${letter}-${option}`}
                type="button"
                onClick={() => onAnswerChange(letter)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${selected ? "border-indigo-300 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50"}`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{letter}</span>
                <span className="pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          {question.code ? (
            <div className="mb-3 rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-300"><Code2 size={13} /> Example cases</div>
              <pre className="overflow-x-auto">{question.code.examples.map((example) =>
                `${question.code?.fn}(${example.args.map(formatValue).join(", ")})  →  ${formatValue(example.expected)}`,
              ).join("\n")}</pre>
            </div>
          ) : null}
          <textarea
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            rows={question.type === "code" ? 9 : 5}
            placeholder={question.type === "code" ? "Write your solution here…" : "Write your answer here…"}
            className={`w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 ${question.type === "code" ? "font-mono text-xs" : ""}`}
          />
        </div>
      )}

      {hints.length ? (
        <div className="mt-4 space-y-2">
          {hints.map((hint, index) => (
            <div key={`${index}-${hint}`} className="flex gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <span><strong>Hint {index + 1}.</strong> {hint}</span>
            </div>
          ))}
        </div>
      ) : null}

      {question.sources.length ? (
        <details className="mt-4">
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-700">
            <BookOpenCheck size={14} /> Grounded in {question.sources.length} study source{question.sources.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1.5 pl-5">
            {question.sources.map((source) => (
              <li key={`${source.resource_id}-${source.url}`} className="text-xs">
                <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 hover:underline">
                  {source.title}{source.where ? ` · ${source.where}` : ""}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onHint}
          disabled={busy !== null || hints.length >= question.hints_available}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
        >
          {busy === "hint" ? <LoaderCircle size={14} className="animate-spin" /> : <Lightbulb size={14} />}
          Hint ({Math.max(0, question.hints_available - hints.length)} left)
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSkipQuestion} disabled={busy !== null} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
            Skip question
          </button>
          <button type="button" onClick={onSkipModule} disabled={busy !== null} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
            Skip module
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy !== null || !answer.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "answer" ? <LoaderCircle size={14} className="animate-spin" /> : null}
            Check answer <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

function AnswerFeedback({
  result,
  status,
  busy,
  onNext,
}: {
  result: TutorAnswerResult;
  status: TutorStatus;
  busy: string | null;
  onNext: () => void;
}) {
  return (
    <div>
      <div className={`flex items-center justify-between gap-3 rounded-xl p-4 ${result.score >= 0.7 ? "bg-emerald-50" : result.score >= 0.4 ? "bg-amber-50" : "bg-rose-50"}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${result.score >= 0.7 ? "text-emerald-800" : result.score >= 0.4 ? "text-amber-800" : "text-rose-800"}`}>
            {result.verdict} · {Math.round(result.score * 100)}%
          </p>
          <p className="mt-1 text-xs text-slate-600">+{result.xp} XP · {result.streak} answer streak</p>
        </div>
        <CheckCircle2 size={21} className={result.score >= 0.7 ? "text-emerald-600" : "text-slate-400"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{result.feedback}</p>

      {result.tests ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <p className="font-semibold text-slate-700">Code checks: {result.tests.passed}/{result.tests.total} passed</p>
          {result.tests.error ? <p className="mt-1 text-rose-700">{result.tests.error}</p> : null}
          {result.tests.failures.map((failure, index) => (
            <p key={`${index}-${formatValue(failure.args)}`} className="mt-2 text-slate-500">
              Input {formatValue(failure.args)} · expected {formatValue(failure.expected)} · got {formatValue(failure.got)}
            </p>
          ))}
        </div>
      ) : null}

      {result.model_answer ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Reference answer</p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">{result.model_answer}</p>
        </div>
      ) : null}
      {result.reference ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{result.reference}</pre>
      ) : null}
      {result.review_sources.length ? (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Review these sources</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.review_sources.map((source) => (
              <a key={`${source.resource_id}-${source.url}`} href={source.url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
                {source.title}{source.where ? ` · ${source.where}` : ""}
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onNext}
        disabled={busy !== null || status.done === status.total}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy === "question" ? <LoaderCircle size={14} className="animate-spin" /> : null}
        {status.done === status.total ? "Roadmap practice complete" : "Next question"} <ArrowRight size={14} />
      </button>
    </div>
  );
}

export function PracticePanel({
  spaceId,
  spaceName,
  topic,
  active,
  initialStatus,
  onStatusChange,
}: PracticePanelProps) {
  const [status, setStatus] = useState<TutorStatus | null>(initialStatus);
  const [question, setQuestion] = useState<TutorQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<TutorAnswerResult | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"start" | "question" | "answer" | "hint" | "skip" | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, spaceId]);

  function updateStatus(next: TutorStatus) {
    setStatus(next);
    onStatusChange(next);
  }

  function showQuestion(next: TutorQuestion | null) {
    setQuestion(next);
    setAnswer(next?.type === "code" ? next.code?.starter ?? "" : "");
    setHints([]);
    setResult(null);
    setSelectedHistoryId(null);
    setQuestionStartedAt(Date.now());
  }

  async function loadNextQuestion() {
    setBusy("question");
    setError("");
    try {
      const response = await getTutorQuestion(spaceId);
      showQuestion(response.question);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load a question.");
    } finally {
      setBusy(null);
    }
  }

  async function startSession(reset = false) {
    setBusy("start");
    setError("");
    setNotice("");
    setSelectedHistoryId(null);
    try {
      const session = await startTutorSession(spaceId, { reset });
      updateStatus(session.status);
      setNotice(
        session.index.indexed
          ? `Added ${session.index.indexed} updated resource${session.index.indexed === 1 ? "" : "s"} to your study index.`
          : `Study index ready · ${session.index.chunks} source excerpts`,
      );
      await loadNextQuestion();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start practice.");
    } finally {
      setBusy(null);
    }
  }

  async function submitAnswer(value = answer) {
    if (!question) return;
    setBusy("answer");
    setError("");
    try {
      const response = await submitTutorAnswer(
        spaceId,
        question.id,
        value,
        Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000)),
      );
      updateStatus(response.status);
      setResult(response.result);
      setQuestion(null);
      setAnswer("");
      setSelectedHistoryId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to check your answer.");
    } finally {
      setBusy(null);
    }
  }

  async function askForHint() {
    if (!question) return;
    setBusy("hint");
    setError("");
    try {
      const response = await requestTutorHint(spaceId, question.id);
      setHints((current) => [...current, response.hint]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load a hint.");
    } finally {
      setBusy(null);
    }
  }

  async function movePastModule() {
    setBusy("skip");
    setError("");
    try {
      const response = await skipTutorModule(spaceId);
      updateStatus(response.status);
      await loadNextQuestion();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to skip this module.");
    } finally {
      setBusy(null);
    }
  }

  const selectedHistory = status?.history.find((entry) => entry.id === selectedHistoryId) ?? null;

  return (
    <section hidden={!active} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
            <Target size={14} /> Practice workspace
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{spaceName}</h1>
          <p className="mt-1 text-xs text-slate-500">{topic}</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Work through roadmap questions, then revisit solved attempts or topics that need review.
          </p>
        </div>
        {status ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all saved practice progress for this topic?")) {
                void startSession(true);
              }
            }}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-indigo-700 disabled:opacity-50"
          >
            <RotateCcw size={14} /> Reset progress
          </button>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {status ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Modules completed", value: `${status.done}/${status.total}`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
              { label: "Practice XP", value: status.stats.xp, icon: Trophy, color: "text-amber-600 bg-amber-50" },
              { label: "Current streak", value: status.stats.streak, icon: Flame, color: "text-orange-600 bg-orange-50" },
              { label: "Adaptive difficulty", value: `${status.difficulty}/5`, icon: Sparkles, color: "text-indigo-600 bg-indigo-50" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={16} /></span>
                <div><p className="text-[10px] font-medium text-slate-400">{label}</p><p className="mt-0.5 text-base font-bold text-slate-900">{value}</p></div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
            <QuestionHistory
              status={status}
              question={question}
              result={result}
              selectedId={selectedHistoryId}
              filter={historyFilter}
              onFilterChange={setHistoryFilter}
              onSelect={setSelectedHistoryId}
            />
            <section aria-label="Current practice question" className="min-h-[420px] min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              {selectedHistory ? (
                <HistoryReview entry={selectedHistory} />
              ) : busy === "start" || busy === "question" ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin text-indigo-600" />
                  {busy === "start" ? "Preparing your study materials…" : "Preparing your next question…"}
                </div>
              ) : question ? (
                <ActiveQuestion
                  question={question}
                  answer={answer}
                  hints={hints}
                  busy={busy}
                  onAnswerChange={setAnswer}
                  onHint={() => void askForHint()}
                  onSkipQuestion={() => void submitAnswer("")}
                  onSkipModule={() => void movePastModule()}
                  onSubmit={() => void submitAnswer()}
                />
              ) : result && status ? (
                <AnswerFeedback result={result} status={status} busy={busy} onNext={() => void loadNextQuestion()} />
              ) : status.done === status.total ? (
                <div className="py-12 text-center">
                  <Trophy size={27} className="mx-auto text-emerald-500" />
                  <h2 className="mt-3 text-sm font-bold text-slate-900">Roadmap practice complete</h2>
                  <p className="mt-1 text-xs text-slate-500">Your attempts are saved in the question list.</p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Target size={25} className="mx-auto text-indigo-500" />
                  <h2 className="mt-3 text-sm font-bold text-slate-900">Ready for your next question?</h2>
                  <button
                    type="button"
                    onClick={() => void loadNextQuestion()}
                    disabled={busy !== null}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Continue practice <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </section>
          </div>
          {notice ? <p className="text-[10px] text-slate-400">{notice}</p> : null}
        </>
      ) : (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm"><Sparkles size={18} /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Start or resume your practice session</h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                Your question history and roadmap mastery are saved automatically with this topic.
              </p>
              {notice ? <p className="mt-2 text-[10px] text-emerald-700">{notice}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void startSession()}
            disabled={busy !== null}
            className="mt-4 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 sm:mt-0"
          >
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : null}
            {busy === "start" ? "Preparing practice…" : "Start adaptive practice"}
            {!busy ? <ArrowRight size={14} /> : null}
          </button>
        </div>
      )}
    </section>
  );
}
