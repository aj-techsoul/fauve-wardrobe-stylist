import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { saveUserNpPhoto } from '@/lib/npStorage';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, photoDataUrl } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    await db.run(
      'INSERT INTO users (id, name, email, password_hash, biometric_registered) VALUES (?, ?, ?, ?, 0)',
      [userId, name, email, passwordHash]
    );

    // Save default wardrobe
    const wardrobeId = 'wdb_' + crypto.randomBytes(8).toString('hex');
    await db.run(
      'INSERT INTO wardrobes (id, user_id, name, description, is_default) VALUES (?, ?, ?, ?, 1)',
      [wardrobeId, userId, `${name}'s Closet`, 'Main personal wardrobe']
    );

    // Save user's face photo in usrnp/{{userid}}.np if provided
    if (photoDataUrl) {
      saveUserNpPhoto(userId, photoDataUrl);
    }

    const response = NextResponse.json({ success: true, user: { id: userId, name, email } });
    response.cookies.set('fauve_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
