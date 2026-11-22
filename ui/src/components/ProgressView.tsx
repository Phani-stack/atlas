import { ArrowRight, CheckCircle2, CircleDot, Clock3, Flame, RotateCcw, Target, Trophy } from "lucide-react";
import type { TutorHistoryEntry, TutorStatus } from "../types";
import type { WorkspacePage } from "./Sidebar";

type ProgressViewProps = {
  status: TutorStatus | null;
  onNavigate: (page: WorkspacePage) => void;
};

function outcome(entry: TutorHistoryEntry): string {
  if (entry.verdict === "skipped") return "Skipped";
  return entry.score >= 0.7 ? "Solved" : "Review";
}

function outcomeStyle(entry: TutorHistoryEntry): string {
  if (entry.verdict === "skipped") return "bg-slate-100 text-slate-600";
  return entry.score >= 0.7 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ProgressView({ status, onNavigate }: ProgressViewProps) {
  if (!status) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center sm:p-12">
        <Target size={28} className="mx-auto text-indigo-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Your progress will appear here</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Start a practice session to track solved questions, topics to review, module mastery, and your XP.
        </p>
        <button
          type="button"
          onClick={() => onNavigate("practice")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Go to practice <ArrowRight size={14} />
        </button>
      </section>
    );
  }

  const solved = status.history.filter((entry) => entry.verdict !== "skipped" && entry.score >= 0.7).length;
  const review = status.history.filter((entry) => entry.verdict !== "skipped" && entry.score < 0.7).length;
  const modulesInProgress = status.modules.filter((module) => module.status === "active").length;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Learning analytics</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{status.topic} progress</h1>
          <p className="mt-1 text-sm text-slate-500">A clear record of your practice and what to focus on next.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("practice")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Continue practice <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Solved questions", value: solved, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Needs review", value: review, icon: RotateCcw, color: "bg-amber-50 text-amber-600" },
          { label: "Practice XP", value: status.stats.xp, icon: Trophy, color: "bg-indigo-50 text-indigo-600" },
          { label: "Current streak", value: status.stats.streak, icon: Flame, color: "bg-orange-50 text-orange-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon size={18} /></span>
            <div>
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Roadmap modules</h2>
            <p className="mt-1 text-xs text-slate-500">{status.done} of {status.total} complete · adaptive difficulty {status.difficulty}/5</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold text-indigo-700">
            <CircleDot size={12} /> {modulesInProgress ? "In progress" : "Ready"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {status.modules.map((module) => (
            <article key={module.module_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600">{module.module_id} · {module.phase}</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-800">{module.title}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                  module.status === "done" ? "bg-emerald-50 text-emerald-700" :
                    module.status === "active" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {module.status === "done" && module.gaps ? "Done · gaps" : module.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                <span>{module.asked} question{module.asked === 1 ? "" : "s"} attempted</span>
                <span>{Math.round(module.mastery * 100)}% mastery</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${module.status === "done" ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, module.mastery * 100))}%` }}
                />
              </div>
              {module.weak.length ? <p className="mt-2 text-[10px] leading-4 text-amber-700">Review concepts: {module.weak.join(", ")}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Question history</h2>
            <p className="mt-1 text-xs text-slate-500">Your answered questions and latest result, saved across sessions.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"><Clock3 size={13} /> {status.history.length} attempts</span>
        </div>
        {status.history.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:grid-cols-[minmax(0,1fr)_100px_90px_110px]">
              <span>Question</span><span className="hidden sm:block">Result</span><span className="hidden text-right sm:block">Score</span><span className="text-right">When</span>
            </div>
            <div className="divide-y divide-slate-100">
              {[...status.history].reverse().map((entry) => (
                <article key={entry.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_100px_90px_110px]">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{entry.concept || entry.question}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-400">{entry.module_id} · {entry.type} · {entry.question}</p>
                  </div>
                  <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${outcomeStyle(entry)}`}>{outcome(entry)}</span>
                  <span className="hidden text-right text-xs font-semibold text-slate-600 sm:block">{Math.round(entry.score * 100)}%</span>
                  <span className="text-right text-[10px] text-slate-400">{formatDate(entry.timestamp)}</span>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No questions answered yet. Your attempts will appear here.
          </div>
        )}
      </section>
    </section>
  );
}
