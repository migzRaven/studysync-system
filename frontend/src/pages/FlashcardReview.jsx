import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function FlashcardReview() {
  const { noteId } = useParams();
  const { user } = useContext(AuthContext);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/flashcards/note/${noteId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setCards(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [noteId, user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F3ECDF] text-[#6B655A]">Loading flashcards...</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3ECDF]">
        <div className="text-center bg-[#FFFDF9] p-8 rounded-xl shadow-lg border border-[#E4D9C3]">
          <p className="text-xl text-[#6B655A] mb-4">No flashcards found for this note.</p>
          <Link to={`/note/${noteId}`} className="bg-[#6656E0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90">
            Go back to Note
          </Link>
        </div>
      </div>
    );
  }

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="min-h-screen bg-[#F3ECDF] flex flex-col items-center justify-center p-8 font-sans relative">
      <Link to={`/note/${noteId}`} className="absolute top-8 left-8 text-[#6B655A] font-semibold hover:text-[#2B2A28]">
        &lt; Back to Note
      </Link>
      
      <h1 className="text-3xl font-bold text-[#2B2A28] mb-2">Active Recall Mode</h1>
      <p className="text-[#6B655A] mb-8">Click the card to flip it!</p>

      {/* Flashcard Container */}
      <div 
        onClick={() => setShowAnswer(!showAnswer)}
        className="w-full max-w-xl h-80 bg-[#FFFDF9] rounded-2xl shadow-xl border-2 border-[#E4D9C3] flex items-center justify-center p-8 cursor-pointer transform transition duration-300 hover:scale-105 relative"
        style={{ borderTop: `8px solid ${showAnswer ? '#4CAF50' : '#6656E0'}` }}
      >
        <p className="text-center text-2xl font-semibold text-[#2B2A28]">
          {showAnswer ? cards[currentIndex].answer : cards[currentIndex].question}
        </p>
        <span className="absolute bottom-4 text-xs font-bold tracking-wider uppercase text-[#A9A29D]">
          {showAnswer ? 'Answer' : 'Question'}
        </span>
      </div>

      <div className="mt-8 flex gap-6 items-center">
        <span className="text-[#6B655A] font-semibold bg-[#FFFDF9] px-4 py-2 rounded-lg border border-[#E4D9C3]">
          {currentIndex + 1} / {cards.length}
        </span>
        <button onClick={nextCard} className="bg-[#6656E0] text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-md transition">
          Next Card &rarr;
        </button>
      </div>
    </div>
  );
}