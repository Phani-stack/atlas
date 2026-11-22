import { ArrowUpRight, BookOpen, CheckCircle2, CircleDot, Clock3, Flag, Target } from "lucide-react";
import type { Roadmap } from "../types";

const stageStyles: Record<string, { marker: string; badge: string }> = {
  foundation: { marker: "bg-teal-500", badge: "bg-teal-50 text-teal-700" },
  core: { marker: "bg-blue-500", badge: "bg-blue-50 text-blue-700" },
  advanced: { marker: "bg-violet-500", badge: "bg-violet-50 text-violet-700" },
  practice: { marker: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
};

type RoadmapViewProps = {
  roadmap: Roadmap;
};

export function RoadmapView({ roadmap }: RoadmapViewProps) {
  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
            <Target size={14} /> Your roadmap
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">A path from curious to capable</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
          {roadmap.mode === "llm" ? "Personalized with AI" : "Curated learning path"}
        </span>
      </div>

      {roadmap.overview ? (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
          <p className="max-w-4xl text-sm leading-6 text-slate-600">{roadmap.overview}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium text-slate-400">Estimated learning time</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {roadmap.total_estimated_hours}<span className="text-xs font-medium text-slate-400">hours</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium text-slate-400">At your weekly pace</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {roadmap.estimated_weeks}<span className="text-xs font-medium text-slate-400">weeks</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium text-slate-400">Learning stages</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {roadmap.phases.length}<span className="text-xs font-medium text-slate-400">phases</span>
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-5">
        {roadmap.phases.map((phase) => {
          const colors = stageStyles[phase.stage ?? ""] ?? stageStyles.core;
          const scheduled = roadmap.schedule.find((item) => item.phase === phase.phase);
          return (
            <article key={phase.phase} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className={`absolute inset-y-0 left-0 w-1 ${colors.marker}`} />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${colors.badge}`}>
                      <CircleDot size={17} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Phase {phase.phase}</span>
                        {phase.stage ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${colors.badge}`}>{phase.stage}</span> : null}
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{phase.title}</h3>
                      {phase.objective ? <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{phase.objective}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {scheduled ? <span>Week {scheduled.weeks}</span> : null}
                    <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {phase.estimated_hours}h</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {phase.modules.map((module) => (
                    <div key={module.module_id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold text-indigo-600">{module.module_id}</p>
                          <h4 className="mt-1 text-sm font-semibold text-slate-800">{module.title}</h4>
                        </div>
                        <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-500">{module.estimated_hours}h</span>
                      </div>
                      {module.concepts.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {module.concepts.slice(0, 5).map((concept) => (
                            <span key={concept} className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500">{concept}</span>
                          ))}
                        </div>
                      ) : null}
                      {module.objectives.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {module.objectives.slice(0, 3).map((objective) => (
                            <li key={objective} className="flex gap-2 text-xs leading-5 text-slate-500">
                              <CheckCircle2 size={13} className="mt-1 shrink-0 text-emerald-500" /> {objective}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {module.resources.primary.length > 0 ? (
                        <div className="mt-4 border-t border-slate-200/70 pt-3">
                          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            <BookOpen size={12} /> Start with
                          </p>
                          <div className="space-y-2">
                            {module.resources.primary.map((resource) => (
                              <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 text-xs font-medium text-slate-700 hover:text-indigo-700">
                                <span className="line-clamp-1">{resource.title}</span>
                                <ArrowUpRight size={13} className="shrink-0 text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : module.needs_external_resources ? (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Look for an additional resource on this topic.</p>
                      ) : null}
                      {module.practice.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Practice</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{module.practice.slice(0, 2).join(" · ")}</p>
                        </div>
                      ) : null}
                      {module.checkpoint ? (
                        <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500">
                          <Flag size={13} className="mt-0.5 shrink-0 text-amber-500" />
                          <span><strong className="font-semibold text-slate-700">Checkpoint:</strong> {module.checkpoint}</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {roadmap.capstone_project ? (
        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300"><Flag size={15} /> CAPSTONE PROJECT</div>
          <h3 className="mt-2 text-base font-bold">{roadmap.capstone_project.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{roadmap.capstone_project.description}</p>
          {roadmap.capstone_project.skills_used.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {roadmap.capstone_project.skills_used.map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-slate-300">{skill}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {roadmap.gaps_to_fill.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <h3 className="text-sm font-semibold text-amber-900">A few areas may need more resources</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {roadmap.gaps_to_fill.map((gap) => (
              <span key={gap.topic} className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-xs text-amber-800">{gap.topic}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
