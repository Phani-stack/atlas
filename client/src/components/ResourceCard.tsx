import { ArrowUpRight, Check, Clock3, FileText } from "lucide-react";
import type { Resource } from "../types";

const typeStyles: Record<string, string> = {
  video: "bg-rose-50 text-rose-700",
  paper: "bg-violet-50 text-violet-700",
  pdf: "bg-blue-50 text-blue-700",
  ppt: "bg-amber-50 text-amber-700",
  doc: "bg-emerald-50 text-emerald-700",
  book: "bg-lime-50 text-lime-700",
  web: "bg-slate-100 text-slate-600",
};

type ResourceCardProps = {
  resource: Resource;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${typeStyles[resource.type] ?? typeStyles.web}`}>
          {resource.type}
        </span>
        {resource.downloaded ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
            <Check size={12} /> Saved
          </span>
        ) : null}
      </div>
      <a href={resource.url} target="_blank" rel="noreferrer" className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 group-hover:text-indigo-700">
        {resource.title}
      </a>
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-500">
        {resource.summary || `A ${resource.type} resource from ${resource.domain || resource.source}.`}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
          <span className="max-w-32 truncate">{resource.domain || resource.source}</span>
          {resource.estimated_minutes ? (
            <span className="inline-flex shrink-0 items-center gap-1"><Clock3 size={11} /> {resource.estimated_minutes}m</span>
          ) : null}
          {resource.pages ? (
            <span className="inline-flex shrink-0 items-center gap-1"><FileText size={11} /> {resource.pages}p</span>
          ) : null}
        </div>
        <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`Open ${resource.title}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600">
          <ArrowUpRight size={15} />
        </a>
      </div>
    </article>
  );
}
