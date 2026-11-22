import { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import type { Resource } from "../../types";

interface LibraryScreenProps {
  resources: Resource[];
}

export function LibraryScreen({ resources }: LibraryScreenProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "title" | "time">("relevance");

  // Local storage persisted reading statuses and personal notes
  const [readingStatuses, setReadingStatuses] = useState<Record<number, "to_read" | "reading" | "done">>(() => {
    try {
      return JSON.parse(localStorage.getItem("atlas_resource_statuses") || "{}");
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("atlas_resource_notes") || "{}");
    } catch {
      return {};
    }
  });

  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    localStorage.setItem("atlas_resource_statuses", JSON.stringify(readingStatuses));
  }, [readingStatuses]);

  useEffect(() => {
    localStorage.setItem("atlas_resource_notes", JSON.stringify(notes));
  }, [notes]);

  function updateStatus(id: number, status: "to_read" | "reading" | "done") {
    setReadingStatuses((prev) => ({ ...prev, [id]: status }));
  }

  function updateNote(id: number, text: string) {
    setNotes((prev) => ({ ...prev, [id]: text }));
  }

  function toggleNotes(id: number) {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Derive unique resource types from real backend data
  const dynamicTypes = Array.from(new Set(resources.map((r) => r.type.toLowerCase()))).filter(Boolean);
  const allTypes = ["all", ...dynamicTypes];

  const filtered = resources
    .filter((item) => {
      const status = readingStatuses[item.id] || "to_read";
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(query.toLowerCase())) ||
        (item.domain && item.domain.toLowerCase().includes(query.toLowerCase()));
      const matchesType = typeFilter === "all" || item.type.toLowerCase() === typeFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "time") return (b.estimated_minutes || 0) - (a.estimated_minutes || 0);
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });

  const readCount = resources.filter((r) => readingStatuses[r.id] === "done").length;

  return (
    <div className="bg-[var(--bg-canvas)] py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
      {/* Editorial Title */}
      <header className="border-b-hairline pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
            Field Archive
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal mt-1">
            Research Library
          </h2>
        </div>
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {readCount} of {resources.length} read · {filtered.length} visible
        </span>
      </header>

      {/* Dense Controls Bar (Search, Filters, Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, RFCs, chapters..."
            className="w-full pl-8 pr-3 py-1.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-xs outline-none focus:border-[var(--border-focus)]"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {allTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-[var(--radius-xs)] font-mono text-[11px] capitalize border-hairline transition-colors ${
                typeFilter === type
                  ? "bg-[var(--text-primary)] text-[var(--text-inverse)] font-medium"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Reading Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="lib-status-filter" className="sr-only">Status filter</label>
          <select
            id="lib-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono text-[11px] outline-none"
          >
            <option value="all">Status: All</option>
            <option value="to_read">To read</option>
            <option value="reading">Reading</option>
            <option value="done">Done</option>
          </select>

          <label htmlFor="lib-sort-filter" className="sr-only">Sort by</label>
          <select
            id="lib-sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono text-[11px] outline-none"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="title">Sort: Title</option>
            <option value="time">Sort: Length</option>
          </select>
        </div>
      </div>

      {/* Dense Reading Table / List */}
      <div className="border-hairline rounded-[var(--radius-md)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="hidden sm:grid grid-cols-[100px_minmax(0,1fr)_80px_70px_60px] gap-3 px-4 py-2 border-b-hairline bg-[var(--bg-canvas)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Status</span>
          <span>Title & Source</span>
          <span>Type</span>
          <span>Length</span>
          <span className="text-right">Notes</span>
        </div>

        <div className="divide-y divide-[var(--border-hairline)] text-xs">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-xs text-[var(--text-tertiary)]">
              {resources.length === 0
                ? "No resources gathered for this space yet."
                : "No matching resources match your filter criteria."}
            </p>
          ) : (
            filtered.map((item) => {
              const currentStatus = readingStatuses[item.id] || "to_read";
              const itemNote = notes[item.id];
              const isNotesOpen = Boolean(expandedNotes[item.id]);

              return (
                <div key={item.id} className="p-3 sm:px-4 sm:py-3 hover:bg-[var(--bg-subtle)] transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-[100px_minmax(0,1fr)_80px_70px_60px] gap-2 sm:gap-3 items-center">
                    {/* Status Pill Toggle */}
                    <div>
                      <select
                        aria-label={`Reading status for ${item.title}`}
                        value={currentStatus}
                        onChange={(e) => updateStatus(item.id, e.target.value as any)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline outline-none ${
                          currentStatus === "done"
                            ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]"
                            : currentStatus === "reading"
                            ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]"
                            : "bg-[var(--bg-canvas)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        <option value="to_read">To read</option>
                        <option value="reading">Reading</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    {/* Title, Domain & Summary */}
                    <div className="min-w-0 pr-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent)] line-clamp-1 inline-flex items-center gap-1"
                      >
                        <span>{item.title}</span>
                        <ExternalLink size={11} className="shrink-0 text-[var(--text-tertiary)]" />
                      </a>
                      <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">
                        {item.domain || item.source} · {item.summary || "Archived resource"}
                      </p>
                    </div>

                    {/* Type Tag */}
                    <div className="font-mono text-[11px] text-[var(--text-secondary)] capitalize flex items-center gap-1">
                      <span>{item.type}</span>
                      {item.downloaded && (
                        <span title="Saved locally" className="text-[var(--status-success)]">
                          <Check size={11} />
                        </span>
                      )}
                    </div>

                    {/* Length / Pages */}
                    <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      {item.estimated_minutes
                        ? `${item.estimated_minutes}m`
                        : item.pages
                        ? `${item.pages}p`
                        : "—"}
                    </div>

                    {/* Notes Toggle */}
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleNotes(item.id)}
                        className={`p-1 rounded-[var(--radius-xs)] text-[11px] font-mono flex items-center justify-end gap-1 ${
                          itemNote
                            ? "text-[var(--accent)] font-medium"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span>{itemNote ? "Note" : "+"}</span>
                        {isNotesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Expandable Notes Field */}
                  {isNotesOpen && (
                    <div className="mt-3 pt-3 border-t-hairline bg-[var(--bg-canvas)] p-3 rounded-[var(--radius-sm)]">
                      <label htmlFor={`notes-${item.id}`} className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-semibold block mb-1">
                        Personal Study Notes
                      </label>
                      <textarea
                        id={`notes-${item.id}`}
                        value={itemNote || ""}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        placeholder="Write personal synthesis, key theorems, or section anchors..."
                        rows={2}
                        className="w-full bg-[var(--bg-surface)] p-2 rounded-[var(--radius-xs)] border-hairline text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none resize-y"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
