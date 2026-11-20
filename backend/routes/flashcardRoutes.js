const express = require('express');
const router = express.Router();
const { generateFlashcards, getFlashcardsByNote } = require('../controllers/flashcardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateFlashcards);
router.get('/note/:noteId', protect, getFlashcardsByNote);

module.exports = router;