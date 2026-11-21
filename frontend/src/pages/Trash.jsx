
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api/notes';

export default function Trash() {
  const { user, logout } = useContext(AuthContext);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const config = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  // Fetch deleted notes
  const fetchTrash = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await axios.get(
        `${API_URL}?trash=true`,
        config
      );

      setNotes(data);
    } catch (err) {
      console.error('Error fetching Trash:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load your Trash. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTrash();
    }
  }, [user?.token]);

  // Convert rich-text HTML into readable text
  const getPlainText = (html = '') => {
    const doc = new DOMParser().parseFromString(
      html,
      'text/html'
    );

    return doc.body.textContent || '';
  };

  // Restore a deleted note
  const handleRestore = async (note) => {
    try {
      setActionLoading(note._id);

      await axios.put(
        `${API_URL}/${note._id}/restore`,
        {},
        config
      );

      setNotes((previous) =>
        previous.filter((item) => item._id !== note._id)
      );
    } catch (err) {
      console.error('Error restoring note:', err);

      alert(
        err.response?.data?.message ||
        'Unable to restore this note.'
      );
    } finally {
      setActionLoading('');
    }
  };

  // Permanently delete an individual note
  const handlePermanentDelete = async (note) => {
    const confirmed = window.confirm(
      `Permanently delete "${note.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(note._id);

      await axios.delete(
        `${API_URL}/${note._id}/permanent`,
        config
      );

      setNotes((previous) =>
        previous.filter((item) => item._id !== note._id)
      );
    } catch (err) {
      console.error('Error deleting note:', err);

      alert(
        err.response?.data?.message ||
        'Unable to permanently delete this note.'
      );
    } finally {
      setActionLoading('');
    }
  };

  // Permanently delete all notes in Trash
  const handleEmptyTrash = async () => {
    if (notes.length === 0 || actionLoading !== '') return;

    const confirmed = window.confirm(
      `Permanently delete all ${notes.length} notes in Trash?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading('empty');

      await axios.delete(
        `${API_URL}/trash/empty`,
        config
      );

      setNotes([]);
      alert('Trash has been emptied.');
    } catch (err) {
      console.error('Error emptying Trash:', err);

      alert(
        err.response?.data?.message ||
        'Unable to empty Trash.'
      );
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F2EB] dark:bg-[#171923] text-[#2B2A28] dark:text-gray-100 font-sans transition-colors duration-300">

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
          <Link
            to="/"
            className="flex-1 bg-[#F3ECDF] dark:bg-[#303546] text-[#6B655A] dark:text-gray-300 hover:bg-[#E4D9C3] dark:hover:bg-[#3B4255] py-2 rounded-lg font-semibold text-sm text-center transition"
          >
            📝 Notes
          </Link>

          <Link
            to="/planner"
            className="flex-1 bg-[#F3ECDF] dark:bg-[#303546] text-[#6B655A] dark:text-gray-300 hover:bg-[#E4D9C3] dark:hover:bg-[#3B4255] py-2 rounded-lg font-semibold text-sm text-center transition"
          >
            📅 Planner
          </Link>
        </div>

        {/* SIDEBAR LINKS */}
        <div className="flex-1 p-4 space-y-2">

          <Link
            to="/"
            className="block px-4 py-2 rounded-lg text-[#6B655A] dark:text-gray-300 hover:bg-[#F3ECDF] dark:hover:bg-[#303546] transition"
          >
            📝 All Notes
          </Link>

          <Link
            to="/"
            className="block px-4 py-2 rounded-lg text-[#6B655A] dark:text-gray-300 hover:bg-[#F3ECDF] dark:hover:bg-[#303546] transition"
          >
            ⭐ Favorite Notes
          </Link>

          <Link
            to="/trash"
            className="block px-4 py-2 rounded-lg bg-[#F3ECDF] dark:bg-[#38315C] text-[#6656E0] font-bold"
          >
            🗑️ Trash
          </Link>

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
        <header className="flex flex-wrap justify-between items-center gap-5 mb-10">

          <div>
            <h2 className="text-3xl font-bold text-[#111827] dark:text-gray-100">
              🗑️ Trash
            </h2>

            <p className="text-[#6B7280] dark:text-gray-400 mt-2">
              Deleted notes stay here until you restore or permanently delete them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* RETURN BUTTON */}
            <Link
              to="/"
              className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
            >
              Return
            </Link>

            {/* EMPTY TRASH BUTTON */}
            <button
              onClick={handleEmptyTrash}
              disabled={notes.length === 0 || actionLoading !== ''}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {actionLoading === 'empty'
                ? 'Emptying...'
                : 'Empty Trash'}
            </button>

          </div>
        </header>

        {/* SECTION HEADER */}
        <div className="flex items-center justify-between mb-5">

          <h3 className="text-xl font-bold text-[#111827] dark:text-gray-100">
            Deleted Notes
          </h3>

          <span className="text-sm text-[#6B7280] dark:text-gray-400">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>

        </div>

        {/* LOADING STATE */}
        {loading ? (

          <div className="bg-white dark:bg-[#202330] rounded-xl shadow-sm border border-[#EAE7E0] dark:border-gray-700 min-h-[350px] flex items-center justify-center transition-colors">
            <p className="text-[#6B7280] dark:text-gray-400">
              Loading Trash...
            </p>
          </div>

        ) : error ? (

          /* ERROR STATE */
          <div className="bg-white dark:bg-[#202330] rounded-xl shadow-sm border border-red-200 dark:border-red-900 p-8 text-center">
            <p className="text-[#D64550] mb-4">
              {error}
            </p>

            <button
              onClick={fetchTrash}
              className="bg-[#6B4EE6] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#583CCB]"
            >
              Try Again
            </button>
          </div>

        ) : notes.length === 0 ? (

          /* EMPTY STATE */
          <div className="bg-white dark:bg-[#202330] rounded-xl shadow-sm border border-[#EAE7E0] dark:border-gray-700 min-h-[420px] flex flex-col items-center justify-center text-center px-6 py-12 transition-colors">

            <div className="w-20 h-20 rounded-full bg-[#F3F0FF] dark:bg-[#38315C] flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B7CF6"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v5" />
                <path d="M14 11v5" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-[#111827] dark:text-gray-100 mb-3">
              Your Trash is empty
            </h3>

            <p className="text-[#6B7280] dark:text-gray-400 mb-7">
              Notes you delete will appear here.
            </p>

            <Link
              to="/"
              className="inline-flex items-center justify-center bg-[#6B4EE6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#583CCB] transition shadow-sm"
            >
              Return to Notes
            </Link>

          </div>

        ) : (

          /* DELETED NOTES GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {notes.map((note) => (

              <div
                key={note._id}
                className="bg-white dark:bg-[#202330] p-6 rounded-xl border border-[#EAE7E0] dark:border-gray-700 shadow-sm hover:shadow-md transition-colors"
              >

                <div className="flex justify-between items-start gap-3 mb-3">

                  <h4 className="font-bold text-lg text-[#111827] dark:text-gray-100 break-words">
                    {note.title}
                  </h4>

                  <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-1 rounded-full whitespace-nowrap">
                    Deleted
                  </span>

                </div>

                <p className="text-[#6B7280] dark:text-gray-400 text-sm line-clamp-4 mb-4">
                  {getPlainText(note.content).slice(0, 180) ||
                    'No preview available.'}
                </p>

                <div className="text-xs text-[#6B7280] dark:text-gray-400 mb-5 space-y-1">
                  <p>
                    Subject: {note.subject?.name || 'General'}
                  </p>

                  <p>
                    Last updated:{' '}
                    {note.updatedAt
                      ? new Date(note.updatedAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>

                <div className="flex flex-col gap-2">

                  <button
                    onClick={() => handleRestore(note)}
                    disabled={actionLoading !== ''}
                    className="w-full bg-[#6B4EE6] text-white py-2.5 rounded-lg font-semibold hover:bg-[#583CCB] transition disabled:opacity-50"
                  >
                    {actionLoading === note._id
                      ? 'Processing...'
                      : '↩ Restore Note'}
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(note)}
                    disabled={actionLoading !== ''}
                    className="w-full bg-red-50 dark:bg-red-950/40 text-[#D64550] dark:text-red-300 border border-red-200 dark:border-red-900 py-2.5 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-950 transition disabled:opacity-50"
                  >
                    Delete Permanently
                  </button>

                </div>
              </div>

            ))}

          </div>

        )}

      </main>
    </div>
  );
}
