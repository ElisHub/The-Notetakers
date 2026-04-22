// app/api/folders/route.js
// GET  /api/folders — list all folders for the current user
// POST /api/folders — create a new folder

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  // Include a note count for each folder (handy for the sidebar UI)
  const folders = db
    .prepare(
      `SELECT f.id, f.name, f.color,
              (SELECT COUNT(*) FROM notes n WHERE n.folder_id = f.id) AS note_count
       FROM folders f
       WHERE f.user_id = ?
       ORDER BY f.name`
    )
    .all(user.id);

  return NextResponse.json({ folders });
}

export async function POST(request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { name, color } = await request.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO folders (user_id, name, color) VALUES (?, ?, ?)')
      .run(user.id, name.trim(), color || '#6b8e6b');

    return NextResponse.json({ success: true, folderId: result.lastInsertRowid });
  } catch (err) {
    console.error('Create folder error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
