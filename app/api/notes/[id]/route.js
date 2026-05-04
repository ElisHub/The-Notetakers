// app/api/notes/[id]/route.js
// GET    /api/notes/:id — fetch a single note
// PUT    /api/notes/:id — update a note
// DELETE /api/notes/:id — delete a note

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const note = db
    .prepare(
      `SELECT n.*, f.name AS folder_name
       FROM notes n LEFT JOIN folders f ON f.id = n.folder_id
       WHERE n.id = ? AND n.user_id = ?`
    )
    .get(params.id, user.id);

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json({ note });
}

export async function PUT(request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { title, content, folderId } = await request.json();
    const db = getDb();

    // Verify ownership before updating
    const existing = db
      .prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?')
      .get(params.id, user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    db.prepare(
      `UPDATE notes
       SET title = ?, content = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`
    ).run(title, content || '', folderId || null, params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update note error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const result = db
    .prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .run(params.id, user.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
