"use client";

import type { Task } from "@/lib/types";
import { ChevronLeftIcon, SearchIcon } from "@/components/icons";
import { TaskRow } from "@/components/task-row";

type SearchScreenProps = {
  query: string;
  results: Task[];
  loading: boolean;
  error: string;
  onQueryChange: (query: string) => void;
  onBack: () => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
};

export function SearchScreen({
  query,
  results,
  loading,
  error,
  onQueryChange,
  onBack,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
}: SearchScreenProps) {
  const trimmed = query.trim();
  return (
    <div className="min-h-dvh bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-ink"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <div className="relative flex-1">
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search for a task"
            aria-label="Search for a task"
            className="h-12 w-full rounded-2xl border border-[#eceef3] pr-11 pl-4 text-base text-ink outline-none placeholder:text-[#b0b6c4] focus:border-primary"
          />
          <SearchIcon className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        {error
          ? error
          : loading
            ? "Searching…"
            : trimmed
              ? `${results.length} result${results.length === 1 ? "" : "s"}`
              : "Search by title or description"}
      </p>

      {results.length === 0 && trimmed && !loading ? (
        <p className="mt-10 text-center text-sm leading-6 text-muted">No tasks match “{trimmed}”.</p>
      ) : (
        <div className="mt-2 divide-y divide-[#f2f4f8]">
          {results.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
