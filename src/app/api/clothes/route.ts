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

    const { searchParams } = new URL(request.url);
    const wardrobeId = searchParams.get('wardrobeId');

    const db = await getDb();

    if (wardrobeId) {
      // Check access permission to this wardrobe
      const wardrobe = await db.get('SELECT * FROM wardrobes WHERE id = ?', [wardrobeId]);
      if (!wardrobe) {
        return NextResponse.json({ error: 'Wardrobe not found' }, { status: 404 });
      }

      if (wardrobe.user_id !== currentUser.id) {
        const now = new Date().toISOString();
        const access = await db.get(
          `SELECT id FROM access_requests 
           WHERE requester_id = ? AND wardrobe_id = ? AND status = 'accepted' 
           AND (granted_until IS NULL OR granted_until > ?)`,
          [currentUser.id, wardrobeId, now]
        );
        if (!access) {
          return NextResponse.json({ error: 'Access denied to this wardrobe' }, { status: 403 });
        }
      }

      const clothes = await db.all('SELECT * FROM clothes WHERE wardrobe_id = ? ORDER BY created_at DESC', [wardrobeId]);
      return NextResponse.json({ clothes });
    } else {
      // Return clothes across ALL accessible wardrobes (personal + shared)
      const now = new Date().toISOString();
      const clothes = await db.all(
        `SELECT c.*, w.name as wardrobe_name, u.name as owner_name, u.id as owner_id
         FROM clothes c
         JOIN wardrobes w ON c.wardrobe_id = w.id
         JOIN users u ON w.user_id = u.id
         WHERE w.user_id = ? 
         OR w.id IN (
           SELECT wardrobe_id FROM access_requests 
           WHERE requester_id = ? AND status = 'accepted' AND (granted_until IS NULL OR granted_until > ?)
         )
         ORDER BY c.created_at DESC`,
        [currentUser.id, currentUser.id, now]
      );
      return NextResponse.json({ clothes });
    }
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
    const { wardrobeId, category, name, size, color, imageData, bgRemoved } = body;

    if (!wardrobeId || !category || !name || !size || !imageData) {
      return NextResponse.json({ error: 'Missing required item fields' }, { status: 400 });
    }

    const db = await getDb();
    const wardrobe = await db.get('SELECT user_id FROM wardrobes WHERE id = ?', [wardrobeId]);
    if (!wardrobe || wardrobe.user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized wardrobe upload' }, { status: 403 });
    }

    const id = 'clt_' + crypto.randomBytes(8).toString('hex');
    await db.run(
      `INSERT INTO clothes (id, wardrobe_id, category, name, size, color, image_data, bg_removed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, wardrobeId, category, name, size, color || 'Neutral', imageData, bgRemoved ? 1 : 0]
    );

    return NextResponse.json({ success: true, item: { id, name, category, size } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const db = await getDb();
    const item = await db.get(
      'SELECT c.id FROM clothes c JOIN wardrobes w ON c.wardrobe_id = w.id WHERE c.id = ? AND w.user_id = ?',
      [id, currentUser.id]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await db.run('DELETE FROM clothes WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
