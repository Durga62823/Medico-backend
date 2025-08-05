require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const app = express();
const medicalNoteRoutes = require('./routes/medicalNoteRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const vitalSignRoutes = require('./routes/vitalSignRoutes');
// Connect to database
connectDB();

// Middleware
app.use(helmet());  
app.use(cors());
app.use(compression());  // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev'));  // Logging in dev mode

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'MedAIron Backend is running!' });
});

// Error handling middleware (basic example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api', vitalSignRoutes);
app.use('/api', medicalNoteRoutes);


const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});