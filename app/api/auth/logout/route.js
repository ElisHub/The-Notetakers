// app/api/auth/logout/route.js
// POST /api/auth/logout — clear the auth cookie.

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  clearAuthCookie();
  return NextResponse.json({ success: true });
}
