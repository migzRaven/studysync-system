import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  
  // State for our data
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeSubject, setActiveSubject] = useState('all'); // 'all' or subject ID
  const [searchQuery, setSearchQuery] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  // Axios config with Auth Token
  const config = {
    headers: { Authorization: `Bearer ${user?.token}` },
  };

  // Fetch Subjects on load
  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get('http://10.219.29.26:5000/api/subjects', config);
      setSubjects(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Notes based on active subject
  const fetchNotes = async () => {
    try {
      const url = activeSubject === 'all' 
        ? 'http://10.219.29.26:5000/api/notes' 
        : `http://10.219.29.26:5000/api/notes?subject=${activeSubject}`;
      const { data } = await axios.get(url, config);
      setNotes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [activeSubject]);

  // Add a new subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      // Generate a random pastel color for the subject
      const colors = ['#FF8A3D', '#6656E0', '#D64550', '#4CAF50', '#2196F3'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      await axios.post('http://10.219.29.26:5000/api/subjects', 
        { name: newSubjectName, color: randomColor }, 
        config
      );
      setNewSubjectName('');
      setShowAddSubject(false);
      fetchSubjects(); // Refresh list
    } catch (error) {
      console.error(error);
    }
  };

  // Filter notes by search query (Client-side search)
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#F3ECDF] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#FFFDF9] border-r border-[#E4D9C3] flex flex-col h-screen fixed">
        <div className="p-6 border-b border-[#E4D9C3]">
          <h1 className="text-2xl font-bold text-[#6656E0]">QuickNote</h1>
        </div>
        
 <div className="p-4 border-b border-[#E4D9C3] flex gap-2">
          <button className="flex-1 bg-[#6656E0] text-white py-2 rounded-lg font-semibold text-sm">
            📝 Notes
          </button>
          <Link to="/planner" className="flex-1 bg-[#F3ECDF] text-[#6B655A] hover:bg-[#E4D9C3] py-2 rounded-lg font-semibold text-sm text-center">
            📅 Planner
          </Link>
        </div>
        {/* --------------------------------- */}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button 
            onClick={() => setActiveSubject('all')}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${activeSubject === 'all' ? 'bg-[#F3ECDF] font-bold text-[#6656E0]' : 'hover:bg-[#F3ECDF]'}`}
          >
            📝 All Notes
          </button>

          {subjects.map((sub) => (
            <button 
              key={sub._id}
              onClick={() => setActiveSubject(sub._id)}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition ${activeSubject === sub._id ? 'bg-[#F3ECDF] font-bold' : 'hover:bg-[#F3ECDF]'}`}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }}></span>
              {sub.name}
            </button>
          ))}

          {/* Add Subject Form */}
          {showAddSubject ? (
            <form onSubmit={handleAddSubject} className="mt-4">
              <input 
                type="text" 
                autoFocus
                placeholder="Subject name..." 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] rounded mb-2 text-sm focus:outline-none focus:border-[#6656E0]"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-[#6656E0] text-white py-1 rounded text-sm">Add</button>
                <button type="button" onClick={() => setShowAddSubject(false)} className="flex-1 bg-gray-300 text-gray-700 py-1 rounded text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setShowAddSubject(true)}
              className="w-full text-left px-4 py-2 text-sm text-[#6B655A] hover:text-[#6656E0] transition"
            >
              + Add Subject
            </button>
          )}
        </div>

        <div className="p-4 border-t border-[#E4D9C3]">
          <button onClick={logout} className="w-full text-left px-4 py-2 text-[#D64550] font-semibold hover:bg-[#F3ECDF] rounded-lg transition">
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          
          {/* Search Bar */}
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-96 p-3 bg-[#FFFDF9] border border-[#E4D9C3] rounded-lg focus:outline-none focus:border-[#6656E0]"
          />

          {/* New Note Button */}
          <Link 
            to="/note/new" 
            className="bg-[#FF8A3D] text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-sm"
          >
            + New Note
          </Link>
        </header>

        {/* Notes Grid */}
        <div>
          <h2 className="text-2xl font-bold text-[#2B2A28] mb-6">
            {activeSubject === 'all' ? 'All Notes' : subjects.find(s => s._id === activeSubject)?.name || 'Notes'}
          </h2>
          
          {filteredNotes.length === 0 ? (
            <div className="text-center text-[#6B655A] mt-20">
              <p className="text-4xl mb-4">📭</p>
              <p>No notes found. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.map(note => (
                <Link 
                  to={`/note/${note._id}`}
                  key={note._id}
                  className="bg-[#FFFDF9] p-6 rounded-xl border border-[#E4D9C3] shadow-sm hover:shadow-md transition transform hover:-rotate-1 relative block"
                  style={{ borderTop: `4px solid ${note.subject?.color || '#6656E0'}` }}
                >
                  <h3 className="font-bold text-lg mb-2 text-[#2B2A28] truncate">{note.title}</h3>
                  <p className="text-[#6B655A] text-sm line-clamp-3 mb-4">
                    {note.content}
                  </p>
                  <div className="flex justify-between items-center text-xs text-[#6B655A] mt-auto">
                    <span className="font-semibold px-2 py-1 bg-[#F3ECDF] rounded">
                      {note.subject?.name || 'General'}
                    </span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
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