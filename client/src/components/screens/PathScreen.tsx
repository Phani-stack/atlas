import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  Flag,
  BookOpen,
} from "lucide-react";
import type { Roadmap, RoadmapModule } from "../../types";

interface PathScreenProps {
  roadmap: Roadmap | null;
  onNavigateToPractice?: (moduleId: string) => void;
}

export function PathScreen({ roadmap }: PathScreenProps) {
  // Track which modules are expanded
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Track checked reading resources locally
  const [readResources, setReadResources] = useState<Record<number, boolean>>({});

  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="bg-[var(--bg-canvas)] py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-hairline bg-[var(--bg-surface)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto">
          <Flag size={18} />
        </div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] font-normal">
          No lesson plan yet
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          This space does not have a lesson plan yet. Create a new space to get started.
        </p>
      </div>
    );
  }

  const allModules = roadmap.phases.flatMap((p) => p.modules || []);
  const totalModules = allModules.length;
  const totalHours = allModules.reduce((sum, mod) => sum + (mod.estimated_hours || 0), 0);

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
      {/* Header / Summary */}
      <header className="space-y-3 border-b-hairline pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
              Lesson Plan
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal mt-1">
              {roadmap.topic}
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            {totalModules} lessons · about {totalHours} hours of study
          </p>
        </div>
      </header>

      {/* Phases */}
      <div className="space-y-10">
        {roadmap.phases.map((phase) => (
          <section key={phase.phase} aria-labelledby={`phase-${phase.phase}`} className="space-y-4">
            {/* Phase Section Label */}
            <div className="flex items-baseline justify-between border-b-hairline pb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-[var(--text-tertiary)] font-semibold">
                  Part {phase.phase}
                </span>
                <h3 id={`phase-${phase.phase}`} className="font-serif text-lg text-[var(--text-primary)] font-medium">
                  {phase.title}
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                {phase.estimated_hours} hrs
              </span>
            </div>

            {/* Module List */}
            <div className="relative pl-6 sm:pl-8 space-y-3">
              <div
                aria-hidden="true"
                className="absolute left-2.5 sm:left-3 top-3 bottom-3 w-[1px] bg-[var(--border-hairline)]"
              />

              {phase.modules.map((mod: RoadmapModule) => {
                const isExpanded = Boolean(expandedModules[mod.module_id]);

                return (
                  <article
                    key={mod.module_id}
                    className="relative rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] transition-colors duration-150"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -left-[27px] sm:-left-[35px] top-4 w-4 h-4 rounded-full flex items-center justify-center border-hairline bg-[var(--bg-canvas)] text-[var(--text-tertiary)] border-[var(--border-hairline)]"
                    >
                      <Circle size={8} />
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
                      </button>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                          {mod.estimated_hours}h
                        </span>

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
                              What you will learn
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

                        {/* Resources with Read Checkbox */}
                        {mod.resources.primary.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
                              <BookOpen size={11} /> Recommended reading
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

                        {/* Checkpoint */}
                        {mod.checkpoint && (
                          <div className="p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] flex items-start gap-2.5">
                            <Flag size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-semibold block">
                                Checkpoint
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

      {/* Capstone Project Section */}
      {roadmap.capstone_project && (
        <section aria-labelledby="capstone-title" className="border-t-hairline pt-6 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
            <Flag size={12} /> Final Project
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

      {/* Topics to explore further */}
      {roadmap.gaps_to_fill && roadmap.gaps_to_fill.length > 0 && (
        <section aria-labelledby="gaps-title" className="border-t-hairline pt-6 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
            Topics to explore further
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