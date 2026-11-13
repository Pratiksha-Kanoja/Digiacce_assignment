import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addDays, isISODate, parseISODate, startOfWeek, toISODate } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { endTimeError, type TaskWrite } from "@/lib/validate";

const DATA_PATH = path.join(process.cwd(), "data", "tasks.json");

let memory: Task[] | null = null;
let canPersist = true;
let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title),
  );
}

function matchesQuery(task: Task, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    task.title.toLowerCase().includes(needle) ||
    task.description.toLowerCase().includes(needle)
  );
}

function makeTask(
  input: TaskWrite,
  date: string,
  now: string,
): Task {
  return {
    id: crypto.randomUUID(),
    ...input,
    date,
    createdAt: now,
    updatedAt: now,
  };
}

function createSeed(todayIso: string): Task[] {
  const today = isISODate(todayIso) ? parseISODate(todayIso) : new Date();
  const weekStart = startOfWeek(today);
  const todayKey = toISODate(today);
  const now = new Date().toISOString();

  const dayInWeek = (index: number) => toISODate(addDays(weekStart, index));
  const anotherDay = (preferred: number) => {
    for (let step = 0; step < 7; step += 1) {
      const iso = dayInWeek((preferred + step) % 7);
      if (iso !== todayKey) return iso;
    }
    return todayKey;
  };

  const base = {
    description: "",
    endTime: "",
    priority: null,
    status: "in_progress" as const,
  };

  const drafts: TaskWrite[] = [
    {
      ...base,
      title: "Finishing Wireframe",
      description: "Complete the mobile wireframe for the home and task screens.",
      date: todayKey,
      startTime: "09:00",
      endTime: "11:00",
      priority: "high",
      status: "in_progress",
    },
    {
      ...base,
      title: "Meeting with team",
      description: "Weekly sync on the to-do app milestones.",
      date: todayKey,
      startTime: "13:00",
      endTime: "14:00",
      priority: "medium",
      status: "in_progress",
    },
    {
      ...base,
      title: "Buy a cat food",
      description: "Pick up food on the way home.",
      date: todayKey,
      startTime: "16:30",
      endTime: "17:00",
      priority: "low",
      status: "completed",
    },
    {
      ...base,
      title: "Finishing daily commission",
      description: "Wrap up the illustration commission before evening.",
      date: todayKey,
      startTime: "18:00",
      endTime: "19:00",
      priority: "medium",
      status: "completed",
    },
    {
      ...base,
      title: "Doing Homework",
      description: "Chapter 4 exercises.",
      date: anotherDay(0),
      startTime: "10:00",
      endTime: "12:00",
      priority: "high",
      status: "in_progress",
    },
    {
      ...base,
      title: "Plan next sprint",
      description: "Write the task list for next week's build.",
      date: anotherDay(3),
      startTime: "15:00",
      endTime: "16:00",
      priority: "medium",
      status: "in_progress",
    },
    {
      ...base,
      title: "Submit assignment draft",
      description: "Send the draft for review.",
      date: toISODate(addDays(weekStart, -5)),
      startTime: "11:00",
      endTime: "12:30",
      priority: "high",
      status: "completed",
    },
    {
      ...base,
      title: "Call landlord",
      description: "Ask about the weekend maintenance window.",
      date: toISODate(addDays(weekStart, -3)),
      startTime: "09:30",
      endTime: "10:00",
      priority: null,
      status: "in_progress",
    },
    {
      ...base,
      title: "Team retrospective",
      description: "Collect notes before the retro.",
      date: toISODate(addDays(weekStart, 9)),
      startTime: "14:00",
      endTime: "15:00",
      priority: "low",
      status: "in_progress",
    },
  ];

  return drafts.map((draft) => makeTask(draft, draft.date, now));
}

async function persist(tasks: Task[]) {
  memory = tasks;
  if (!canPersist) return;
  try {
    await mkdir(path.dirname(DATA_PATH), { recursive: true });
    await writeFile(DATA_PATH, JSON.stringify(tasks, null, 2));
  } catch {
    canPersist = false;
  }
}

async function readOrSeed(todayIso?: string): Promise<Task[]> {
  if (!canPersist && memory) return memory;

  try {
    const raw = await readFile(DATA_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Task store is not a list");
    memory = parsed as Task[];
    return memory;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code && code !== "ENOENT" && memory) return memory;
    const seed = createSeed(todayIso && isISODate(todayIso) ? todayIso : toISODate(new Date()));
    await persist(seed);
    return seed;
  }
}

export function listTasks(query = "", todayIso?: string): Promise<Task[]> {
  return withLock(async () => {
    const tasks = await readOrSeed(todayIso);
    return sortTasks(tasks.filter((task) => matchesQuery(task, query)));
  });
}

export function getTask(id: string): Promise<Task | null> {
  return withLock(async () => {
    const tasks = await readOrSeed();
    return tasks.find((task) => task.id === id) ?? null;
  });
}

export function createTask(input: TaskWrite): Promise<Task> {
  return withLock(async () => {
    const tasks = await readOrSeed();
    const now = new Date().toISOString();
    const task = makeTask(input, input.date, now);
    await persist([...tasks, task]);
    return task;
  });
}

export function updateTask(
  id: string,
  patch: Partial<TaskWrite>,
): Promise<{ task: Task } | { missing: true } | { error: string; field: "endTime" }> {
  return withLock(async () => {
    const tasks = await readOrSeed();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return { missing: true };

    const current = tasks[index];
    const next: Task = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const timeError = endTimeError(next.startTime, next.endTime);
    if (timeError) return { error: timeError, field: "endTime" };

    const copy = tasks.slice();
    copy[index] = next;
    await persist(copy);
    return { task: next };
  });
}

export function deleteTask(id: string): Promise<boolean> {
  return withLock(async () => {
    const tasks = await readOrSeed();
    const next = tasks.filter((task) => task.id !== id);
    if (next.length === tasks.length) return false;
    await persist(next);
    return true;
  });
}
