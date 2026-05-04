// app/notes/page.js
// Main notes interface — three-pane layout:
//   Left:   folder sidebar + search
//   Middle: list of notes
//   Right:  note editor with AI categorization button
//
// All state lives here and flows down; children are stateless where possible.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesPage() {
  const router = useRouter();

  // Core app state
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState(''); // feedback when AI suggests a folder
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  // --- Initial load: check auth, fetch folders & notes ---
  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) {
        router.push('/login');
        return;
      }
      setUser(meData.user);
      await Promise.all([loadFolders(), loadNotes()]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Data fetchers ---
  const loadFolders = useCallback(async () => {
    const res = await fetch('/api/folders');
    const data = await res.json();
    setFolders(data.folders || []);
  }, []);

  const loadNotes = useCallback(
    async (folderId = null, query = '') => {
      const params = new URLSearchParams();
      if (folderId) params.set('folder_id', folderId);
      if (query) params.set('q', query);
      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    },
    []
  );

  // Reload notes whenever the filter or search changes
  useEffect(() => {
    if (!loading) loadNotes(selectedFolderId, searchQuery);
  }, [selectedFolderId, searchQuery, loadNotes, loading]);

  // --- Handlers ---
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  async function handleCreateNote() {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Untitled note',
        content: '',
        folderId: selectedFolderId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      await loadNotes(selectedFolderId, searchQuery);
      // Fetch the newly-created note to open in the editor
      const noteRes = await fetch(`/api/notes/${data.noteId}`);
      const noteData = await noteRes.json();
      setSelectedNote(noteData.note);
    }
  }

  async function handleSaveNote(updates) {
    if (!selectedNote) return;
    const merged = { ...selectedNote, ...updates };
    setSelectedNote(merged);

    // Debounced save would be nicer in production; for a prototype we save on every change
    await fetch(`/api/notes/${selectedNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: merged.title,
        content: merged.content,
        folderId: merged.folder_id,
      }),
    });
    await loadNotes(selectedFolderId, searchQuery);
    await loadFolders(); // folder counts may have changed
  }

  async function handleDeleteNote() {
    if (!selectedNote) return;
    if (!confirm('Delete this note?')) return;

    await fetch(`/api/notes/${selectedNote.id}`, { method: 'DELETE' });
    setSelectedNote(null);
    await loadNotes(selectedFolderId, searchQuery);
    await loadFolders();
  }

  async function handleAICategorize() {
    if (!selectedNote) return;
    setAiStatus('Asking the AI...');

    const res = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selectedNote.title,
        content: selectedNote.content,
      }),
    });
    const data = await res.json();

    if (data.folderId) {
      await handleSaveNote({ folder_id: data.folderId });
      setAiStatus(`Filed under "${data.folderName}" — ${data.reasoning}`);
    } else {
      setAiStatus(`Suggested "${data.folderName}" but folder not found.`);
    }
    setTimeout(() => setAiStatus(''), 6000);
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    setNewFolderName('');
    setShowNewFolder(false);
    await loadFolders();
  }

  // --- Render ---
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sage-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="h-screen flex bg-warm-50">
      {/* ---------- Left sidebar: folders ---------- */}
      <aside className="w-64 border-r border-sage-100 bg-white flex flex-col">
        <div className="p-4 border-b border-sage-100">
          <h2 className="text-lg text-sage-700 font-light">The Collective</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hi, {user?.display_name || user?.email}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedFolderId === null
                ? 'bg-sage-100 text-sage-700'
                : 'text-gray-600 hover:bg-sage-50'
            }`}
          >
            All notes ({notes.length})
          </button>

          <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wider text-gray-400">
            Folders
          </div>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedFolderId === folder.id
                  ? 'bg-sage-100 text-sage-700'
                  : 'text-gray-600 hover:bg-sage-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
                {folder.name}
              </span>
              <span className="text-xs text-gray-400">{folder.note_count}</span>
            </button>
          ))}

          {/* New folder form */}
          {showNewFolder ? (
            <div className="mt-2 px-3">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setShowNewFolder(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="Folder name"
                className="w-full px-2 py-1 text-sm border border-sage-200 rounded outline-none focus:border-sage-500"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full text-left px-3 py-2 mt-2 rounded-lg text-sm text-gray-400 hover:bg-sage-50 hover:text-sage-700"
            >
              + New folder
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-sage-100">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-sage-700"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ---------- Middle pane: note list ---------- */}
      <section className="w-80 border-r border-sage-100 bg-warm-50 flex flex-col">
        <div className="p-4 border-b border-sage-100 bg-white">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg outline-none focus:border-sage-500"
          />
          <button
            onClick={handleCreateNote}
            className="w-full mt-3 py-2 bg-sage-500 hover:bg-sage-700 text-white rounded-lg text-sm transition-colors"
          >
            + New note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {searchQuery
                ? 'No notes match your search.'
                : 'No notes yet. Create your first one above.'}
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={async () => {
                  const res = await fetch(`/api/notes/${note.id}`);
                  const data = await res.json();
                  setSelectedNote(data.note);
                }}
                className={`w-full text-left p-4 border-b border-sage-100 hover:bg-white transition-colors ${
                  selectedNote?.id === note.id ? 'bg-white' : ''
                }`}
              >
                <div className="font-medium text-sage-700 text-sm truncate">
                  {note.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {note.content || 'No content yet...'}
                </div>
                {note.folder_name && (
                  <div className="mt-2 inline-block px-2 py-0.5 bg-sage-50 text-sage-700 text-xs rounded">
                    {note.folder_name}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {/* ---------- Right pane: editor ---------- */}
      <section className="flex-1 flex flex-col bg-white">
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-sage-100 flex items-center justify-between gap-4">
              <select
                value={selectedNote.folder_id || ''}
                onChange={(e) =>
                  handleSaveNote({ folder_id: e.target.value || null })
                }
                className="px-3 py-1 text-sm border border-sage-200 rounded-lg bg-white outline-none"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleAICategorize}
                  className="px-3 py-1 text-sm bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-lg transition-colors"
                  title="Let the AI suggest a folder based on this note's content"
                >
                  ✨ AI categorize
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {aiStatus && (
              <div className="px-6 py-2 bg-sage-50 text-sage-700 text-sm border-b border-sage-100">
                {aiStatus}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleSaveNote({ title: e.target.value })}
                className="w-full text-3xl font-light text-sage-700 outline-none mb-6 bg-transparent"
                placeholder="Untitled note"
              />
              <textarea
                value={selectedNote.content || ''}
                onChange={(e) => handleSaveNote({ content: e.target.value })}
                className="w-full h-full text-gray-700 outline-none resize-none bg-transparent leading-relaxed"
                placeholder="Start writing..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Select a note or create a new one</p>
              <p className="text-sm">Your thoughts, organized automatically.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
