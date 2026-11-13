"use client";

import { useEffect, useId } from "react";
import { formatLongDate, formatTaskWhen } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { CloseIcon } from "@/components/icons";

type TaskDetailProps = {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggle: (task: Task) => void;
};

export function TaskDetail({ task, onClose, onEdit, onDelete, onToggle }: TaskDetailProps) {
  const titleId = useId();
  const completed = task.status === "completed";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-[#1b1f2a]/45 md:items-center md:p-8 lg:justify-end lg:bg-[#1b1f2a]/25 lg:p-6">
      <button type="button" className="absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative mt-auto w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:mt-0 md:max-w-xl md:rounded-3xl md:p-8 lg:flex lg:h-full lg:max-w-[440px] lg:flex-col lg:justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink">
            {task.title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#98a0b3]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">{formatLongDate(task.date)}</p>
        <p className="mt-1 text-sm text-ink">{formatTaskWhen(task.startTime, task.endTime, task.priority)}</p>
        <p className="mt-3 inline-flex rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-semibold text-primary">
          {completed ? "Completed" : "In Progress"}
        </p>
        <p className="mt-4 min-h-12 text-sm leading-6 text-ink">
          {task.description || "No description"}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onToggle(task)}
            className="h-12 rounded-xl border border-[#e7e9f0] text-sm font-semibold text-ink"
          >
            {completed ? "Mark in progress" : "Mark completed"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="h-12 rounded-xl bg-primary text-sm font-semibold text-white"
          >
            Edit
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="mt-3 h-11 w-full text-sm font-semibold text-danger"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}
