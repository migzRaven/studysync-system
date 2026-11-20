const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject', // Links the note to a specific subject
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Links the note to the logged-in user
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt dates
);

module.exports = mongoose.model('Note', noteSchema);