"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { parseCreate, type FieldErrors, type TaskWrite } from "@/lib/validate";
import { CalendarIcon, ClockIcon, CloseIcon } from "@/components/icons";

type TaskFormProps = {
  task: Task | null;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (value: TaskWrite) => Promise<FieldErrors | null>;
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskForm({ task, defaultDate, onClose, onSubmit }: TaskFormProps) {
  const titleId = useId();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [date, setDate] = useState(task?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(task?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(task?.endTime ?? "");
  const [priority, setPriority] = useState<Priority | null>(task?.priority ?? null);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "in_progress");
  const [fields, setFields] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: TaskWrite = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      priority,
      status,
    };
    const parsed = parseCreate(payload);
    if ("error" in parsed) {
      setFields(parsed.fields);
      setFormError(parsed.error);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const serverFields = await onSubmit(parsed.data);
      if (serverFields) {
        setFields(serverFields);
        setFormError("Please fix the highlighted fields");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-[#1b1f2a]/45 md:items-center md:p-8 lg:justify-end lg:bg-[#1b1f2a]/25 lg:p-6">
      <button type="button" className="absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative mt-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-2xl md:mt-0 md:max-h-[85dvh] md:max-w-xl md:rounded-3xl lg:h-full lg:max-h-none lg:max-w-[440px]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink">
            {task ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#98a0b3]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Field label="Task title" error={fields.title}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Doing Homework"
              aria-label="Task title"
              maxLength={120}
              autoFocus
              className={inputClass(Boolean(fields.title))}
            />
          </Field>

          <Field label="Set Time" error={fields.startTime || fields.endTime}>
            <div className="grid grid-cols-2 gap-3">
              <PickerField
                invalid={Boolean(fields.startTime)}
                icon={<ClockIcon className="h-4 w-4 text-[#a0a8b8]" />}
                inputType="time"
                value={startTime}
                ariaLabel="Start time"
                onChange={setStartTime}
              />
              <PickerField
                invalid={Boolean(fields.endTime)}
                icon={<ClockIcon className="h-4 w-4 text-[#a0a8b8]" />}
                inputType="time"
                value={endTime}
                ariaLabel="End time"
                allowClear
                onChange={setEndTime}
              />
            </div>
          </Field>

          <Field label="Set Date" error={fields.date}>
            <PickerField
              invalid={Boolean(fields.date)}
              icon={<CalendarIcon className="h-[18px] w-[18px] text-[#98a0b3]" />}
              inputType="date"
              value={date}
              ariaLabel="Date"
              onChange={setDate}
            />
          </Field>

          <Field label="Priority" error={fields.priority}>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const selected = priority === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPriority(selected ? null : option.value)}
                    className={`h-10 flex-1 rounded-xl border text-sm font-semibold ${priorityClass(option.value, selected)}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Status">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["in_progress", "In Progress"],
                  ["completed", "Completed"],
                ] as const
              ).map(([value, label]) => {
                const selected = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStatus(value)}
                    className={`h-10 rounded-xl border text-sm font-semibold ${
                      selected
                        ? "border-primary bg-[#eef1ff] text-primary"
                        : "border-[#e7e9f0] text-[#667085]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Description" error={fields.description}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add Description"
              aria-label="Description"
              rows={4}
              maxLength={1000}
              className={`${inputClass(Boolean(fields.description))} min-h-28 resize-none py-3`}
            />
          </Field>

          {formError ? <p className="mt-3 text-sm text-danger">{formError}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 h-12 w-full rounded-xl bg-primary text-base font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : task ? "Save changes" : "Create task"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <span className="mb-2 block text-sm text-[#98a0b3]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </div>
  );
}

function PickerField({
  invalid,
  icon,
  inputType,
  value,
  ariaLabel,
  onChange,
  allowClear = false,
}: {
  invalid: boolean;
  icon: ReactNode;
  inputType: "time" | "date";
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
}) {
  return (
    <div
      className={`flex h-12 items-center gap-2 rounded-xl border px-3 ${
        invalid ? "border-danger" : "border-[#e7e9f0]"
      }`}
    >
      <span className="pointer-events-none shrink-0">{icon}</span>
      <input
        type={inputType}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="picker-input min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
      />
      {allowClear && value ? (
        <button
          type="button"
          aria-label={`Clear ${ariaLabel.toLowerCase()}`}
          onClick={() => onChange("")}
          className="shrink-0 text-[#98a0b3]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `h-12 w-full rounded-xl border bg-white px-3 text-base text-ink outline-none placeholder:text-[#c5cad6] ${
    invalid ? "border-danger" : "border-[#e7e9f0] focus:border-primary"
  }`;
}

function priorityClass(priority: Priority, selected: boolean) {
  if (!selected) return "border-[#e7e9f0] text-[#667085]";
  if (priority === "high") return "border-[#f3b4b4] bg-[#fdeeee] text-[#d64545]";
  if (priority === "medium") return "border-[#f3d7a1] bg-[#fff6e8] text-[#b7791f]";
  return "border-[#bfe3cf] bg-[#eefaf3] text-[#1f8a5b]";
}
