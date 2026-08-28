import { cookies } from 'next/headers';
import { getDb } from './db';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  biometric_registered: number;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('fauve_user_id')?.value;
  if (!userId) return null;

  const db = await getDb();
  const user = await db.get(
    'SELECT id, name, email, avatar, biometric_registered FROM users WHERE id = ?',
    [userId]
  ) as SessionUser | null;

  return user || null;
}
