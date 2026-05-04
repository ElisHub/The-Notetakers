// app/api/auth/register/route.js
// POST /api/auth/register — create a new user account.

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, displayName } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create the user
    const passwordHash = await hashPassword(password);
    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)'
      )
      .run(email, passwordHash, displayName || email.split('@')[0]);

    const userId = result.lastInsertRowid;

    // Seed a few starter folders so the AI has something to classify into
    const seedFolders = ['Classes', 'Events', 'Personal', 'To-Do'];
    const insertFolder = db.prepare(
      'INSERT INTO folders (user_id, name) VALUES (?, ?)'
    );
    for (const name of seedFolders) {
      insertFolder.run(userId, name);
    }

    // Log the user in immediately
    const token = createToken(userId);
    setAuthCookie(token);

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
