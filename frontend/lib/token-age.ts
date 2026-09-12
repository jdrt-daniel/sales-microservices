import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET ?? 'default-secret';
const encodedKey = new TextEncoder().encode(secretKey);

export async function tokenMaxAge(token: string): Promise<number> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    if (payload.exp) {
      return Math.max(60, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // token no verificable: se usa el gateway como fuente de verdad
  }
  return 24 * 60 * 60;
}