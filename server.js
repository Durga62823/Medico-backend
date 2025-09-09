require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const medicalNoteRoutes = require('./routes/medicalNoteRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const vitalSignRoutes = require('./routes/vitalSignRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const billingRoutes = require('./routes/billingRoutes');
const labReportRoutes = require('./routes/labReportRoutes');
const documentRoutes = require('./routes/documentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://medico-three.vercel.app/'], // exact frontend origin
    credentials: true,               // allow cookies, auth headers
  })
);
// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'MedAIron Backend is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api', vitalSignRoutes);
app.use('/api', medicalNoteRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', billingRoutes);
app.use('/api', labReportRoutes);
app.use('/api', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/alerts', alertRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server FIRST
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Setup Socket.IO AFTER server is created
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*', // Restrict in production
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers/services
app.set('io', io);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});