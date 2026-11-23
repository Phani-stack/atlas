import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Resource } from "../types";
import { ResourceCard } from "./ResourceCard";

type ResourceLibraryProps = {
  resources: Resource[];
};

export function ResourceLibrary({ resources }: ResourceLibraryProps) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const types = useMemo(() => ["all", ...new Set(resources.map((resource) => resource.type))], [resources]);
  const filtered = useMemo(
    () => resources.filter((resource) => {
      const matchesType = filter === "all" || resource.type === filter;
      const term = query.trim().toLowerCase();
      const matchesQuery = !term || `${resource.title} ${resource.summary} ${resource.domain}`.toLowerCase().includes(term);
      return matchesType && matchesQuery;
    }),
    [filter, query, resources],
  );

  return (
    <section className="mt-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">The collection</div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Resources worth your time</h2>
          <p className="mt-1 text-xs text-slate-500">{resources.length} results gathered for your learning path</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize transition ${filter === type ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700"}`}
          >
            {type === "all" ? `All ${resources.length}` : `${type} ${resources.filter((resource) => resource.type === type).length}`}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No resources match those filters.
        </div>
      )}
    </section>
  );
}
