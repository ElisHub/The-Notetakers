// app/api/notes/route.js
// GET  /api/notes         — list all notes for the current user (with optional ?q= search)
// POST /api/notes         — create a new note (optionally with AI auto-categorization)

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { suggestFolder } from '@/lib/ai';

export async function GET(request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const folderId = searchParams.get('folder_id');

  const db = getDb();
  let sql = `
    SELECT n.id, n.title, n.content, n.folder_id, n.ai_suggested_folder,
           n.created_at, n.updated_at, f.name AS folder_name, f.color AS folder_color
    FROM notes n
    LEFT JOIN folders f ON f.id = n.folder_id
    WHERE n.user_id = ?
  `;
  const params = [user.id];

  // Optional: filter by folder
  if (folderId) {
    sql += ' AND n.folder_id = ?';
    params.push(folderId);
  }

  // Optional: search in title or content
  if (query) {
    sql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
    const like = `%${query}%`;
    params.push(like, like);
  }

  sql += ' ORDER BY n.updated_at DESC';

  const notes = db.prepare(sql).all(...params);
  return NextResponse.json({ notes });
}

export async function POST(request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { title, content, folderId, useAI } = await request.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const db = getDb();
    let resolvedFolderId = folderId || null;
    let aiSuggestion = null;

    // If user didn't pick a folder and asked for AI help, categorize via OpenAI
    if (!folderId && useAI) {
      const folders = db
        .prepare('SELECT id, name FROM folders WHERE user_id = ?')
        .all(user.id);
      const folderNames = folders.map((f) => f.name);

      const { folder: suggestedName, reasoning } = await suggestFolder(
        title,
        content || '',
        folderNames
      );
      aiSuggestion = `${suggestedName} (${reasoning})`;

      const match = folders.find((f) => f.name === suggestedName);
      if (match) {
        resolvedFolderId = match.id;
      }
    }

    const result = db
      .prepare(
        `INSERT INTO notes (user_id, folder_id, title, content, ai_suggested_folder)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(user.id, resolvedFolderId, title, content || '', aiSuggestion);

    return NextResponse.json({
      success: true,
      noteId: result.lastInsertRowid,
      aiSuggestion,
    });
  } catch (err) {
    console.error('Create note error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
