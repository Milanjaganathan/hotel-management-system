require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'Grand Hotel Management System'
    });
});

// Clean URL Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/rooms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// API 404 handler for any unmatched /api routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        message: 'Internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(`  Grand Hotel Management System is Live!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`===============================================`);

    // Auto-initialize DB and sample records
    await initDatabase();
});
