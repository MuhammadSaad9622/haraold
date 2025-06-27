import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set');

import reportsRoutes from './routes/reports.js';
import express from 'express';
import mongoose from 'mongoose';
import visitRoutes from './routes/visits.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken } from './middleware/authMiddleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import billingRoutes from './routes/billing.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ Connect to MongoDB and only start the server if successful
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Register routes
    app.use('/api/auth', authRoutes);
    app.use('/api/patients', authenticateToken, patientRoutes);
    app.use('/api/appointments', authenticateToken, appointmentRoutes);
    app.use('/api/billing', authenticateToken, billingRoutes);
    app.use('/api/ai', aiRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'Server is running' });
    });

    app.use('/api/reports', reportsRoutes);
    app.use('/api/visits', authenticateToken, visitRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!', error: err.message });
    });

    // ✅ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err.message));
