import type { NextRequest } from 'next/server';
import type RouteContext from 'next';
import { getGatewayUrl } from '@/lib/gateway';
import { getStoredToken } from '@/lib/session';

export async function handler(
  request: NextRequest,
  ctx: RouteContext<'/api/proxy/[...path]'>,
) {
  const token = await getStoredToken();
  if (!token) {
    return new Response(JSON.stringify({ message: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { path } = await ctx.params;
  const slug = Array.isArray(path) ? path : [path];

  const url = new URL(request.url);
  const upstreamUrl = `${getGatewayUrl(`/${slug.join('/')}`)}${url.search}`;

  const method = request.method;
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  let body: string | undefined;
  if (hasBody) {
    body = await request.text();
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return new Response(
      JSON.stringify({ message: 'No se pudo conectar con el api-gateway' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const payload = await upstream.arrayBuffer();
  const upstreamContentType =
    upstream.headers.get('content-type') ?? 'application/json';

  return new Response(payload, {
    status: upstream.status,
    headers: { 'Content-Type': upstreamContentType },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;