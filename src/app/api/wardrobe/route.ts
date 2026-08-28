import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Personal wardrobes
    const myWardrobes = await db.all(
      'SELECT * FROM wardrobes WHERE user_id = ? ORDER BY created_at DESC',
      [currentUser.id]
    );

    // Granted shared wardrobes (active permissions)
    const now = new Date().toISOString();
    const sharedAccess = await db.all(
      `SELECT w.*, u.name as owner_name, ar.granted_until 
       FROM access_requests ar 
       JOIN wardrobes w ON ar.wardrobe_id = w.id 
       JOIN users u ON w.user_id = u.id 
       WHERE ar.requester_id = ? AND ar.status = 'accepted' AND (ar.granted_until IS NULL OR ar.granted_until > ?)`,
      [currentUser.id, now]
    );

    // All available public / shareable wardrobes from other users for sending request
    const otherWardrobes = await db.all(
      `SELECT w.*, u.name as owner_name, u.email as owner_email,
       (SELECT status FROM access_requests WHERE requester_id = ? AND wardrobe_id = w.id) as request_status,
       (SELECT granted_until FROM access_requests WHERE requester_id = ? AND wardrobe_id = w.id) as granted_until
       FROM wardrobes w 
       JOIN users u ON w.user_id = u.id 
       WHERE w.user_id != ?`,
      [currentUser.id, currentUser.id, currentUser.id]
    );

    return NextResponse.json({
      myWardrobes,
      sharedAccess,
      otherWardrobes
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Wardrobe name required' }, { status: 400 });
    }

    const db = await getDb();
    const id = 'wdb_' + crypto.randomBytes(8).toString('hex');

    await db.run(
      'INSERT INTO wardrobes (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [id, currentUser.id, name, description || '']
    );

    return NextResponse.json({ success: true, wardrobe: { id, name, description } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
