import { NextResponse } from 'next/server';
import { gatewayJson } from '@/lib/gateway';
import { createSession, setUserCookie } from '@/lib/session';
import { extractErrorMessage } from '@/lib/api';
import { tokenMaxAge } from '@/lib/token-age';
import type { AuthResponse, SessionUser } from '@/lib/types';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: 'Email y contraseña son obligatorios' },
      { status: 400 },
    );
  }

  const { status, data } = await gatewayJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email: body.email, password: body.password },
  });

  if (status !== 201 && status !== 200) {
    return NextResponse.json({ message: extractErrorMessage(data) }, { status });
  }

  const user: SessionUser = {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.fullName,
  };
  const maxAge = await tokenMaxAge(data.accessToken);

  await createSession(data.accessToken, maxAge);
  await setUserCookie(user, maxAge);

  return NextResponse.json({ user });
}