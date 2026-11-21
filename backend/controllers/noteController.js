
const Note = require('../models/Note');

// Escape special characters before using search text in a regular expression
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Normalize tags into a clean array of strings
const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];

  return [
    ...new Set(
      tags
        .filter((tag) => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
};

// @desc    Get active notes or trashed notes
const getNotes = async (req, res) => {
  try {
    const query = { user: req.user._id };

    // Show Trash only when explicitly requested
    query.isDeleted = req.query.trash === 'true';

    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    // Filter favorite notes (not applicable to Trash)
    if (req.query.favorite === 'true') {
      query.isFavorite = true;
    }

    // Search title, content, and tags
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(req.query.search.trim()),
        'i'
      );

      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    const notes = await Note.find(query)
      .populate('subject', 'name color')
      .sort({ isPinned: -1, updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single active note by ID
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('subject', 'name color');

    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a note
const createNote = async (req, res) => {
  const { title, content, subject, tags, isPinned, isFavorite } = req.body;

  try {
    const note = await Note.create({
      title,
      content,
      subject,
      tags: normalizeTags(tags),
      isPinned: isPinned === true,
      isFavorite: isFavorite === true,
      isDeleted: false,
      user: req.user._id,
    });

    const populatedNote = await note.populate('subject', 'name color');

    res.status(201).json(populatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an active note
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Only update fields explicitly included in the request
    const allowedFields = ['title', 'content', 'subject'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    if (req.body.tags !== undefined) {
      note.tags = normalizeTags(req.body.tags);
    }

    if (req.body.isPinned !== undefined) {
      note.isPinned = req.body.isPinned === true;
    }

    if (req.body.isFavorite !== undefined) {
      note.isFavorite = req.body.isFavorite === true;
    }

    const updatedNote = await note.save();
    await updatedNote.populate('subject', 'name color');

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move a note to Trash
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    note.isDeleted = true;
    await note.save();

    res.json({ message: 'Note moved to Trash', note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore a note from Trash
const restoreNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || !note.isDeleted) {
      return res.status(404).json({ message: 'Trashed note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    note.isDeleted = false;
    await note.save();
    await note.populate('subject', 'name color');

    res.json({
      message: 'Note restored successfully',
      note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete one note from Trash
const permanentlyDeleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || !note.isDeleted) {
      return res.status(404).json({ message: 'Trashed note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await note.deleteOne();

    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete all notes in the current user's Trash
const emptyTrash = async (req, res) => {
  try {
    const result = await Note.deleteMany({
      user: req.user._id,
      isDeleted: true,
    });

    res.json({
      message: 'Trash emptied successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
  emptyTrash,
};
