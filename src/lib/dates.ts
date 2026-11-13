import type { Priority } from "@/lib/types";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Weeks start on Monday and end on Sunday. */
export function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const weekday = next.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  next.setDate(next.getDate() + mondayOffset);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function weekDates(weekStart: Date): Date[] {
  return WEEKDAY_LABELS.map((_, index) => addDays(weekStart, index));
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth && weekStart.getFullYear() === end.getFullYear()) {
    return `${weekStart.getDate()} – ${end.getDate()} ${endMonth}`;
  }
  return `${weekStart.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
}

export function formatLongDate(iso: string): string {
  const date = parseISODate(iso);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday} ${date.getDate()}, ${month}`;
}

export function formatDayHeading(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Today";
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeLabel(value: string): string {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatTaskWhen(
  startTime: string,
  endTime: string,
  priority: Priority | null,
): string {
  const time = endTime
    ? `${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`
    : formatTimeLabel(startTime);
  if (!priority) return time;
  return `${time} · ${priority[0].toUpperCase()}${priority.slice(1)}`;
}
