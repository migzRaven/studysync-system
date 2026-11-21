
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useTheme();

  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeSubject, setActiveSubject] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(null);

  const config = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  // Convert Tiptap HTML into readable plain text.
  const getPlainText = (html = '') => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get(
        'http://localhost:5000/api/subjects',
        config
      );

      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();

      if (activeSubject !== 'all') {
        params.set('subject', activeSubject);
      }

      if (showFavorites) {
        params.set('favorite', 'true');
      }

      const queryString = params.toString();
      const url = `http://localhost:5000/api/notes${
        queryString ? `?${queryString}` : ''
      }`;

      const { data } = await axios.get(url, config);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [activeSubject, showFavorites]);

  const handleAddSubject = async (e) => {
    e.preventDefault();

    if (!newSubjectName.trim()) return;

    try {
      const colors = [
        '#FF8A3D',
        '#6656E0',
        '#D64550',
        '#4CAF50',
        '#2196F3',
      ];

      const randomColor =
        colors[Math.floor(Math.random() * colors.length)];

      await axios.post(
        'http://localhost:5000/api/subjects',
        {
          name: newSubjectName.trim(),
          color: randomColor,
        },
        config
      );

      setNewSubjectName('');
      setShowAddSubject(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      alert(
        error.response?.data?.message ||
        'Unable to add subject.'
      );
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.name}"?\n\n` +
      'All notes saved under this subject will also be permanently deleted.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeletingSubject(subject._id);

      await axios.delete(
        `http://localhost:5000/api/subjects/${subject._id}`,
        config
      );

      setSubjects((previousSubjects) =>
        previousSubjects.filter(
          (sub) => sub._id !== subject._id
        )
      );

      setNotes((previousNotes) =>
        previousNotes.filter(
          (note) =>
            (note.subject?._id || note.subject) !== subject._id
        )
      );

      if (activeSubject === subject._id) {
        setActiveSubject('all');
      }

      alert(
        `"${subject.name}" and its notes have been deleted.`
      );
    } catch (error) {
      console.error('Error deleting subject:', error);

      alert(
        error.response?.data?.message ||
        'Unable to delete subject. Please try again.'
      );
    } finally {
      setDeletingSubject(null);
    }
  };

  // Search by title, readable content, or tags.
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();

    const titleMatch = note.title?.toLowerCase().includes(query);

    const contentMatch = getPlainText(note.content)
      .toLowerCase()
      .includes(query);

    const tagMatch = note.tags?.some((tag) =>
      tag.toLowerCase().includes(query)
    );

    return titleMatch || contentMatch || tagMatch;
  });

  return (
    <div className="min-h-screen flex bg-[#F3ECDF] dark:bg-[#171923] text-[#2B2A28] dark:text-gray-100 font-sans transition-colors duration-300">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#FFFDF9] dark:bg-[#202330] border-r border-[#E4D9C3] dark:border-gray-700 flex flex-col h-screen fixed transition-colors duration-300">

        {/* LOGO */}
        <div className="p-6 border-b border-[#E4D9C3] dark:border-gray-700">
          <h1 className="text-2xl font-bold text-[#6656E0]">
            StudySync
          </h1>
          <p className="text-xs text-[#6B655A] dark:text-gray-400 mt-1">
            Your Personal Study Space
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="p-4 border-b border-[#E4D9C3] dark:border-gray-700 flex gap-2">
          <button className="flex-1 bg-[#6656E0] text-white py-2 rounded-lg font-semibold text-sm">
            📝 Notes
          </button>

          <Link
            to="/planner"
            className="flex-1 bg-[#F3ECDF] dark:bg-[#303546] text-[#6B655A] dark:text-gray-300 hover:bg-[#E4D9C3] dark:hover:bg-[#3B4255] py-2 rounded-lg font-semibold text-sm text-center transition"
          >
            📅 Planner
          </Link>
        </div>

        {/* SUBJECT LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">

          <button
            onClick={() => {
              setActiveSubject('all');
              setShowFavorites(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeSubject === 'all' && !showFavorites
                ? 'bg-[#F3ECDF] dark:bg-[#303546] font-bold text-[#6656E0]'
                : 'hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
            }`}
          >
            📝 All Notes
          </button>

          {/* FAVORITES FILTER */}
          <button
            onClick={() => {
              setActiveSubject('all');
              setShowFavorites(true);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              showFavorites
                ? 'bg-[#F3ECDF] dark:bg-[#303546] font-bold text-[#6656E0]'
                : 'hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
            }`}
          >
            ⭐ Favorite Notes
          </button>

          {/* TRASH LINK */}
          <Link
            to="/trash"
            className="w-full text-left px-4 py-2 rounded-lg transition hover:bg-[#F3ECDF] dark:hover:bg-[#303546] flex items-center gap-2"
          >
            🗑️ Trash
          </Link>

          {/* SUBJECTS */}
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className={`flex items-center gap-1 rounded-lg transition ${
                activeSubject === sub._id
                  ? 'bg-[#F3ECDF] dark:bg-[#303546]'
                  : 'hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
              }`}
            >
              <button
                onClick={() => {
                  setActiveSubject(sub._id);
                  setShowFavorites(false);
                }}
                className={`flex-1 min-w-0 text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                  activeSubject === sub._id ? 'font-bold' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sub.color }}
                />

                <span className="truncate">
                  {sub.name}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSubject(sub)}
                disabled={deletingSubject === sub._id}
                title={`Delete ${sub.name}`}
                aria-label={`Delete ${sub.name}`}
                className="px-3 py-2 text-gray-400 hover:text-[#D64550] hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition disabled:opacity-50"
              >
                {deletingSubject === sub._id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                )}
              </button>
            </div>
          ))}

          {/* ADD SUBJECT */}
          {showAddSubject ? (
            <form onSubmit={handleAddSubject} className="mt-4">
              <input
                type="text"
                autoFocus
                placeholder="Subject name..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded mb-2 text-sm bg-white dark:bg-[#303546] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#6656E0]"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#6656E0] text-white py-1 rounded text-sm"
                >
                  Add
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubject(false);
                    setNewSubjectName('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddSubject(true)}
              className="w-full text-left px-4 py-2 text-sm text-[#6B655A] dark:text-gray-400 hover:text-[#6656E0] transition"
            >
              + Add Subject
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t border-[#E4D9C3] dark:border-gray-700">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-[#D64550] font-semibold hover:bg-[#F3ECDF] dark:hover:bg-[#303546] rounded-lg transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-8 gap-4">
          <input
            type="text"
            placeholder="Search notes by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-96 p-3 bg-[#FFFDF9] dark:bg-[#202330] border border-[#E4D9C3] dark:border-gray-700 text-[#2B2A28] dark:text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:border-[#6656E0] transition-colors"
          />

          <div className="flex items-center gap-3">

            {/* DARK MODE TOGGLE */}
            <button
              onClick={toggleTheme}
              type="button"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-12 h-12 flex items-center justify-center rounded-xl border border-[#E4D9C3] dark:border-gray-700 bg-[#FFFDF9] dark:bg-[#202330] hover:bg-[#F3ECDF] dark:hover:bg-[#303546] transition-all duration-300 shadow-sm"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.42 1.42" />
                  <path d="m17.65 17.65 1.42 1.42" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.35 17.65-1.42 1.42" />
                  <path d="m19.07 4.93-1.42 1.42" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6.5 6.5 0 0 0 8.268 8.268c.344-.215.825-.003.803.401" />
                </svg>
              )}
            </button>

            {/* NEW NOTE BUTTON */}
            <Link
              to="/note/new"
              className="bg-[#FF8A3D] text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-sm whitespace-nowrap"
            >
              + New Note
            </Link>
          </div>
        </header>

        {/* NOTES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#2B2A28] dark:text-gray-100">
              {showFavorites
                ? '⭐ Favorite Notes'
                : activeSubject === 'all'
                  ? 'All Notes'
                  : subjects.find(
                      (s) => s._id === activeSubject
                    )?.name || 'Notes'}
            </h2>

            <span className="text-sm text-[#6B655A] dark:text-gray-400">
              {filteredNotes.length}{' '}
              {filteredNotes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          {/* EMPTY STATE */}
          {filteredNotes.length === 0 ? (
            <div className="text-center text-[#6B655A] dark:text-gray-400 mt-20">
              <p className="text-4xl mb-4">
                {showFavorites ? '⭐' : '📭'}
              </p>
              <p>
                {searchQuery
                  ? 'No matching notes found.'
                  : showFavorites
                    ? 'You have no favorite notes yet.'
                    : 'No notes found. Create one to get started!'}
              </p>
            </div>
          ) : (

            /* NOTES GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {filteredNotes.map((note) => (
                <Link
                  to={`/note/${note._id}`}
                  key={note._id}
                  className="bg-[#FFFDF9] dark:bg-[#202330] p-6 rounded-xl border border-[#E4D9C3] dark:border-gray-700 shadow-sm hover:shadow-md transition transform hover:-rotate-1 relative block"
                  style={{
                    borderTop: `4px solid ${
                      note.subject?.color || '#6656E0'
                    }`,
                  }}
                >

                  {/* PINNED AND FAVORITE INDICATORS */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {note.isFavorite && (
                      <span
                        title="Favorite"
                        className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold"
                      >
                        ⭐
                      </span>
                    )}

                    {note.isPinned && (
                      <span className="flex items-center gap-1 bg-[#EEEAFE] dark:bg-[#38315C] text-[#6656E0] px-2 py-1 rounded-full text-xs font-bold">
                        📌 Pinned
                      </span>
                    )}
                  </div>

                  {/* NOTE TITLE */}
                  <h3
                    className={`font-bold text-lg mb-2 text-[#2B2A28] dark:text-gray-100 truncate ${
                      note.isPinned || note.isFavorite ? 'pr-20' : ''
                    }`}
                  >
                    {note.title}
                  </h3>

                  {/* NOTE CONTENT */}
                  <p className="text-[#6B655A] dark:text-gray-400 text-sm line-clamp-3 mb-4 whitespace-pre-line">
                    {getPlainText(note.content).slice(0, 180)}
                  </p>

                  {/* NOTE TAGS */}
                  {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-[#F3ECDF] dark:bg-[#303546] text-[#6656E0] px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* NOTE FOOTER */}
                  <div className="flex justify-between items-center text-xs text-[#6B655A] dark:text-gray-400 mt-auto gap-2">
                    <span className="font-semibold px-2 py-1 bg-[#F3ECDF] dark:bg-[#303546] rounded truncate">
                      {note.subject?.name || 'General'}
                    </span>

                    <span className="whitespace-nowrap">
                      {note.updatedAt
                        ? new Date(note.updatedAt).toLocaleDateString()
                        : ''}
                    </span>
                  </div>

                </Link>
              ))}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
