const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, deleteSubject } = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

// Chain GET and POST for the base route
router.route('/')
  .get(protect, getSubjects)
  .post(protect, createSubject);

// Route for deleting a specific subject by ID
router.route('/:id')
  .delete(protect, deleteSubject);

module.exports = router;