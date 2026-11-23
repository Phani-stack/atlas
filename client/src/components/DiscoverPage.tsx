import { ArrowDown, ArrowUpRight, BookOpen, CheckCircle2, CircleAlert, Clock3, Layers3, Search, Sparkles, Target } from "lucide-react";
import { ResourceLibrary } from "./ResourceLibrary";
import { RoadmapView } from "./RoadmapView";
import { StudyForm } from "./StudyForm";
import type { LearnRequest, LearningResponse } from "../types";
import type { WorkspacePage } from "./Sidebar";

type DiscoverPageProps = {
  busy: boolean;
  error: string;
  spaceName?: string;
  result: LearningResponse | null;
  onSubmit: (request: LearnRequest) => void;
  onNavigate: (page: WorkspacePage) => void;
};

export function DiscoverPage({ busy, error, spaceName, result, onSubmit, onNavigate }: DiscoverPageProps) {
  const collection = result?.resources;
  const roadmap = result?.roadmap;
  const stats = collection?.stats;

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#171b36] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-100px] right-[22%] size-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
            <Sparkles size={13} /> A better way to learn
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-[38px]">
            Turn curiosity into <span className="text-indigo-300">a clear path.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Find quality learning resources, then bring them together in a roadmap built around your goals and your starting point.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Search, label: "Web + academic search" },
              { icon: BookOpen, label: "Videos, papers & more" },
              { icon: CheckCircle2, label: "A step-by-step plan" },
              { icon: Target, label: "Adaptive practice" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-slate-300">
                <Icon size={12} className="text-indigo-300" /> {label}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-7 right-9 hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:block">
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-300"><Layers3 size={13} className="text-cyan-300" /> Your next chapter</div>
          <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" />
          </div>
          <div className="mt-1.5 text-right text-[9px] text-slate-400">one step at a time</div>
        </div>
      </section>

      <StudyForm busy={busy} onSubmit={onSubmit} />

      {error ? (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div><p className="font-semibold">We couldn’t build your learning path.</p><p className="mt-1 text-xs leading-5">{error}</p></div>
        </div>
      ) : null}

      {busy ? (
        <div className="mt-7 flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600"><Clock3 size={19} className="animate-pulse" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Gathering your learning materials</p>
            <p className="mt-1 text-xs text-slate-500">We’re searching across the web and organizing what we find.</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" /></div>
          </div>
        </div>
      ) : null}

      {collection && roadmap ? (
        <div className="mt-10">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} /> LEARNING SPACE READY</div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{spaceName || collection.topic}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {spaceName && spaceName !== collection.topic ? `${collection.topic} · ` : ""}
                {collection.learner.level} level
                {collection.learner.goal ? ` · Goal: ${collection.learner.goal}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate("practice")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Practice questions <Target size={14} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("progress")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-indigo-700"
              >
                View progress <ArrowDown size={14} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Resources found", value: stats?.total ?? 0, icon: BookOpen, accent: "text-indigo-600 bg-indigo-50" },
              { label: "Files downloaded", value: stats?.downloaded ?? 0, icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50" },
              { label: "Estimated to finish", value: `${roadmap.estimated_weeks} weeks`, icon: Clock3, accent: "text-amber-600 bg-amber-50" },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className={`grid size-10 place-items-center rounded-xl ${accent}`}><Icon size={18} /></span>
                <div><p className="text-[10px] font-medium text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></div>
              </div>
            ))}
          </div>

          <div id="roadmap"><RoadmapView roadmap={roadmap} /></div>
          <ResourceLibrary resources={collection.resources} />

          {collection.roadmap_context.coverage_gaps.length ? (
            <p className="mt-6 text-xs text-slate-400">
              <ArrowUpRight size={13} className="mr-1 inline" />
              Your roadmap notes {collection.roadmap_context.coverage_gaps.length} topic{collection.roadmap_context.coverage_gaps.length === 1 ? "" : "s"} with limited free materials.
            </p>
          ) : null}
        </div>
      ) : null}

      {!collection && !busy ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="size-1.5 rounded-full bg-indigo-400" />
          Start with a topic above — we’ll help map the rest.
        </div>
      ) : null}
    </>
  );
}
