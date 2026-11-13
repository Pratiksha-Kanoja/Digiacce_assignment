"use client";

import {
  addDays,
  formatDayHeading,
  formatTaskWhen,
  formatWeekRange,
  startOfWeek,
  toISODate,
  WEEKDAY_LABELS,
  weekDates,
} from "@/lib/dates";
import type { Task, TaskStatus } from "@/lib/types";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { TaskRow } from "@/components/task-row";

type WorkspaceProps = {
  tasks: Task[];
  today: Date;
  weekStart: Date;
  selectedDate: Date;
  viewAll: boolean;
  statusFilter: TaskStatus | null;
  query: string;
  searchResults: Task[];
  searchLoading: boolean;
  searchError: string;
  onQueryChange: (query: string) => void;
  onSelectDate: (date: Date) => void;
  onShiftWeek: (delta: number) => void;
  onToggleViewAll: () => void;
  onStatusFilter: (status: TaskStatus | null) => void;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
  onAdd: () => void;
};

export function Workspace({
  tasks,
  today,
  weekStart,
  selectedDate,
  viewAll,
  statusFilter,
  query,
  searchResults,
  searchLoading,
  searchError,
  onQueryChange,
  onSelectDate,
  onShiftWeek,
  onToggleViewAll,
  onStatusFilter,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpen,
  onAdd,
}: WorkspaceProps) {
  const todayIso = toISODate(today);
  const selectedIso = toISODate(selectedDate);
  const weekStartIso = toISODate(weekStart);
  const weekEnd = toISODate(addDays(weekStart, 6));
  const currentWeek = toISODate(startOfWeek(today)) === weekStartIso;
  const searching = query.trim().length > 0;

  const weekTasks = tasks.filter((task) => task.date >= weekStartIso && task.date <= weekEnd);
  const completed = weekTasks.filter((task) => task.status === "completed").length;
  const open = weekTasks.length - completed;
  const percent = weekTasks.length === 0 ? 0 : Math.round((completed / weekTasks.length) * 100);

  const dayTasks = weekTasks.filter((task) => task.date === selectedIso);
  const base = searching ? searchResults : viewAll ? weekTasks : dayTasks;
  const visible = base.filter((task) => !statusFilter || task.status === statusFilter);

  const heading = searching
    ? "Search"
    : viewAll
      ? currentWeek
        ? "This week"
        : formatWeekRange(weekStart)
      : selectedIso === todayIso
        ? "Today"
        : formatDayHeading(selectedIso, todayIso);

  return (
    <div className="flex min-h-dvh bg-[#eef1f6]">
      <aside className="flex w-[272px] shrink-0 flex-col border-r border-[#e7e9f2] bg-white px-4 py-6 lg:w-[300px] lg:px-5">
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
            T
          </span>
          <div>
            <p className="text-sm font-bold text-ink">To Do List</p>
            <p className="text-xs text-muted">Monday to Sunday</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white"
        >
          <PlusIcon className="h-4 w-4" />
          Add task
        </button>

        <div className="mt-6 flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => onShiftWeek(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-[#f4f6fb]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">{currentWeek ? "This week" : "Week"}</p>
            <p className="text-xs text-muted">{formatWeekRange(weekStart)}</p>
          </div>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => onShiftWeek(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-[#f4f6fb]"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleViewAll}
          aria-pressed={viewAll}
          className={`mt-4 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold ${
            viewAll ? "bg-[#eef1ff] text-primary" : "text-ink hover:bg-[#f4f6fb]"
          }`}
        >
          Whole week
        </button>

        <div className="mt-2 flex flex-col gap-1">
          {weekDates(weekStart).map((date, index) => {
            const iso = toISODate(date);
            const selected = !viewAll && iso === selectedIso;
            const count = weekTasks.filter((task) => task.date === iso).length;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(date)}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-left ${
                  selected ? "bg-primary text-white" : "text-ink hover:bg-[#f4f6fb]"
                }`}
              >
                <span className={`w-9 text-xs font-semibold uppercase ${selected ? "text-white/80" : "text-muted"}`}>
                  {WEEKDAY_LABELS[index]}
                </span>
                <span className="text-base font-bold">{date.getDate()}</span>
                {iso === todayIso ? (
                  <span className={`text-[10px] font-semibold uppercase ${selected ? "text-white/80" : "text-primary"}`}>
                    Today
                  </span>
                ) : null}
                <span className={`ml-auto text-xs font-semibold ${selected ? "text-white/80" : "text-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <MiniStat
            label="Done"
            count={completed}
            tone="complete"
            active={statusFilter === "completed"}
            onClick={() => onStatusFilter(statusFilter === "completed" ? null : "completed")}
          />
          <MiniStat
            label="Open"
            count={open}
            tone="pending"
            active={statusFilter === "in_progress"}
            onClick={() => onStatusFilter(statusFilter === "in_progress" ? null : "in_progress")}
          />
        </div>
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted">
            <span>Weekly progress</span>
            <span>{percent}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e8ff]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Weekly completion"
          >
            <div className="h-full rounded-full bg-[#3146c8]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="flex flex-wrap items-center gap-4">
          <div className="min-w-[160px]">
            <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">{heading}</h1>
            <p className="mt-1 text-sm text-muted">
              {searching
                ? searchLoading
                  ? "Searching…"
                  : `${visible.length} result${visible.length === 1 ? "" : "s"}`
                : `${visible.length} task${visible.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative ml-auto w-full max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search title or description"
              aria-label="Search for a task"
              className="h-12 w-full rounded-2xl border border-transparent bg-white pr-10 pl-11 text-base text-ink shadow-sm outline-none placeholder:text-[#b0b6c4] focus:border-primary"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onQueryChange("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#98a2b3]"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-5 flex gap-2">
          {(
            [
              [null, "All"],
              ["in_progress", "Open"],
              ["completed", "Completed"],
            ] as const
          ).map(([value, label]) => {
            const active = statusFilter === value;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusFilter(active ? null : value)}
                className={`h-9 rounded-full px-4 text-sm font-semibold ${
                  active ? "bg-ink text-white" : "bg-white text-[#667085]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <section className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-3xl bg-white p-3 shadow-sm lg:p-5">
          {searchError ? <p className="px-3 py-8 text-center text-sm text-danger">{searchError}</p> : null}
          {!searchError && visible.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <p className="text-base font-semibold text-ink">
                {searching ? `No tasks match “${query.trim()}”` : "Nothing scheduled"}
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                {searching ? "Try another word from the title or description." : "Add a task for this day, or switch weeks."}
              </p>
              {!searching ? (
                <button
                  type="button"
                  onClick={onAdd}
                  className="mt-5 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
                >
                  Add task
                </button>
              ) : null}
            </div>
          ) : null}

          {!searchError && visible.length > 0 && viewAll && !searching ? (
            <>
              <div className="lg:hidden">
                <TaskList
                  tasks={visible}
                  todayIso={todayIso}
                  grouped
                  onToggle={onToggleStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpen={onOpen}
                />
              </div>
              <div className="hidden gap-3 lg:grid lg:grid-cols-7">
                {weekDates(weekStart).map((date, index) => {
                  const iso = toISODate(date);
                  const dayTasks = visible.filter((task) => task.date === iso);
                  return (
                    <div key={iso} className="min-w-0 rounded-2xl bg-[#f7f8fc] p-2">
                      <button type="button" onClick={() => onSelectDate(date)} className="w-full px-1 py-2 text-left">
                        <span className="block text-[11px] font-semibold tracking-wide text-muted uppercase">
                          {WEEKDAY_LABELS[index]}
                        </span>
                        <span className={`text-lg font-bold ${iso === todayIso ? "text-primary" : "text-ink"}`}>
                          {date.getDate()}
                        </span>
                      </button>
                      <div className="flex flex-col gap-2">
                        {dayTasks.map((task) => (
                          <WeekCard
                            key={task.id}
                            task={task}
                            onOpen={onOpen}
                            onToggle={onToggleStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {!searchError && visible.length > 0 && (!viewAll || searching) ? (
            <TaskList
              tasks={visible}
              todayIso={todayIso}
              grouped={searching || viewAll}
              onToggle={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function TaskList({
  tasks,
  todayIso,
  grouped,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
}: {
  tasks: Task[];
  todayIso: string;
  grouped: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  if (!grouped) {
    return (
      <div className="divide-y divide-[#f2f4f8]">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} wide onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  const dates = [...new Set(tasks.map((task) => task.date))];
  return (
    <div>
      {dates.map((date) => (
        <section key={date} className="mt-2">
          <h2 className="px-3 pt-3 text-xs font-semibold tracking-wide text-muted uppercase">
            {formatDayHeading(date, todayIso)}
          </h2>
          <div className="divide-y divide-[#f2f4f8]">
            {tasks
              .filter((task) => task.date === date)
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  wide
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpen={onOpen}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function WeekCard({
  task,
  onOpen,
  onToggle,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
}) {
  const completed = task.status === "completed";
  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm">
      <button type="button" onClick={() => onOpen(task)} className="w-full text-left">
        <span className={`block text-sm font-semibold ${completed ? "text-[#b0b6c4] line-through" : "text-ink"}`}>
          {task.title}
        </span>
        <span className="mt-1 block text-[11px] text-muted">
          {formatTaskWhen(task.startTime, task.endTime, task.priority)}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={`mt-2 text-[11px] font-semibold ${completed ? "text-primary" : "text-[#667085]"}`}
      >
        {completed ? "Completed" : "Mark done"}
      </button>
    </div>
  );
}

function MiniStat({
  label,
  count,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone: "complete" | "pending";
  active: boolean;
  onClick: () => void;
}) {
  const complete = tone === "complete";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl p-3 text-left ${complete ? "bg-complete" : "bg-pending"} ${active ? "ring-2 ring-primary" : ""}`}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md text-white ${complete ? "bg-primary" : "bg-[#ff6b6b]"}`}
        >
          {complete ? <CheckIcon className="h-3 w-3" /> : <CloseIcon className="h-3 w-3" />}
        </span>
        {label}
      </span>
      <span className="mt-2 block text-2xl font-bold text-ink">{String(count).padStart(2, "0")}</span>
    </button>
  );
}
