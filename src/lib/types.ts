export const PRIORITIES = ["low", "medium", "high"] as const;
export const STATUSES = ["in_progress", "completed"] as const;

export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof STATUSES)[number];

export type Task = {
  id: string;
  title: string;
  description: string;
  /** Calendar date in the user's local timezone, YYYY-MM-DD. */
  date: string;
  /** 24-hour start time, HH:mm. */
  startTime: string;
  /** 24-hour end time, HH:mm. Empty when the task has no end. */
  endTime: string;
  priority: Priority | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};
