import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { LearnRequest } from "../types";

type StudyFormProps = {
  busy: boolean;
  onSubmit: (request: LearnRequest) => void;
};

export function StudyForm({ busy, onSubmit }: StudyFormProps) {
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [known, setKnown] = useState("");
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState(7);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: name.trim() || undefined,
      topic: topic.trim(),
      known: known.trim(),
      goal: goal.trim(),
      hours_per_week: hours,
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_50px_-30px_rgba(27,39,94,0.28)] sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Sparkles size={19} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Build my learning path</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">A few details help us find resources that fit you.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="topic">What do you want to learn?</label>
          <input
            id="topic"
            required
            minLength={1}
            maxLength={120}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. machine learning, Spanish"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="space-name">Name this space <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            id="space-name"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. ML for my career"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="known">What do you already know?</label>
          <textarea
            id="known"
            rows={3}
            maxLength={500}
            value={known}
            onChange={(event) => setKnown(event.target.value)}
            placeholder="Your background or starting point"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700" htmlFor="goal">What is your goal?</label>
          <textarea
            id="goal"
            rows={3}
            maxLength={500}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="What would you like to be able to do?"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[200px]">
          <label className="block text-xs font-semibold text-slate-700" htmlFor="hours">Study time per week</label>
          <div className="relative mt-2">
            <input
              id="hours"
              type="number"
              min={1}
              max={80}
              value={hours}
              onChange={(event) => setHours(Math.max(1, Math.min(80, Number(event.target.value) || 1)))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">hrs / wk</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !topic.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
          {busy ? "Building your path..." : "Find my resources"}
          {!busy ? <ArrowRight size={16} /> : null}
        </button>
      </div>
      {busy ? <p className="mt-4 text-center text-xs text-slate-400">Searching the web, videos, and open academic resources. This can take a minute.</p> : null}
    </form>
  );
}
