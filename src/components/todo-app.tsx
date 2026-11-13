"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { parseISODate, startOfDay, startOfWeek, toISODate } from "@/lib/dates";
import type { Task, TaskStatus } from "@/lib/types";
import type { FieldErrors, TaskWrite } from "@/lib/validate";
import { HomeScreen } from "@/components/home-screen";
import { Onboarding } from "@/components/onboarding";
import { SearchScreen } from "@/components/search-screen";
import { TaskDetail } from "@/components/task-detail";
import { TaskForm } from "@/components/task-form";
import { Workspace } from "@/components/workspace";

const ONBOARD_KEY = "todo-onboarded";

type Boot = {
  onboarded: boolean;
  today: Date;
  weekStart: Date;
};

let bootSnapshot: Boot | null = null;
const bootListeners = new Set<() => void>();
let toastSerial = 0;

function nextToastId() {
  toastSerial += 1;
  return toastSerial;
}

function subscribeBoot(listener: () => void) {
  bootListeners.add(listener);
  return () => {
    bootListeners.delete(listener);
  };
}

function readBoot(): Boot {
  const onboarded = window.localStorage.getItem(ONBOARD_KEY) === "1";
  const today = bootSnapshot?.today ?? startOfDay(new Date());
  if (bootSnapshot && bootSnapshot.onboarded === onboarded) return bootSnapshot;
  bootSnapshot = { onboarded, today, weekStart: startOfWeek(today) };
  return bootSnapshot;
}

function markOnboarded() {
  window.localStorage.setItem(ONBOARD_KEY, "1");
  bootSnapshot = null;
  bootListeners.forEach((listener) => listener());
}

type Overlay = { type: "create" } | { type: "edit"; id: string } | { type: "detail"; id: string } | null;

type Toast = { id: number; message: string; undo?: () => void };

type ErrorBody = { error?: string; fields?: FieldErrors };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong") as Error & { fields?: FieldErrors };
    error.fields = data.fields;
    throw error;
  }
  return data;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title),
  );
}

export function TodoApp() {
  const boot = useSyncExternalStore(subscribeBoot, readBoot, () => null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState<"home" | "search">("home");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchNonce, setSearchNonce] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const todayIso = toISODate(startOfDay(new Date()));
    fetch(`/api/tasks?today=${todayIso}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { tasks?: Task[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Could not load tasks");
        setTasks(data.tasks ?? []);
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadError(error.message || "Could not load tasks");
        setTasks([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (screen !== "search" && query.trim() === "") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("today", toISODate(startOfDay(new Date())));
      const trimmed = query.trim();
      if (trimmed) params.set("q", trimmed);
      setSearchLoading(true);
      setSearchError("");
      fetch(`/api/tasks?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          const data = (await response.json()) as { tasks?: Task[]; error?: string };
          if (!response.ok) throw new Error(data.error || "Search failed");
          setSearchResults(data.tasks ?? []);
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return;
          setSearchError("Search failed. Try again.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [screen, query, searchNonce]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function rememberTask(task: Task) {
    setTasks((current) => sortTasks([...(current ?? []).filter((item) => item.id !== task.id), task]));
    setSearchResults((current) =>
      sortTasks([...current.filter((item) => item.id !== task.id), task]),
    );
    setSearchNonce((value) => value + 1);
  }

  function focusDate(iso: string) {
    const date = parseISODate(iso);
    setSelectedDate(date);
    setWeekStart(startOfWeek(date));
    setViewAll(false);
    setStatusFilter(null);
  }

  async function saveTask(value: TaskWrite): Promise<FieldErrors | null> {
    const editingId = overlay?.type === "edit" ? overlay.id : null;
    try {
      if (editingId) {
        const data = await request<{ task: Task }>(`/api/tasks/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(value),
        });
        rememberTask(data.task);
        focusDate(data.task.date);
      } else {
        const data = await request<{ task: Task }>("/api/tasks", {
          method: "POST",
          body: JSON.stringify(value),
        });
        rememberTask(data.task);
        focusDate(data.task.date);
      }
      setOverlay(null);
      setScreen("home");
      return null;
    } catch (error) {
      const fields = (error as Error & { fields?: FieldErrors }).fields;
      if (fields && Object.keys(fields).length > 0) return fields;
      throw error;
    }
  }

  async function toggleStatus(task: Task) {
    const status: TaskStatus = task.status === "completed" ? "in_progress" : "completed";
    const optimistic = { ...task, status };
    rememberTask(optimistic);
    try {
      const data = await request<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      rememberTask(data.task);
    } catch {
      rememberTask(task);
      setToast({ id: nextToastId(), message: "Couldn't update that task" });
    }
  }

  async function removeTask(task: Task) {
    setTasks((current) => (current ?? []).filter((item) => item.id !== task.id));
    setSearchResults((current) => current.filter((item) => item.id !== task.id));
    setOverlay((current) => (current && "id" in current && current.id === task.id ? null : current));
    try {
      await request(`/api/tasks/${task.id}`, { method: "DELETE" });
      setSearchNonce((value) => value + 1);
      setToast({
        id: nextToastId(),
        message: "Task deleted",
        undo: () => {
          void restoreTask(task);
        },
      });
    } catch {
      rememberTask(task);
      setToast({ id: nextToastId(), message: "Couldn't delete that task" });
    }
  }

  async function restoreTask(task: Task) {
    try {
      const data = await request<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          date: task.date,
          startTime: task.startTime,
          endTime: task.endTime,
          priority: task.priority,
          status: task.status,
        }),
      });
      rememberTask(data.task);
      setToast({ id: nextToastId(), message: "Task restored" });
    } catch {
      setToast({ id: nextToastId(), message: "Couldn't restore that task" });
    }
  }

  const editingTask =
    overlay?.type === "edit" ? (tasks ?? []).find((task) => task.id === overlay.id) ?? null : null;
  const detailTask =
    overlay?.type === "detail" ? (tasks ?? []).find((task) => task.id === overlay.id) ?? null : null;

  const today = boot?.today ?? null;
  const activeSelected = selectedDate ?? today;
  const activeWeek = weekStart ?? boot?.weekStart ?? null;

  let body: ReactNode;
  if (!boot || !today || !activeSelected || !activeWeek) {
    body = <HomeSkeleton />;
  } else if (!boot.onboarded) {
    body = null;
  } else if (tasks === null) {
    body = <HomeSkeleton />;
  } else if (loadError && tasks.length === 0) {
    body = (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <p className="text-base font-semibold text-ink">Tasks could not be loaded</p>
        <p className="mt-2 text-sm text-muted">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  } else if (screen === "search") {
    body = (
      <SearchScreen
        query={query}
        results={searchResults}
        loading={searchLoading}
        error={searchError}
        onQueryChange={(value) => {
          setQuery(value);
          setSearchLoading(true);
        }}
        onBack={() => setScreen("home")}
        onToggle={(task) => void toggleStatus(task)}
        onEdit={(task) => setOverlay({ type: "edit", id: task.id })}
        onDelete={(task) => void removeTask(task)}
        onOpen={(task) => setOverlay({ type: "detail", id: task.id })}
      />
    );
  } else {
    body = (
      <HomeScreen
        tasks={tasks}
        today={today}
        weekStart={activeWeek}
        selectedDate={activeSelected}
        viewAll={viewAll}
        statusFilter={statusFilter}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setViewAll(false);
          setStatusFilter(null);
        }}
        onShiftWeek={(delta) => {
          const index = Math.round((activeSelected.getTime() - activeWeek.getTime()) / 86_400_000);
          const nextStart = new Date(activeWeek);
          nextStart.setDate(nextStart.getDate() + delta * 7);
          const nextSelected = new Date(nextStart);
          nextSelected.setDate(nextStart.getDate() + Math.min(6, Math.max(0, index)));
          setWeekStart(nextStart);
          setSelectedDate(nextSelected);
          setStatusFilter(null);
        }}
        onToggleViewAll={() => {
          setViewAll((current) => !current);
          setStatusFilter(null);
        }}
        onStatusFilter={(status) => {
          setStatusFilter((current) => (current === status ? null : status));
          setViewAll(true);
        }}
        onToggleStatus={(task) => void toggleStatus(task)}
        onEdit={(task) => setOverlay({ type: "edit", id: task.id })}
        onDelete={(task) => void removeTask(task)}
        onOpen={(task) => setOverlay({ type: "detail", id: task.id })}
        onSearch={() => {
          setQuery("");
          setScreen("search");
        }}
        onAdd={() => setOverlay({ type: "create" })}
      />
    );
  }

  const showOnboarding = Boolean(boot && today && !boot.onboarded);
  const workspaceReady = Boolean(
    boot && today && activeSelected && activeWeek && tasks && !(loadError && tasks.length === 0),
  );

  return (
    <div className="min-h-dvh bg-background">
      {showOnboarding ? (
        <Onboarding onStart={markOnboarded} />
      ) : (
        <>
          <div className="md:hidden">
            <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-white shadow-[0_0_48px_rgba(20,24,40,0.06)]">
              {body}
            </div>
          </div>
          <div className="hidden md:block">
            {workspaceReady && today && activeSelected && activeWeek && tasks ? (
              <Workspace
                tasks={tasks}
                today={today}
                weekStart={activeWeek}
                selectedDate={activeSelected}
                viewAll={viewAll}
                statusFilter={statusFilter}
                query={query}
                searchResults={searchResults}
                searchLoading={searchLoading}
                searchError={searchError}
                onQueryChange={(value) => {
                  setQuery(value);
                  setSearchLoading(value.trim().length > 0);
                }}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setViewAll(false);
                  setStatusFilter(null);
                  setQuery("");
                  setSearchLoading(false);
                }}
                onShiftWeek={(delta) => {
                  const index = Math.round((activeSelected.getTime() - activeWeek.getTime()) / 86_400_000);
                  const nextStart = new Date(activeWeek);
                  nextStart.setDate(nextStart.getDate() + delta * 7);
                  const nextSelected = new Date(nextStart);
                  nextSelected.setDate(nextStart.getDate() + Math.min(6, Math.max(0, index)));
                  setWeekStart(nextStart);
                  setSelectedDate(nextSelected);
                  setStatusFilter(null);
                }}
                onToggleViewAll={() => {
                  setViewAll((current) => !current);
                  setStatusFilter(null);
                  setQuery("");
                  setSearchLoading(false);
                }}
                onStatusFilter={setStatusFilter}
                onToggleStatus={(task) => void toggleStatus(task)}
                onEdit={(task) => setOverlay({ type: "edit", id: task.id })}
                onDelete={(task) => void removeTask(task)}
                onOpen={(task) => setOverlay({ type: "detail", id: task.id })}
                onAdd={() => setOverlay({ type: "create" })}
              />
            ) : loadError && tasks && tasks.length === 0 ? (
              <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
                <p className="text-base font-semibold text-ink">Tasks could not be loaded</p>
                <p className="mt-2 text-sm text-muted">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : (
              <DesktopSkeleton />
            )}
          </div>
        </>
      )}
      {!showOnboarding && (overlay?.type === "create" || (overlay?.type === "edit" && editingTask)) ? (
        <TaskForm
          task={overlay.type === "edit" ? editingTask : null}
          defaultDate={activeSelected ? toISODate(activeSelected) : ""}
          onClose={() => setOverlay(null)}
          onSubmit={saveTask}
        />
      ) : null}
      {!showOnboarding && detailTask ? (
        <TaskDetail
          task={detailTask}
          onClose={() => setOverlay(null)}
          onEdit={(task) => setOverlay({ type: "edit", id: task.id })}
          onDelete={(task) => void removeTask(task)}
          onToggle={(task) => void toggleStatus(task)}
        />
      ) : null}
      {toast ? (
        <div
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-30 flex w-[min(100%-2rem,398px)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lg md:bottom-8 md:left-auto md:right-8 md:w-auto md:min-w-80 md:translate-x-0"
        >
          <span>{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              className="font-semibold text-[#c9d4ff]"
              onClick={() => {
                const undo = toast.undo;
                setToast(null);
                undo?.();
              }}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DesktopSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="w-[272px] animate-pulse border-r border-[#e7e9f2] bg-white lg:w-[300px]" />
      <div className="flex-1 p-8">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="mt-6 h-[70dvh] animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-dvh animate-pulse px-5 pt-6">
      <div className="h-12 rounded-2xl bg-[#f2f4f8]" />
      <div className="mt-6 h-16 rounded-2xl bg-[#f2f4f8]" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-[#eef1ff]" />
        <div className="h-28 rounded-2xl bg-[#fdeeee]" />
      </div>
      <div className="mt-6 h-3 rounded-full bg-[#e4e8ff]" />
      <div className="mt-8 space-y-4">
        <div className="h-12 rounded-xl bg-[#f2f4f8]" />
        <div className="h-12 rounded-xl bg-[#f2f4f8]" />
        <div className="h-12 rounded-xl bg-[#f2f4f8]" />
      </div>
    </div>
  );
}
