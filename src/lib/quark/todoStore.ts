export interface Task {
  id: string;
  title: string;
  properties: Record<string, any>;
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Complete project proposal',
    properties: {
      status: 'In Progress',
      department: 'Design',
      priority: 'High',
      dueDate: new Date().toISOString(),
      assignee: 'John',
    },
    timeFrame: 'daily',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review quarterly goals',
    properties: {
      status: 'To Do',
      department: 'Operations',
      priority: 'Medium',
      dueDate: null,
      assignee: 'Sarah',
    },
    timeFrame: 'weekly',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'notion-tasks';
const subscribers = new Set<(tasks: Task[]) => void>();
let cache: Task[] | null = null;

const cloneTask = (task: Task): Task => ({
  ...task,
  properties: { ...task.properties },
});

const notify = (tasks: Task[]) => {
  const snapshot = tasks.map(cloneTask);
  subscribers.forEach((listener) => listener(snapshot));
};

const persist = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Swallow storage errors (e.g., quota exceeded).
  }
};

const loadFromStorage = (): Task[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((task) => ({
        ...task,
        properties: { ...(task.properties ?? {}) },
      }));
    }
  } catch {
    // Ignore parse errors.
  }
  return null;
};

const ensureCache = (): Task[] => {
  if (!cache) {
    const stored = loadFromStorage();
    cache = stored?.map(cloneTask) ?? INITIAL_TASKS.map(cloneTask);
  }
  return cache;
};

const setTasks = (tasks: Task[]) => {
  const normalized = tasks.map(cloneTask);
  cache = normalized;
  persist(normalized);
  notify(normalized);
};

export const getTasks = (): Task[] => ensureCache().map(cloneTask);

export const updateTaskList = (updater: (tasks: Task[]) => Task[]): Task[] => {
  const base = getTasks();
  const next = updater(base.map(cloneTask));
  setTasks(next);
  return next;
};

export const subscribeTasks = (listener: (tasks: Task[]) => void): (() => void) => {
  subscribers.add(listener);
  listener(getTasks());
  return () => {
    subscribers.delete(listener);
  };
};

