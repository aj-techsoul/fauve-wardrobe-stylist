import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, credentialId } = body;

    const db = await getDb();

    if (action === 'register') {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Must be logged in to register biometrics' }, { status: 401 });
      }

      const credId = credentialId || `bio_cred_${currentUser.id}_${Date.now()}`;
      await db.run(
        'UPDATE users SET biometric_registered = 1, biometric_credential_id = ? WHERE id = ?',
        [credId, currentUser.id]
      );

      return NextResponse.json({ success: true, message: 'Biometrics (Face / Fingerprint) registered successfully' });
    } else if (action === 'login') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required for biometric authentication' }, { status: 400 });
      }

      const user = await db.get(
        'SELECT id, name, email, biometric_registered FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      if (!user.biometric_registered) {
        return NextResponse.json({ error: 'Biometric login is not setup for this user' }, { status: 400 });
      }

      const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
      response.cookies.set('fauve_user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    } else if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('fauve_user_id');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
