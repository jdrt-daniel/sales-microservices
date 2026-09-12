import type { AuthResponse, SessionUser } from './types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const GATEWAY_BASE = '/api/proxy';

export function extractErrorMessage(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const anyData = data as { message?: unknown };
    if (Array.isArray(anyData.message)) {
      return anyData.message.join(', ');
    }
    if (typeof anyData.message === 'string') return anyData.message;
  }
  return 'Ocurrió un error inesperado';
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(data));
  }
  return data as T;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${GATEWAY_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return parseResponse<T>(res);
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse<AuthResponse>(res);
  return data.user;
}

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<SessionUser> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const parsed = await parseResponse<AuthResponse>(res);
  return parsed.user;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/session', { method: 'GET' });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: SessionUser };
  return data.user ?? null;
}