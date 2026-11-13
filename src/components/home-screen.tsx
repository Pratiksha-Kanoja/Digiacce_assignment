"use client";

import type { ReactNode } from "react";
import {
  addDays,
  formatDayHeading,
  formatWeekRange,
  startOfWeek,
  toISODate,
  WEEKDAY_LABELS,
  weekDates,
} from "@/lib/dates";
import type { Task, TaskStatus } from "@/lib/types";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { TaskRow } from "@/components/task-row";

type HomeScreenProps = {
  tasks: Task[];
  today: Date;
  weekStart: Date;
  selectedDate: Date;
  viewAll: boolean;
  statusFilter: TaskStatus | null;
  onSelectDate: (date: Date) => void;
  onShiftWeek: (delta: number) => void;
  onToggleViewAll: () => void;
  onStatusFilter: (status: TaskStatus) => void;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
  onSearch: () => void;
  onAdd: () => void;
};

export function HomeScreen({
  tasks,
  today,
  weekStart,
  selectedDate,
  viewAll,
  statusFilter,
  onSelectDate,
  onShiftWeek,
  onToggleViewAll,
  onStatusFilter,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpen,
  onSearch,
  onAdd,
}: HomeScreenProps) {
  const todayIso = toISODate(today);
  const selectedIso = toISODate(selectedDate);
  const weekEnd = toISODate(addDays(weekStart, 6));
  const weekStartIso = toISODate(weekStart);
  const currentWeek = toISODate(startOfWeek(today)) === weekStartIso;

  const weekTasks = tasks.filter((task) => task.date >= weekStartIso && task.date <= weekEnd);
  const completed = weekTasks.filter((task) => task.status === "completed").length;
  const open = weekTasks.length - completed;
  const percent = weekTasks.length === 0 ? 0 : Math.round((completed / weekTasks.length) * 100);

  const visible = (viewAll ? weekTasks : weekTasks.filter((task) => task.date === selectedIso)).filter(
    (task) => !statusFilter || task.status === statusFilter,
  );

  const heading = viewAll
    ? statusFilter === "completed"
      ? "Completed"
      : statusFilter === "in_progress"
        ? "Open tasks"
        : currentWeek
          ? "This week"
          : formatWeekRange(weekStart)
    : selectedIso === todayIso
      ? "Tasks Today"
      : formatDayHeading(selectedIso, todayIso);

  return (
    <div className="min-h-dvh bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28">
      <button
        type="button"
        onClick={onSearch}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#eceef3] px-4 text-left text-[15px] text-[#b0b6c4] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      >
        Search for a task
        <SearchIcon className="h-5 w-5 text-[#98a2b3]" />
      </button>

      <div className="mt-4 flex items-center justify-between">
        <IconButton label="Previous week" onClick={() => onShiftWeek(-1)}>
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink">{currentWeek ? "This week" : "Selected week"}</p>
          <p className="text-xs text-muted">{formatWeekRange(weekStart)}</p>
        </div>
        <IconButton label="Next week" onClick={() => onShiftWeek(1)}>
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="mt-3 flex">
        {weekDates(weekStart).map((date, index) => {
          const selected = toISODate(date) === selectedIso;
          return (
            <button
              key={toISODate(date)}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={selected}
              aria-label={`${WEEKDAY_LABELS[index]} ${date.getDate()}`}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[11px] font-medium text-muted">{WEEKDAY_LABELS[index]}</span>
              <span
                className={`flex h-12 w-10 flex-col items-center justify-center rounded-xl ${
                  selected ? "bg-primary text-white" : "text-ink"
                }`}
              >
                <span className="text-[15px] font-semibold leading-none">{date.getDate()}</span>
                {selected ? <span className="mt-1 h-1 w-1 rounded-full bg-white" /> : <span className="mt-1 h-1 w-1" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryCard
          label="Task Complete"
          count={completed}
          active={statusFilter === "completed"}
          tone="complete"
          onClick={() => onStatusFilter("completed")}
        />
        <SummaryCard
          label="Task Pending"
          count={open}
          active={statusFilter === "in_progress"}
          tone="pending"
          onClick={() => onStatusFilter("in_progress")}
        />
      </div>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink">Weekly Progress</h2>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-[#e4e8ff]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Weekly completion"
        >
          <div className="h-full rounded-full bg-[#3146c8] transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{heading}</h2>
        <button type="button" onClick={onToggleViewAll} className="text-sm font-semibold text-primary">
          {viewAll ? "Show day" : "View All"}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-sm leading-6 text-muted">
          {statusFilter === "completed"
            ? "No completed tasks this week."
            : statusFilter === "in_progress"
              ? "No open tasks this week."
              : viewAll
                ? "Nothing scheduled this week."
                : "Nothing scheduled for this day."}
          <span className="mt-1 block">Tap + to add a task.</span>
        </p>
      ) : viewAll ? (
        <WeekGroups
          tasks={visible}
          todayIso={todayIso}
          onToggle={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      ) : (
        <div className="mt-1 divide-y divide-[#f2f4f8]">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Add task"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_28px_rgba(78,110,245,0.45)] transition active:scale-95"
      >
        <PlusIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

function WeekGroups({
  tasks,
  todayIso,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
}: {
  tasks: Task[];
  todayIso: string;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  const dates = [...new Set(tasks.map((task) => task.date))];
  return (
    <div className="mt-2">
      {dates.map((date) => (
        <section key={date} className="mt-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            {formatDayHeading(date, todayIso)}
          </h3>
          <div className="divide-y divide-[#f2f4f8]">
            {tasks
              .filter((task) => task.date === date)
              .map((task) => (
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
        </section>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone: "complete" | "pending";
  onClick: () => void;
}) {
  const complete = tone === "complete";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl p-4 text-left ${complete ? "bg-complete" : "bg-pending"} ${
        active ? "ring-2 ring-primary" : ""
      }`}
    >
      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${
            complete ? "bg-primary" : "bg-[#ff6b6b]"
          }`}
        >
          {complete ? <CheckIcon className="h-4 w-4" /> : <CloseIcon className="h-3.5 w-3.5" />}
        </span>
        {label}
      </span>
      <span className="mt-3 flex items-end gap-2">
        <span className="text-[32px] leading-none font-bold tracking-tight text-ink">
          {String(count).padStart(2, "0")}
        </span>
        <span className="mb-1 text-xs font-medium text-muted">This Week</span>
      </span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
    >
      {children}
    </button>
  );
}
