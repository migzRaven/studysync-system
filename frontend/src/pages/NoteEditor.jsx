
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [noteId, setNoteId] = useState(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');

  const saveTimer = useRef(null);
  const requestRef = useRef(Promise.resolve());
  const savedContentRef = useRef('');
  const mountedRef = useRef(false);
  const initializedRef = useRef(false);

  const config = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  const isEditing = Boolean(noteId && noteId !== 'new');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setSaveStatus('Unsaved changes');
    },
  });

  // Load subjects and note
  useEffect(() => {
    if (!user?.token || !editor) return;

    let active = true;

    const fetchData = async () => {
      try {
        const subRes = await axios.get(`${API}/subjects`, config);
        if (!active) return;

        setSubjects(subRes.data);

        if (id !== 'new') {
          const noteRes = await axios.get(`${API}/notes/${id}`, config);
          if (!active) return;

          const note = noteRes.data;
          const noteContent = note.content || '';

          setNoteId(id);
          setTitle(note.title || '');
          setContent(noteContent);
          setSubject(note.subject?._id || '');
          setIsPinned(Boolean(note.isPinned));
          setIsFavorite(Boolean(note.isFavorite));
          setTags(note.tags || []);

          editor.commands.setContent(noteContent);

          savedContentRef.current = JSON.stringify({
            title: note.title || '',
            content: noteContent,
            subject: note.subject?._id || '',
            isPinned: Boolean(note.isPinned),
            isFavorite: Boolean(note.isFavorite),
            tags: note.tags || [],
          });
        } else if (subRes.data.length > 0) {
          setSubject(subRes.data[0]._id);
        }

        initializedRef.current = true;
        setSaveStatus('Saved');
      } catch (error) {
        console.error('Error loading note:', error);
        alert(error.response?.data?.message || 'Failed to load note.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [id, user?.token, editor]);

  // Current note data
  const getNoteData = () => ({
    title: title.trim(),
    content,
    subject,
    isPinned,
    isFavorite,
    tags,
  });

  // Save note to backend
  const saveNote = async (showError = true) => {
    const data = getNoteData();

    if (!data.title || !data.content || !data.subject) {
      setSaveStatus('Complete the title, content, and subject to save');
      return false;
    }

    setSaveStatus('Saving...');

    const saveOperation = requestRef.current.then(async () => {
      try {
        let response;

        if (noteId && noteId !== 'new') {
          response = await axios.put(
            `${API}/notes/${noteId}`,
            data,
            config
          );
        } else {
          response = await axios.post(
            `${API}/notes`,
            data,
            config
          );

          const createdId = response.data._id || response.data.note?._id;

          if (!createdId) {
            throw new Error('The server did not return the new note ID.');
          }

          setNoteId(createdId);
          window.history.replaceState(
            null,
            '',
            `/notes/${createdId}/edit`
          );
        }

        savedContentRef.current = JSON.stringify(data);
        setSaveStatus('Saved');
        return true;
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus('Save failed');

        if (showError) {
          alert(
            error.response?.data?.message ||
            error.message ||
            'Failed to save note.'
          );
        }

        return false;
      }
    });

    requestRef.current = saveOperation.then(() => undefined);
    return saveOperation;
  };

  // Autosave after 1.2 seconds
  useEffect(() => {
    if (!initializedRef.current || loading) return;

    const currentData = JSON.stringify(getNoteData());

    if (currentData === savedContentRef.current) return;

    setSaveStatus('Unsaved changes');

    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveNote(false);
    }, 1200);

    return () => clearTimeout(saveTimer.current);
  }, [title, content, subject, isPinned, isFavorite, tags, loading]);

  // Clean up timer
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(saveTimer.current);
    };
  }, []);

  const handleManualSave = async () => {
    clearTimeout(saveTimer.current);
    const success = await saveNote(true);

    if (success) {
      alert('Note saved successfully!');
      navigate('/');
    }
  };

  // Add tag
  const handleAddTag = (e) => {
    e.preventDefault();

    const newTag = tagInput.trim().replace(/^#/, '');

    if (!newTag) return;

    if (tags.some(tag => tag.toLowerCase() === newTag.toLowerCase())) {
      alert('This tag already exists.');
      return;
    }

    setTags(prev => [...prev, newTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Generate AI flashcards
  const handleGenerateFlashcards = async () => {
    if (!title.trim() || !content.trim() || !subject) {
      alert('Please fill in the title, content, and subject first.');
      return;
    }

    clearTimeout(saveTimer.current);

    const saved = await saveNote(true);
    if (!saved) return;

    setIsGenerating(true);

    try {
      await axios.post(
        `${API}/flashcards/generate`,
        {
          noteId: noteId === 'new' ? undefined : noteId,
          noteContent: content,
          subjectId: subject,
        },
        config
      );

      navigate(`/flashcards/${noteId}`);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'AI failed to generate flashcards.'
      );
      setIsGenerating(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!noteId || noteId === 'new') return;

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`${API}/notes/${noteId}`, config);
        navigate('/');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete note.');
      }
    }
  };

  // Create reminder
  const handleCreateReminder = async (e) => {
    e.preventDefault();

    try {
      const saved = await saveNote(true);
      if (!saved) return;

      await axios.post(
        `${API}/schedules`,
        {
          title: `Review: ${title}`,
          description: 'Review this note before your exam.',
          dueDate: reminderDate,
          subject,
          note: noteId,
        },
        config
      );

      setShowReminderModal(false);
      setReminderDate('');
      alert('Reminder successfully added to StudyPlanner!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create reminder.');
    }
  };

  if (loading || !editor) {
    return (
      <div className="min-h-screen p-8 text-center bg-[#F3ECDF] dark:bg-[#171923] text-[#6B655A] dark:text-gray-300">
        Loading editor...
      </div>
    );
  }

  // Toolbar buttons
  const toolbarButton = (label, action, active = false) => (
    <button
      type="button"
      onClick={action}
      className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
        active
          ? 'bg-[#6656E0] text-white border-[#6656E0]'
          : 'bg-white dark:bg-[#303546] text-[#6B655A] dark:text-gray-300 border-[#E4D9C3] dark:border-gray-600 hover:border-[#6656E0] dark:hover:border-purple-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F3ECDF] dark:bg-[#171923] p-4 md:p-8 font-sans transition-colors duration-300">

      <div className="max-w-4xl mx-auto bg-[#FFFDF9] dark:bg-[#202330] rounded-xl shadow-lg border border-[#E4D9C3] dark:border-gray-700 flex flex-col min-h-[80vh] transition-colors duration-300">

        {/* TOP TOOLBAR */}
        <div className="flex flex-wrap justify-between items-center gap-4 p-4 border-b border-[#E4D9C3] dark:border-gray-700">

          <Link
            to="/"
            className="text-[#6B655A] dark:text-gray-400 font-semibold hover:text-[#2B2A28] dark:hover:text-white"
          >
            &lt; Back
          </Link>

          <div className="flex flex-wrap gap-3 items-center">

            <span
              className={`text-sm font-medium ${
                saveStatus === 'Saved'
                  ? 'text-green-600 dark:text-green-400'
                  : saveStatus === 'Save failed'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-[#B86B18] dark:text-orange-400'
              }`}
            >
              {saveStatus}
            </span>

            {isEditing && (
              <>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-[#FF8A3D] to-[#6656E0] text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isGenerating ? '✨ Generating...' : '✨ AI Flashcards'}
                </button>

                <button
                  onClick={() => setShowReminderModal(true)}
                  className="text-[#FF8A3D] dark:text-orange-400 font-semibold hover:underline"
                >
                  Set Reminder 🔔
                </button>

                <button
                  onClick={handleDelete}
                  className="text-[#D64550] dark:text-red-400 font-semibold hover:underline"
                >
                  Delete
                </button>
              </>
            )}

            <button
              onClick={handleManualSave}
              className="bg-[#6656E0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90"
            >
              Save & Exit
            </button>
          </div>
        </div>

        <div className="p-5 md:p-8 flex-1 flex flex-col">

          {/* TITLE */}
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-3xl font-bold text-[#2B2A28] dark:text-gray-100 bg-transparent border-none focus:outline-none mb-6 placeholder-[#A9A29D] dark:placeholder-gray-500"
          />

          {/* PIN AND FAVORITE */}
          <div className="flex flex-wrap gap-3 mb-6">

            <button
              type="button"
              onClick={() => setIsPinned(prev => !prev)}
              aria-pressed={isPinned}
              className={`px-4 py-2 rounded-lg border font-semibold transition ${
                isPinned
                  ? 'bg-[#FFF0D9] dark:bg-[#45351F] text-[#B86B18] dark:text-orange-300 border-[#F2C98D] dark:border-orange-800'
                  : 'text-[#6B655A] dark:text-gray-300 border-[#E4D9C3] dark:border-gray-600 hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
              }`}
            >
              {isPinned ? '📌 Pinned' : '📍 Pin note'}
            </button>

            <button
              type="button"
              onClick={() => setIsFavorite(prev => !prev)}
              aria-pressed={isFavorite}
              className={`px-4 py-2 rounded-lg border font-semibold transition ${
                isFavorite
                  ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900'
                  : 'text-[#6B655A] dark:text-gray-300 border-[#E4D9C3] dark:border-gray-600 hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
              }`}
            >
              {isFavorite ? '♥ Favorited' : '♡ Add to favorites'}
            </button>
          </div>

          {/* SUBJECT */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-3">
              Subject
            </p>

            <div className="flex flex-wrap gap-2">
              {subjects.map(sub => (
                <button
                  key={sub._id}
                  type="button"
                  onClick={() => setSubject(sub._id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                    subject === sub._id
                      ? 'text-white border-transparent'
                      : 'text-[#6B655A] dark:text-gray-300 border-[#E4D9C3] dark:border-gray-600 hover:bg-[#F3ECDF] dark:hover:bg-[#303546]'
                  }`}
                  style={{
                    backgroundColor: subject === sub._id ? sub.color : 'transparent',
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {/* TAGS */}
          <div className="mb-6">

            <p className="text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-3">
              Note Tags
            </p>

            <form onSubmit={handleAddTag} className="flex flex-wrap gap-2">

              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Enter a tag (e.g. Assignment)"
                className="flex-1 min-w-[180px] px-4 py-2 rounded-lg border border-[#E4D9C3] dark:border-gray-600 bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100 placeholder-[#A9A29D] dark:placeholder-gray-500 focus:outline-none focus:border-[#6656E0]"
              />

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#6656E0] text-white font-semibold hover:bg-opacity-90"
              >
                + Add Tag
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-3">

              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-2 bg-[#EEEAFE] dark:bg-[#38315C] text-[#6656E0] dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-semibold"
                >
                  #{tag}

                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag} tag`}
                    className="text-[#D64550] dark:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              {tags.length === 0 && (
                <p className="text-sm text-[#A9A29D] dark:text-gray-500">
                  No tags added yet.
                </p>
              )}
            </div>
          </div>

          {/* RICH TEXT EDITOR */}
          <div className="border border-[#E4D9C3] dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#252A39] flex-1 transition-colors duration-300">

            <div className="flex flex-wrap gap-2 p-3 border-b border-[#E4D9C3] dark:border-gray-700 bg-[#FAF7F0] dark:bg-[#202330]">

              {toolbarButton('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}

              {toolbarButton('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}

              {toolbarButton('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}

              {toolbarButton('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}

              {toolbarButton('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}

              {toolbarButton('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}

              {toolbarButton('Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}

              {toolbarButton('Undo', () => editor.chain().focus().undo().run())}

              {toolbarButton('Redo', () => editor.chain().focus().redo().run())}
            </div>

            <EditorContent
              editor={editor}
              className="study-editor min-h-[350px] p-5 text-[#2B2A28] dark:text-gray-100 leading-8"
            />
          </div>
        </div>
      </div>

      {/* REMINDER MODAL */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-[#FFFDF9] dark:bg-[#202330] p-6 rounded-xl shadow-lg w-96 max-w-full border border-[#E4D9C3] dark:border-gray-700 transition-colors duration-300">

            <h3 className="text-xl font-bold mb-4 text-[#2B2A28] dark:text-gray-100">
              Set Study Reminder
            </h3>

            <form onSubmit={handleCreateReminder}>

              <label className="block text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-2">
                When do you want to study this?
              </label>

              <input
                type="datetime-local"
                required
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded mb-4 bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100"
              />

              <div className="flex gap-2 justify-end">

                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-[#6B655A] dark:text-gray-300 font-semibold rounded hover:bg-[#F3ECDF] dark:hover:bg-[#303546]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF8A3D] text-white font-semibold rounded hover:bg-opacity-90"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
