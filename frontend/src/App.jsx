import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useContext } from 'react';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import StudyPlanner from './pages/StudyPlanner';
import FlashcardReview from './pages/FlashcardReview';
import Trash from './pages/Trash';

// Protect routes so only logged-in users can access them
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
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

            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <StudyPlanner />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trash"
              element={
                <ProtectedRoute>
                  <Trash />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;