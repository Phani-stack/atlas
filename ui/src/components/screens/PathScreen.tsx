import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Circle,
  ExternalLink,
  Flag,
  ArrowUpDown,
  SkipForward,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import type { Roadmap, RoadmapModule } from "../../types";

interface PathScreenProps {
  roadmap: Roadmap | null;
  onNavigateToPractice?: (moduleId: string) => void;
}

export function PathScreen({ roadmap, onNavigateToPractice }: PathScreenProps) {
  // Current active module default expanded (e.g. 2.2)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "2.2": true,
  });

  // Track checked reading resources locally
  const [readResources, setReadResources] = useState<Record<number, boolean>>({});

  // Active row dropdown menu state
  const [openMenuModuleId, setOpenMenuModuleId] = useState<string | null>(null);

  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="bg-[var(--bg-canvas)] py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-hairline bg-[var(--bg-surface)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto">
          <Flag size={18} />
        </div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] font-normal">
          No Roadmap Generated Yet
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          This space does not have a generated curriculum yet. Create a new space or wait for synthesis to complete.
        </p>
      </div>
    );
  }

  // Overall module stats calculation
  const allModules = roadmap.phases.flatMap((p) => p.modules || []);
  const totalCount = allModules.length;
  const completedCount = 0; // Calculated dynamically from practice if needed

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }

  function toggleReadResource(resourceId: number) {
    setReadResources((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId],
    }));
  }

  return (
    <div className="bg-[var(--bg-canvas)] py-8 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
      {/* Editorial Header / Summary (One line of text + hairline progress) */}
      <header className="space-y-3 border-b-hairline pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
              Route & Waypoints
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal mt-1">
              {roadmap.topic}
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            {completedCount} of {totalCount} waypoints logged · ~{roadmap.estimated_weeks} weeks remaining at {roadmap.assumed_hours_per_week}h/wk
          </p>
        </div>

        {/* Quiet Hairline Progress Bar */}
        <div className="w-full h-1 bg-[var(--bg-muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </header>

      {/* Phased Vertical Trail */}
      <div className="space-y-10">
        {roadmap.phases.map((phase) => (
          <section key={phase.phase} aria-labelledby={`phase-${phase.phase}`} className="space-y-4">
            {/* Phase Section Label */}
            <div className="flex items-baseline justify-between border-b-hairline pb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-[var(--text-tertiary)] font-semibold">
                  Phase 0{phase.phase}
                </span>
                <h3 id={`phase-${phase.phase}`} className="font-serif text-lg text-[var(--text-primary)] font-medium">
                  {phase.title}
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                {phase.estimated_hours} hrs
              </span>
            </div>

            {/* Vertical Trail with Node Waypoints */}
            <div className="relative pl-6 sm:pl-8 space-y-3">
              {/* Vertical Trail Line (Subtle hairline connection) */}
              <div
                aria-hidden="true"
                className="absolute left-2.5 sm:left-3 top-3 bottom-3 w-[1px] bg-[var(--border-hairline)]"
              />

              {phase.modules.map((mod: RoadmapModule) => {
                const isExpanded = Boolean(expandedModules[mod.module_id]);
                // Determine realistic status
                const isCompleted =
                  mod.module_id === "1.1" || mod.module_id === "1.2" || mod.module_id === "2.1";
                const isCurrent = mod.module_id === "2.2";

                return (
                  <article
                    key={mod.module_id}
                    className="relative rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] transition-colors duration-150"
                  >
                    {/* Waypoint Trail Node Icon */}
                    <div
                      aria-hidden="true"
                      className={`absolute -left-[27px] sm:-left-[35px] top-4 w-4 h-4 rounded-full flex items-center justify-center border-hairline bg-[var(--bg-canvas)] ${
                        isCompleted
                          ? "text-[var(--status-success)] border-[var(--status-success)]"
                          : isCurrent
                          ? "border-[var(--accent)] ring-2 ring-[var(--accent-subtle)]"
                          : "text-[var(--text-tertiary)] border-[var(--border-hairline)]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={10} strokeWidth={2.5} />
                      ) : isCurrent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      ) : (
                        <Circle size={8} />
                      )}
                    </div>

                    {/* Collapsible Row Header */}
                    <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.module_id)}
                        className="flex items-center gap-3 text-left min-w-0 flex-1 hover:opacity-80"
                      >
                        <span className="font-mono text-[11px] text-[var(--text-tertiary)] shrink-0">
                          {mod.module_id}
                        </span>
                        <span className="font-serif text-sm sm:text-base text-[var(--text-primary)] font-medium truncate">
                          {mod.title}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] text-[10px] font-mono shrink-0">
                            Current Waypoint
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-mono text-[var(--status-success)] shrink-0 hidden sm:inline">
                            Logged
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                          {mod.estimated_hours}h
                        </span>

                        {/* Row Context Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuModuleId(
                                openMenuModuleId === mod.module_id ? null : mod.module_id,
                              );
                            }}
                            aria-label={`Actions for module ${mod.title}`}
                            className="p-1 rounded-[var(--radius-xs)] border-hairline hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                          >
                            <MoreHorizontal size={13} />
                          </button>

                          {openMenuModuleId === mod.module_id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-44 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] shadow-none p-1 text-xs z-20 space-y-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuModuleId(null);
                                  if (onNavigateToPractice) onNavigateToPractice(mod.module_id);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] flex items-center gap-2"
                              >
                                <Check size={12} />
                                <span>Practice this module</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenMenuModuleId(null)}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center gap-2"
                              >
                                <ArrowUpDown size={12} />
                                <span>Reorder waypoint</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenMenuModuleId(null)}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center gap-2"
                              >
                                <SkipForward size={12} />
                                <span>Skip module</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenMenuModuleId(null)}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] flex items-center gap-2 border-t-hairline pt-1 mt-1"
                              >
                                <RotateCcw size={12} />
                                <span>Regenerate phase</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.module_id)}
                          aria-label={isExpanded ? "Collapse module" : "Expand module"}
                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="border-t-hairline p-4 sm:p-5 space-y-5 text-xs text-[var(--text-secondary)]">
                        {/* Objectives List */}
                        {mod.objectives.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                              Target Objectives
                            </span>
                            <ul className="space-y-1.5 pl-0">
                              {mod.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-[var(--text-tertiary)] mt-0.5">•</span>
                                  <span className="text-[var(--text-primary)]">{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Concepts tags */}
                        {mod.concepts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {mod.concepts.map((concept) => (
                              <span
                                key={concept}
                                className="px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-canvas)] font-mono text-[11px] text-[var(--text-secondary)]"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Field Resources with Read Checkbox */}
                        {mod.resources.primary.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                              <BookOpen size={11} /> Required Readings & Papers
                            </span>
                            <div className="space-y-1.5">
                              {mod.resources.primary.map((res) => {
                                const isRead = Boolean(readResources[res.id]);
                                return (
                                  <div
                                    key={res.id}
                                    className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] hover:border-[var(--border-strong)] transition-colors"
                                  >
                                    <label className="flex items-center gap-2.5 min-w-0 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isRead}
                                        onChange={() => toggleReadResource(res.id)}
                                        className="rounded-[var(--radius-xs)] border-[var(--border-strong)] text-[var(--accent)] accent-[var(--accent)] focus:ring-0"
                                      />
                                      <span
                                        className={`truncate font-medium ${
                                          isRead
                                            ? "line-through text-[var(--text-tertiary)]"
                                            : "text-[var(--text-primary)]"
                                        }`}
                                      >
                                        {res.title}
                                      </span>
                                    </label>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      {res.estimated_minutes && (
                                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                          {res.estimated_minutes}m
                                        </span>
                                      )}
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                                        title="Open resource"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Checkpoint Milestone Box */}
                        {mod.checkpoint && (
                          <div className="p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] flex items-start gap-2.5">
                            <Flag size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-semibold block">
                                Waypoint Checkpoint
                              </span>
                              <p className="mt-0.5 text-xs text-[var(--text-primary)] leading-normal">
                                {mod.checkpoint}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Capstone Project Section (Plain editorial field note section) */}
      {roadmap.capstone_project && (
        <section aria-labelledby="capstone-title" className="border-t-hairline pt-6 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
            <Flag size={12} /> Field Capstone
          </span>
          <h3 id="capstone-title" className="font-serif text-xl text-[var(--text-primary)] font-normal">
            {roadmap.capstone_project.title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {roadmap.capstone_project.description}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {roadmap.capstone_project.skills_used.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] font-mono text-[10px] text-[var(--text-secondary)]"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Coverage Gaps Plain Section */}
      {roadmap.gaps_to_fill && roadmap.gaps_to_fill.length > 0 && (
        <section aria-labelledby="gaps-title" className="border-t-hairline pt-6 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
            Unsurveyed Territory / Coverage Gaps
          </span>
          {roadmap.gaps_to_fill.map((gap, i) => (
            <div key={i} className="text-xs text-[var(--text-secondary)] space-y-1">
              <p className="font-medium text-[var(--text-primary)]">{gap.topic}</p>
              <p className="leading-relaxed">{gap.why}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
