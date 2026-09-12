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
    fullName?: string;
  } | null;

  if (!body?.email || !body.password || !body.fullName) {
    return NextResponse.json(
      { message: 'Email, contraseña y nombre completo son obligatorios' },
      { status: 400 },
    );
  }

  const { status, data } = await gatewayJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: {
      email: body.email,
      password: body.password,
      fullName: body.fullName,
    },
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