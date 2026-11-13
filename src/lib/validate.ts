import { isISODate } from "@/lib/dates";
import { PRIORITIES, STATUSES, type Priority, type TaskStatus } from "@/lib/types";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type FieldErrors = Partial<
  Record<"title" | "description" | "date" | "startTime" | "endTime" | "priority" | "status", string>
>;

export type TaskWrite = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: Priority | null;
  status: TaskStatus;
};

export type ParseResult<T> = { data: T } | { error: string; fields: FieldErrors };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

function readTime(value: unknown): { ok: true; time: string } | { ok: false } {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) return { ok: false };
  return { ok: true, time: value };
}

export function parseCreate(body: unknown): ParseResult<TaskWrite> {
  const record = asRecord(body);
  if (!record) return { error: "Invalid request body", fields: {} };

  const fields: FieldErrors = {};
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) fields.title = "Title is required";
  else if (title.length > TITLE_MAX) fields.title = `Keep the title under ${TITLE_MAX} characters`;

  const description = typeof record.description === "string" ? record.description.trim() : "";
  if (description.length > DESCRIPTION_MAX) {
    fields.description = `Keep the description under ${DESCRIPTION_MAX} characters`;
  }

  const date = typeof record.date === "string" ? record.date : "";
  if (!isISODate(date)) fields.date = "Choose a date";

  const start = readTime(record.startTime);
  if (!start.ok) fields.startTime = "Start time is required";

  let endTime = "";
  if (typeof record.endTime === "string" && record.endTime.length > 0) {
    const end = readTime(record.endTime);
    if (!end.ok) fields.endTime = "Enter a valid end time";
    else if (start.ok && end.time <= start.time) fields.endTime = "End time must be after the start time";
    else endTime = end.ok ? end.time : "";
  }

  let priority: Priority | null = null;
  if (record.priority != null && record.priority !== "") {
    if (!isPriority(record.priority)) fields.priority = "Choose a priority";
    else priority = record.priority;
  }

  let status: TaskStatus = "in_progress";
  if (record.status != null && record.status !== "") {
    if (!isStatus(record.status)) fields.status = "Choose a status";
    else status = record.status;
  }

  if (Object.keys(fields).length > 0) {
    return { error: "Please fix the highlighted fields", fields };
  }

  return {
    data: {
      title,
      description,
      date,
      startTime: start.ok ? start.time : "",
      endTime,
      priority,
      status,
    },
  };
}

export function parsePatch(body: unknown): ParseResult<Partial<TaskWrite>> {
  const record = asRecord(body);
  if (!record) return { error: "Invalid request body", fields: {} };

  const fields: FieldErrors = {};
  const patch: Partial<TaskWrite> = {};

  if ("title" in record) {
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) fields.title = "Title is required";
    else if (title.length > TITLE_MAX) fields.title = `Keep the title under ${TITLE_MAX} characters`;
    else patch.title = title;
  }

  if ("description" in record) {
    const description = typeof record.description === "string" ? record.description.trim() : "";
    if (description.length > DESCRIPTION_MAX) {
      fields.description = `Keep the description under ${DESCRIPTION_MAX} characters`;
    } else patch.description = description;
  }

  if ("date" in record) {
    const date = typeof record.date === "string" ? record.date : "";
    if (!isISODate(date)) fields.date = "Choose a date";
    else patch.date = date;
  }

  if ("startTime" in record) {
    const start = readTime(record.startTime);
    if (!start.ok) fields.startTime = "Start time is required";
    else patch.startTime = start.time;
  }

  if ("endTime" in record) {
    if (record.endTime == null || record.endTime === "") patch.endTime = "";
    else {
      const end = readTime(record.endTime);
      if (!end.ok) fields.endTime = "Enter a valid end time";
      else patch.endTime = end.time;
    }
  }

  if ("priority" in record) {
    if (record.priority == null || record.priority === "") patch.priority = null;
    else if (!isPriority(record.priority)) fields.priority = "Choose a priority";
    else patch.priority = record.priority;
  }

  if ("status" in record) {
    if (!isStatus(record.status)) fields.status = "Choose a status";
    else patch.status = record.status;
  }

  if (Object.keys(patch).length === 0 && Object.keys(fields).length === 0) {
    return { error: "No changes to save", fields: {} };
  }

  if (Object.keys(fields).length > 0) {
    return { error: "Please fix the highlighted fields", fields };
  }

  return { data: patch };
}

export function endTimeError(startTime: string, endTime: string): string | null {
  if (endTime && endTime <= startTime) return "End time must be after the start time";
  return null;
}
