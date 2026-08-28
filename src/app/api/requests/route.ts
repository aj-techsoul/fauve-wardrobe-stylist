import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// GET requests: pending requests for wardrobes owned by current user & user's sent requests
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Requests received as owner
    const incomingRequests = await db.all(
      `SELECT ar.*, u.name as requester_name, u.email as requester_email, w.name as wardrobe_name
       FROM access_requests ar
       JOIN users u ON ar.requester_id = u.id
       JOIN wardrobes w ON ar.wardrobe_id = w.id
       WHERE ar.owner_id = ? AND ar.status = 'pending'
       ORDER BY ar.created_at DESC`,
      [currentUser.id]
    );

    // Requests sent by user
    const outgoingRequests = await db.all(
      `SELECT ar.*, u.name as owner_name, w.name as wardrobe_name
       FROM access_requests ar
       JOIN users u ON ar.owner_id = u.id
       JOIN wardrobes w ON ar.wardrobe_id = w.id
       WHERE ar.requester_id = ?
       ORDER BY ar.created_at DESC`,
      [currentUser.id]
    );

    return NextResponse.json({ incomingRequests, outgoingRequests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Request access to a wardrobe
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { wardrobeId } = body;

    if (!wardrobeId) {
      return NextResponse.json({ error: 'Wardrobe ID required' }, { status: 400 });
    }

    const db = await getDb();
    const wardrobe = await db.get('SELECT id, user_id FROM wardrobes WHERE id = ?', [wardrobeId]);

    if (!wardrobe) {
      return NextResponse.json({ error: 'Wardrobe not found' }, { status: 404 });
    }

    if (wardrobe.user_id === currentUser.id) {
      return NextResponse.json({ error: 'You already own this wardrobe' }, { status: 400 });
    }

    const existing = await db.get(
      'SELECT id, status FROM access_requests WHERE requester_id = ? AND wardrobe_id = ?',
      [currentUser.id, wardrobeId]
    );

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Request is already pending owner review' }, { status: 400 });
      }
      // Update existing request back to pending
      await db.run(
        'UPDATE access_requests SET status = "pending", created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [existing.id]
      );
      return NextResponse.json({ success: true, message: 'Access request re-sent successfully' });
    }

    const id = 'req_' + crypto.randomBytes(8).toString('hex');
    await db.run(
      'INSERT INTO access_requests (id, requester_id, owner_id, wardrobe_id, status) VALUES (?, ?, ?, ?, "pending")',
      [id, currentUser.id, wardrobe.user_id, wardrobeId]
    );

    return NextResponse.json({ success: true, message: 'Access request sent to wardrobe owner' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Accept, Reject, or Limit access duration (hours / days)
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, durationHours } = body; // action: 'accept', 'reject', 'limit'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action required' }, { status: 400 });
    }

    const db = await getDb();
    const req = await db.get('SELECT owner_id FROM access_requests WHERE id = ?', [requestId]);

    if (!req || req.owner_id !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized request management' }, { status: 403 });
    }

    if (action === 'reject') {
      await db.run('UPDATE access_requests SET status = "rejected", granted_until = NULL WHERE id = ?', [requestId]);
      return NextResponse.json({ success: true, message: 'Wardrobe access rejected' });
    }

    let grantedUntil: string | null = null;
    if (action === 'limit' && durationHours && durationHours > 0) {
      const expiry = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      grantedUntil = expiry.toISOString();
    }

    await db.run(
      'UPDATE access_requests SET status = "accepted", granted_until = ? WHERE id = ?',
      [grantedUntil, requestId]
    );

    return NextResponse.json({
      success: true,
      message: grantedUntil
        ? `Access granted for ${durationHours} hour(s)`
        : 'Unlimited access granted'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
