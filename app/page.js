// app/page.js
// Landing page — simple welcome screen with links to log in or sign up.

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-light text-sage-700 mb-4">The Collective</h1>
        <p className="text-lg text-sage-500 mb-2">
          Notetaking that organizes itself.
        </p>
        <p className="text-sm text-gray-500 mb-10 leading-relaxed">
          A calm, distraction-free space to capture notes for classes, events, and
          daily life — with an AI assistant that files things in the right place
          so you don&apos;t have to.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-sage-500 hover:bg-sage-700 text-white rounded-lg transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-sage-200 hover:bg-sage-50 text-sage-700 rounded-lg transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="mt-16 text-xs text-gray-400">
          Built by The Notetakers · Karissa, Landon, Denhem, Elijah, Maxwell
        </p>
      </div>
    </main>
  );
}
