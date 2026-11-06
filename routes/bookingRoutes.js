const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    getAllBookings,
    cancelBooking,
    updateBookingStatus,
    getDashboardStats
} = require('../controllers/bookingController');
const { verifyToken, verifyAdmin, optionalAuth } = require('../middleware/authMiddleware');

// Booking routes
router.post('/', optionalAuth, createBooking);
router.get('/my', verifyToken, getMyBookings);
router.get('/all', verifyToken, verifyAdmin, getAllBookings);
router.get('/stats', verifyToken, verifyAdmin, getDashboardStats);
router.post('/:id/cancel', verifyToken, cancelBooking);
router.put('/:id/status', verifyToken, verifyAdmin, updateBookingStatus);

module.exports = router;
