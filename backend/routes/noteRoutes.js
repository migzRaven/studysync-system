
const express = require('express');
const router = express.Router();

const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
  emptyTrash,
} = require('../controllers/noteController');

const { protect } = require('../middleware/authMiddleware');

// Get all active notes or Trash notes
// Create a new note
router.route('/')
  .get(protect, getNotes)
  .post(protect, createNote);

// Empty the current user's Trash
router.delete('/trash/empty', protect, emptyTrash);

// Restore a note from Trash
router.put('/:id/restore', protect, restoreNote);

// Permanently delete a note from Trash
router.delete('/:id/permanent', protect, permanentlyDeleteNote);

// Get, update, or move a note to Trash
router.route('/:id')
  .get(protect, getNoteById)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;
