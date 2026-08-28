import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserNpPhoto, saveUserNpPhoto } from '@/lib/npStorage';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || currentUser.id;

    // SECURITY RESTRICTION: Users can ONLY access their own face photo from .np file
    if (targetUserId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Security Violation: Face photos (.np) cannot be accessed by other users.' },
        { status: 403 }
      );
    }

    const photoDataUrl = getUserNpPhoto(currentUser.id);
    if (!photoDataUrl) {
      return NextResponse.json({ error: 'Face photo not found' }, { status: 404 });
    }

    return NextResponse.json({ photoDataUrl });
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
    const { photoDataUrl } = body;

    if (!photoDataUrl) {
      return NextResponse.json({ error: 'photoDataUrl required' }, { status: 400 });
    }

    saveUserNpPhoto(currentUser.id, photoDataUrl);
    return NextResponse.json({ success: true, message: 'User photo saved securely as .np extension' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
