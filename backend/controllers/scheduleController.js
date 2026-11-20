const Schedule = require('../models/Schedule');

// @desc    Get all schedules for a user
const getSchedules = async (req, res) => {
  try {
    // Populate subject and note details so the frontend can display them
    const schedules = await Schedule.find({ user: req.user._id })
      .populate('subject', 'name color')
      .populate('note', 'title')
      .sort({ dueDate: 1 }); // Sort by closest due date
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a schedule
const createSchedule = async (req, res) => {
  const { title, description, dueDate, subject, note } = req.body;
  try {
    const schedule = await Schedule.create({
      title,
      description,
      dueDate,
      subject,
      note: note || null,
      user: req.user._id,
    });
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a schedule (e.g., mark as completed)
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    if (schedule.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a schedule
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    if (schedule.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };