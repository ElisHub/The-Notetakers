// lib/auth.js
// Authentication helpers: password hashing, JWT creation, and session lookup.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const COOKIE_NAME = 'collective_session';
const TOKEN_TTL = '7d';

// Hash a plaintext password for storage.
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verify a plaintext password against a stored hash.
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Issue a signed JWT for a user id.
export function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Set the auth cookie on the response (called from route handlers).
export function setAuthCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear the auth cookie (for logout).
export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

// Get the currently authenticated user, or null if no valid session.
// Use this at the top of any API route that requires auth.
export function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, display_name FROM users WHERE id = ?')
      .get(userId);
    return user || null;
  } catch {
    // Invalid or expired token
    return null;
  }
}
