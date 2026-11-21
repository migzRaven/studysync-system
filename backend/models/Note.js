
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Supports plain text and rich-text HTML
    content: {
      type: String,
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    // Pin important notes
    isPinned: {
      type: Boolean,
      default: false,
    },

    // Note tags
    tags: {
      type: [String],
      default: [],
    },

    // Favorite notes
    isFavorite: {
      type: Boolean,
      default: false,
    },

    // Phase 3: Soft deletion / Trash
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
