import { API_BASE_URL } from '@/config/api';
import type { AppUser } from '@/types/user';
import type { Reminder, ReminderTag } from '@/types/reminder';

const JSON_SERVER_OFFLINE_MSG =
  'Nao foi possivel conectar ao json-server. Na pasta do app, rode "npm run server" (porta 3001). Em celular Android fisico, defina EXPO_PUBLIC_JSON_SERVER_URL com o IP da sua maquina.';

function isLikelyNetworkFailure(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error && /Network request failed|Failed to fetch|Load failed|network error/i.test(e.message)) {
    return true;
  }
  return false;
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    if (isLikelyNetworkFailure(e)) throw new Error(JSON_SERVER_OFFLINE_MSG);
    throw e;
  }
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await safeFetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`json-server respondeu com erro HTTP ${res.status}.`);
  return parseBody<T>(res);
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await safeFetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`json-server respondeu com erro HTTP ${res.status}.`);
  return parseBody<T>(res);
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await safeFetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`json-server respondeu com erro HTTP ${res.status}.`);
  return parseBody<T>(res);
}

type UserRow = { id: number; email: string; password: string; name: string };

export async function loginWithEmailPassword(email: string, password: string): Promise<AppUser> {
  const normalized = email.trim().toLowerCase();
  const rows = await apiGet<UserRow[]>(`/users?email=${encodeURIComponent(email.trim())}`);
  const u = rows.find((r) => r.email.trim().toLowerCase() === normalized);
  if (!u || u.password !== password) throw new Error('Credenciais invalidas.');
  return { id: String(u.id), email: u.email, name: u.name };
}

export async function registerUser(name: string, email: string, password: string): Promise<AppUser> {
  const trimmedEmail = email.trim();
  const normalized = trimmedEmail.toLowerCase();
  const existing = await apiGet<UserRow[]>(`/users?email=${encodeURIComponent(trimmedEmail)}`);
  if (existing.some((r) => r.email.trim().toLowerCase() === normalized)) {
    throw new Error('Email ja cadastrado.');
  }
  const created = await apiPost<UserRow>('/users', {
    name: name.trim(),
    email: trimmedEmail,
    password,
  });
  return { id: String(created.id), email: created.email, name: created.name };
}

type ReminderRow = {
  id: number | string;
  userId: number | string;
  description: string;
  scheduledAt: string;
  completed: boolean;
  tag?: ReminderTag | null;
  commentCount?: number;
  attachmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function mapReminderRow(r: ReminderRow): Reminder {
  return {
    id: String(r.id),
    userId: String(r.userId),
    description: r.description,
    scheduledAt: new Date(r.scheduledAt),
    completed: Boolean(r.completed),
    tag: r.tag ?? undefined,
    commentCount: r.commentCount ?? 0,
    attachmentCount: r.attachmentCount ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function fetchRemindersForUser(userId: string): Promise<Reminder[]> {
  const rows = await apiGet<ReminderRow[]>('/reminders');
  const mine = rows.filter((r) => String(r.userId) === userId);
  const sorted = [...mine].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );
  return sorted.map(mapReminderRow);
}

export async function fetchReminderById(id: string): Promise<ReminderRow | null> {
  try {
    return await apiGet<ReminderRow>(`/reminders/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function createReminder(payload: {
  userId: string;
  description: string;
  scheduledAtIso: string;
}): Promise<void> {
  await apiPost('/reminders', {
    userId: Number(payload.userId),
    description: payload.description,
    scheduledAt: payload.scheduledAtIso,
    completed: false,
    commentCount: 0,
    attachmentCount: 0,
    tag: { name: 'Geral', color: '#8B5CF6' },
    createdAt: new Date().toISOString(),
  });
}

export async function updateReminder(
  id: string,
  payload: {
    description: string;
    scheduledAtIso: string;
    completed: boolean;
  }
): Promise<void> {
  await apiPatch(`/reminders/${encodeURIComponent(id)}`, {
    description: payload.description,
    scheduledAt: payload.scheduledAtIso,
    completed: payload.completed,
    updatedAt: new Date().toISOString(),
  });
}

export async function patchReminderCompleted(id: string, completed: boolean): Promise<void> {
  await apiPatch(`/reminders/${encodeURIComponent(id)}`, {
    completed,
    updatedAt: new Date().toISOString(),
  });
}
