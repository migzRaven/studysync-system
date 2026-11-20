import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import StudyPlanner from './pages/StudyPlanner';
import FlashcardReview from './pages/FlashcardReview';

// Protect routes so only logged-in users can see them
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          
          {/* --- ADDED THE NOTE EDITOR ROUTE HERE --- */}
          <Route 
            path="/note/:id" 
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
  path="/flashcards/:noteId" 
  element={
    <ProtectedRoute>
      <FlashcardReview />
    </ProtectedRoute>
  } 
/>

          <Route path="/planner" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;