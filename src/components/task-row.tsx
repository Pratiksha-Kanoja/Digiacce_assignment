"use client";

import { useRef, useState, type PointerEvent } from "react";
import { formatTaskWhen } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/icons";

type TaskRowProps = {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
  wide?: boolean;
};

const DELETE_WIDTH = 84;

export function TaskRow({ task, onToggle, onEdit, onDelete, onOpen, wide = false }: TaskRowProps) {
  const completed = task.status === "completed";
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const offsetRef = useRef(0);
  const moved = useRef(false);
  const tracking = useRef(false);

  function updateOffset(value: number) {
    offsetRef.current = value;
    setOffset(value);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-no-swipe]")) return;
    tracking.current = true;
    moved.current = false;
    startX.current = event.clientX;
    startY.current = event.clientY;
    startOffset.current = offsetRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!tracking.current) return;
    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;
    if (!moved.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        tracking.current = false;
        return;
      }
      moved.current = true;
      setDragging(true);
    }
    const next = Math.min(0, Math.max(-DELETE_WIDTH - 24, startOffset.current + deltaX));
    updateOffset(next);
  }

  function finishPointer() {
    if (!tracking.current) return;
    tracking.current = false;
    setDragging(false);
    if (!moved.current) return;
    updateOffset(offsetRef.current < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0);
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <button
        type="button"
        className="absolute inset-y-0 right-0 w-[84px] bg-danger text-sm font-semibold text-white"
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
        onClick={() => onDelete(task)}
      >
        Delete
      </button>
      <div
        className={`relative flex items-center gap-3 bg-white py-3.5 ${dragging ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <button
          type="button"
          data-no-swipe
          role="checkbox"
          aria-checked={completed}
          aria-label={completed ? `Mark ${task.title} in progress` : `Mark ${task.title} completed`}
          onClick={() => onToggle(task)}
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border ${
            completed ? "border-primary bg-primary text-white" : "border-[#d5d9e4] bg-white text-transparent"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (moved.current) {
              moved.current = false;
              return;
            }
            if (offsetRef.current < 0) {
              updateOffset(0);
              return;
            }
            onOpen(task);
          }}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={`block truncate text-[15px] font-medium ${
              completed ? "text-[#b0b6c4] line-through" : "text-ink"
            }`}
          >
            {task.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {formatTaskWhen(task.startTime, task.endTime, task.priority)}
          </span>
          {wide && task.description ? (
            <span className="mt-1 block truncate text-sm text-[#667085]">{task.description}</span>
          ) : null}
        </button>
        <button
          type="button"
          data-no-swipe
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#a0a8b8]"
        >
          <TrashIcon className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          data-no-swipe
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#a0a8b8]"
        >
          <PencilIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
