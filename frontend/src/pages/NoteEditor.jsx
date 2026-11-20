import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  
  // UI States
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Reminder Modal States
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');

  const config = { headers: { Authorization: `Bearer ${user?.token}` } };
  const isEditing = id !== 'new';
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFlashcards = async () => {
    if (!title || !content || !subject) {
      alert("Please fill in the title, content, and select a subject before generating flashcards.");
      return;
    }
    setIsGenerating(true);
    try {
      await axios.post('http://10.219.29.26:5000/api/flashcards/generate', 
        { noteId: id, noteContent: content, subjectId: subject },
        config
      );
      // Automatically navigate to the flashcard review page when done
      navigate(`/flashcards/${id}`);
    } catch (error) {
      alert('AI failed to generate flashcards. Please check your API key or try again.');
      setIsGenerating(false);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const subRes = await axios.get('http://10.219.29.26:5000/api/subjects', config);
        setSubjects(subRes.data);
        
        if (!isEditing && subRes.data.length > 0) {
          setSubject(subRes.data[0]._id);
        }

        if (isEditing) {
          const noteRes = await axios.get(`http://10.219.29.26:5000/api/notes/${id}`, config);
          setTitle(noteRes.data.title);
          setContent(noteRes.data.content);
          setSubject(noteRes.data.subject?._id || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !subject) {
      alert("Please fill in all fields and select a subject.");
      return;
    }

    try {
      const noteData = { title, content, subject };
      if (isEditing) {
        await axios.put(`http://10.219.29.26:5000/api/notes/${id}`, noteData, config);
      } else {
        await axios.post('http://10.219.29.26:5000/api/notes', noteData, config);
      }
      
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/');
      }, 1500);

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save note');
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await axios.delete(`http://10.219.29.26:5000/api/notes/${id}`, config);
        navigate('/');
      } catch (error) {
        console.error(error);
      }
    }
  };

  // --- NEW INTEGRATION FUNCTION ---
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://10.219.29.26:5000/api/schedules', {
        title: `Review: ${title}`,
        description: `Review this note before your exam.`,
        dueDate: reminderDate,
        subject: subject,
        note: id // This is the link to the QuickNote!
      }, config);
      
      setShowReminderModal(false);
      alert('Reminder successfully added to StudyPlanner!');
    } catch (error) {
      alert('Failed to create reminder');
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B655A]">Loading editor...</div>;

  return (
    <div className="min-h-screen bg-[#F3ECDF] p-8 font-sans relative">
      <div className="max-w-3xl mx-auto bg-[#FFFDF9] rounded-xl shadow-lg border border-[#E4D9C3] flex flex-col min-h-[80vh]">
        
        {/* Top Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-[#E4D9C3]">
          <Link to="/" className="text-[#6B655A] hover:text-[#2B2A28] font-semibold">&lt; Back</Link>
          <div className="flex gap-4 items-center">
                      {/* --- AI FLASHCARD BUTTON --- */}
          {isEditing && (
            <button 
              onClick={handleGenerateFlashcards} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-[#FF8A3D] to-[#6656E0] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? '✨ Generating...' : '✨ AI Flashcards'}
            </button>
          )}
            {/* Only show Reminder button if the note is already saved */}
            {isEditing && (
              <button 
                onClick={() => setShowReminderModal(true)} 
                className="text-[#FF8A3D] font-semibold hover:underline"
              >
                Set Reminder 🔔
              </button>
            )}
            {isEditing && (
              <button onClick={handleDelete} className="text-[#D64550] font-semibold hover:underline">
                Delete
              </button>
            )}
            <button onClick={handleSave} className="bg-[#6656E0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-sm">
              Save
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-8 flex-1 flex flex-col">
          <input 
            type="text" 
            placeholder="Note title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold text-[#2B2A28] bg-transparent border-none focus:outline-none mb-6 placeholder-[#A9A29D]"
          />

          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map(sub => (
              <button
                key={sub._id}
                onClick={() => setSubject(sub._id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                  subject === sub._id 
                    ? 'text-white border-transparent' 
                    : 'bg-transparent text-[#6B655A] border-[#E4D9C3] hover:border-[#6656E0]'
                }`}
                style={{ backgroundColor: subject === sub._id ? sub.color : 'transparent' }}
              >
                {sub.name}
              </button>
            ))}
          </div>

          <textarea 
            placeholder="Start writing your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 bg-transparent border-none focus:outline-none resize-none text-[#2B2A28] leading-8"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #E4D9C3 31px, #E4D9C3 32px)',
              lineHeight: '32px'
            }}
          />
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#FFFDF9] p-6 rounded-xl shadow-lg w-96 border border-[#E4D9C3]">
            <h3 className="text-xl font-bold mb-4 text-[#2B2A28]">Set Study Reminder</h3>
            <form onSubmit={handleCreateReminder}>
              <label className="block text-sm font-semibold text-[#6B655A] mb-2">When do you want to study this?</label>
              <input 
                type="datetime-local" 
                required 
                value={reminderDate} 
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] rounded mb-4 focus:outline-none focus:border-[#6656E0]"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowReminderModal(false)} className="px-4 py-2 text-[#6B655A] font-semibold hover:bg-[#F3ECDF] rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#FF8A3D] text-white font-semibold rounded hover:bg-opacity-90">Add Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-[#4CAF50] text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-bounce z-50">
          Note saved successfully!
        </div>
      )}
    </div>
  );
}