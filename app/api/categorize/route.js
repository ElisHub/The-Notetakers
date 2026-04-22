// app/api/categorize/route.js
// POST /api/categorize — ask the AI to suggest a folder for a note
// without actually saving anything. Useful for a "Suggest folder" button
// in the note editor.

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { suggestFolder } from '@/lib/ai';

export async function POST(request) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    const db = getDb();
    const folders = db
      .prepare('SELECT id, name FROM folders WHERE user_id = ?')
      .all(user.id);
    const folderNames = folders.map((f) => f.name);

    const { folder: suggestedName, reasoning } = await suggestFolder(
      title || '',
      content || '',
      folderNames
    );

    const match = folders.find((f) => f.name === suggestedName);
    return NextResponse.json({
      folderId: match?.id || null,
      folderName: suggestedName,
      reasoning,
    });
  } catch (err) {
    console.error('Categorize error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
