
const Subject = require('../models/Subject');
const Note = require('../models/Note');

// @desc    Get all subjects for logged-in user
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject
const createSubject = async (req, res) => {
  const { name, color } = req.body;

  try {
    const subject = await Subject.create({
      name,
      color,
      user: req.user._id,
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subject and all its notes
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if the logged-in user owns this subject
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete notes belonging to this subject and user
    const deletedNotes = await Note.deleteMany({
      subject: subject._id,
      user: req.user._id,
    });

    // Delete the subject
    await subject.deleteOne();

    res.json({
      message: 'Subject and its notes successfully deleted',
      deletedNotes: deletedNotes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  deleteSubject,
};
