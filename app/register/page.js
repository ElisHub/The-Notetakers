// app/register/page.js
// Registration form — creates an account and redirects to /notes.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push('/notes');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sage-500 text-sm hover:underline">
          ← Back
        </Link>

        <h1 className="text-3xl font-light text-sage-700 mt-6 mb-2">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Start organizing your notes in under a minute.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-sage-700 mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-sage-200 rounded-lg bg-white focus:border-sage-500 outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm text-sage-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-sage-200 rounded-lg bg-white focus:border-sage-500 outline-none"
              placeholder="you@school.edu"
            />
          </div>

          <div>
            <label className="block text-sm text-sage-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-sage-200 rounded-lg bg-white focus:border-sage-500 outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sage-500 hover:bg-sage-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-sage-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
