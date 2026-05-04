// app/api/auth/login/route.js
// POST /api/auth/login — authenticate an existing user.

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db
      .prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .get(email);

    // Intentionally use the same error message for both wrong-email and
    // wrong-password cases to avoid leaking which accounts exist.
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken(user.id);
    setAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
