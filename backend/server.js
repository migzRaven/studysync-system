const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first'); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow any device on the network to connect during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const noteRoutes = require('./routes/noteRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes); 
app.use('/api/notes', noteRoutes);   
app.use('/api/schedules', scheduleRoutes);
app.use('/api/flashcards', flashcardRoutes);    

// Health check
app.get('/', (req, res) => {
  res.send('StudySync API is running...');
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
  })
  .catch((err) => console.error('MongoDB connection error:', err));