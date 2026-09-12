export function getGatewayUrl(path: string): string {
  const base = (process.env.API_GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}${path}`;
}

export async function gatewayJson<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(getGatewayUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return {
      status: 502,
      data: { message: 'No se pudo conectar con el api-gateway' } as T,
    };
  }

  const text = await response.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = { message: text != null ? String(text) : '' } as T;
  }
  return { status: response.status, data };
}