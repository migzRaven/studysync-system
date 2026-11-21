
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function StudyPlanner() {
  const { user, logout } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  const fetchData = async () => {
    try {
      const schRes = await axios.get(
        'http://localhost:5000/api/schedules',
        config
      );
      setSchedules(schRes.data);

      const subRes = await axios.get(
        'http://localhost:5000/api/subjects',
        config
      );
      setSubjects(subRes.data);

      if (subRes.data.length > 0) {
        setSubject(subRes.data[0]._id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSchedule = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        'http://localhost:5000/api/schedules',
        { title, description, dueDate, subject },
        config
      );

      setTitle('');
      setDescription('');
      setDueDate('');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Failed to add schedule');
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/schedules/${id}`,
        { isCompleted: !currentStatus },
        config
      );

      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reminder?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/schedules/${id}`,
          config
        );

        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3ECDF] dark:bg-[#171923] text-[#2B2A28] dark:text-gray-100 font-sans transition-colors duration-300">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#FFFDF9] dark:bg-[#202330] border-r border-[#E4D9C3] dark:border-gray-700 flex flex-col h-screen fixed transition-colors duration-300">

        <div className="p-6 border-b border-[#E4D9C3] dark:border-gray-700">
          <h1 className="text-2xl font-bold text-[#FF8A3D]">
            StudyPlanner
          </h1>
        </div>

        <div className="p-4 border-b border-[#E4D9C3] dark:border-gray-700 flex gap-2">
          <Link
            to="/"
            className="flex-1 bg-[#F3ECDF] dark:bg-[#303546] text-[#6B655A] dark:text-gray-300 hover:bg-[#E4D9C3] dark:hover:bg-[#3B4154] py-2 rounded-lg font-semibold text-sm text-center transition"
          >
            📝 Notes
          </Link>

          <button
            className="flex-1 bg-[#FF8A3D] text-white py-2 rounded-lg font-semibold text-sm"
          >
            📅 Planner
          </button>
        </div>

        <div className="p-4 mt-auto border-t border-[#E4D9C3] dark:border-gray-700">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-[#D64550] dark:text-red-400 font-semibold hover:bg-[#F3ECDF] dark:hover:bg-[#303546] rounded-lg transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">

        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#2B2A28] dark:text-gray-100">
            Upcoming Deadlines
          </h2>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#6656E0] text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-sm"
          >
            {showAddForm ? 'Cancel' : '+ Add Reminder'}
          </button>
        </header>

        {/* ADD SCHEDULE FORM */}
        {showAddForm && (
          <form
            onSubmit={handleAddSchedule}
            className="bg-[#FFFDF9] dark:bg-[#202330] p-6 rounded-xl border border-[#E4D9C3] dark:border-gray-700 shadow-sm mb-8 space-y-4 transition-colors duration-300"
          >
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-1">
                  Title
                </label>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100 focus:outline-none focus:border-[#6656E0]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-1">
                  Due Date & Time
                </label>

                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100 focus:outline-none focus:border-[#6656E0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-1">
                Subject
              </label>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100 focus:outline-none focus:border-[#6656E0]"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B655A] dark:text-gray-300 mb-1">
                Description (Optional)
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-[#E4D9C3] dark:border-gray-600 rounded bg-white dark:bg-[#303546] text-[#2B2A28] dark:text-gray-100 focus:outline-none focus:border-[#6656E0]"
              />
            </div>

            <button
              type="submit"
              className="bg-[#6656E0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90"
            >
              Save Reminder
            </button>
          </form>
        )}

        {/* SCHEDULE LIST */}
        <div className="space-y-4">

          {schedules.length === 0 ? (
            <div className="bg-[#FFFDF9] dark:bg-[#202330] border border-[#E4D9C3] dark:border-gray-700 rounded-xl p-10 text-center transition-colors duration-300">
              <p className="text-[#6B655A] dark:text-gray-400">
                No upcoming deadlines. You're all caught up!
              </p>
            </div>
          ) : (
            schedules.map((sch) => (
              <div
                key={sch._id}
                className={`bg-[#FFFDF9] dark:bg-[#202330] p-5 rounded-xl border border-[#E4D9C3] dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors duration-300 ${
                  sch.isCompleted ? 'opacity-50' : ''
                }`}
              >

                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={sch.isCompleted}
                    onChange={() =>
                      toggleComplete(sch._id, sch.isCompleted)
                    }
                    className="w-6 h-6 accent-[#6656E0] cursor-pointer"
                  />

                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        sch.isCompleted
                          ? 'line-through text-[#6B655A] dark:text-gray-500'
                          : 'text-[#2B2A28] dark:text-gray-100'
                      }`}
                    >
                      {sch.title}
                    </h3>

                    <p className="text-sm text-[#6B655A] dark:text-gray-400">
                      {sch.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs mt-1 font-semibold">
                      <span className="text-[#D64550] dark:text-red-400">
                        📅 {new Date(sch.dueDate).toLocaleString()}
                      </span>

                      <span style={{ color: sch.subject?.color }}>
                        ● {sch.subject?.name}
                      </span>

                      {sch.note && (
                        <Link
                          to={`/note/${sch.note._id}`}
                          className="text-[#6656E0] dark:text-purple-400 hover:underline ml-2"
                        >
                          🔗 View Linked Note
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(sch._id)}
                  className="text-[#D64550] dark:text-red-400 hover:underline text-sm font-semibold"
                >
                  Delete
                </button>

              </div>
            ))
          )}

        </div>
      </main>
    </div>
  );
}
