const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#6656E0', // Default accent color from your UI design
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Links the subject to the logged-in user
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);