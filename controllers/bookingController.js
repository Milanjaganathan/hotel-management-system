const db = require('../config/db');

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.body.user_id;
        const { room_id, check_in, check_out, special_requests } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: 'You must be logged in to make a booking.'
            });
        }

        if (!room_id || !check_in || !check_out) {
            return res.status(400).json({
                message: 'Room selection, check-in date, and check-out date are required.'
            });
        }

        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({
                message: 'Invalid date format provided.'
            });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                message: 'Check-out date must be after check-in date.'
            });
        }

        // Check if room exists and is active
        const [rooms] = await db.execute(
            'SELECT * FROM rooms WHERE id = ?',
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                message: 'Selected room was not found.'
            });
        }

        const room = rooms[0];

        if (room.status === 'maintenance') {
            return res.status(400).json({
                message: 'This room is currently under maintenance. Please select another room.'
            });
        }

        // Check date conflict with existing bookings
        const [conflicts] = await db.execute(
            `SELECT id FROM bookings
             WHERE room_id = ?
             AND status IN ('pending', 'confirmed')
             AND check_in < ?
             AND check_out > ?`,
            [room_id, check_out, check_in]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({
                message: 'This room is already booked for the selected dates. Please choose different dates or another room.'
            });
        }

        // Calculate nights and total amount
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const total = days * Number(room.price);

        const [result] = await db.execute(
            `INSERT INTO bookings
            (user_id, room_id, check_in, check_out, total_amount, status, special_requests)
            VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`,
            [userId, room_id, check_in, check_out, total, special_requests || null]
        );

        res.status(201).json({
            message: 'Booking confirmed successfully!',
            booking_id: result.insertId,
            room_number: room.room_number,
            room_type: room.room_type,
            check_in,
            check_out,
            nights: days,
            total_amount: total
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            message: 'Booking could not be processed due to a server error.',
            error: error.message
        });
    }
};

// Get bookings for the currently authenticated user
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const [bookings] = await db.execute(
            `SELECT b.id, b.check_in, b.check_out, b.total_amount, b.status, b.special_requests, b.created_at,
                    r.id as room_id, r.room_number, r.room_type, r.price, r.image_url
             FROM bookings b
             JOIN rooms r ON b.room_id = r.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [userId]
        );

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Error retrieving your bookings.' });
    }
};

// Get all bookings (Admin only)
exports.getAllBookings = async (req, res) => {
    try {
        const [bookings] = await db.execute(
            `SELECT b.id, b.check_in, b.check_out, b.total_amount, b.status, b.special_requests, b.created_at,
                    u.name as user_name, u.email as user_email, u.phone as user_phone,
                    r.room_number, r.room_type, r.price as room_price
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             ORDER BY b.created_at DESC`
        );

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ message: 'Error retrieving all bookings.' });
    }
};

// Cancel a booking (User for their own, or Admin)
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        let query = 'SELECT * FROM bookings WHERE id = ?';
        let params = [bookingId];

        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const [bookings] = await db.execute(query, params);

        if (bookings.length === 0) {
            return res.status(404).json({
                message: 'Booking not found or you are not authorized to cancel it.'
            });
        }

        const booking = bookings[0];

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'This booking is already cancelled.' });
        }

        await db.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            ['cancelled', bookingId]
        );

        res.json({ message: 'Booking has been cancelled successfully.' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ message: 'Error processing cancellation.' });
    }
};

// Update booking status (Admin only)
exports.updateBookingStatus = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;

        const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${allowed.join(', ')}`
            });
        }

        const [result] = await db.execute(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        res.json({ message: `Booking status updated to ${status}.` });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Error updating booking status.' });
    }
};

// Get Dashboard Overview Statistics (Admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        const [[roomsCount]] = await db.execute('SELECT COUNT(*) as total FROM rooms');
        const [[availableRooms]] = await db.execute("SELECT COUNT(*) as total FROM rooms WHERE status = 'available'");
        const [[bookingsCount]] = await db.execute('SELECT COUNT(*) as total FROM bookings');
        const [[confirmedCount]] = await db.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed'");
        const [[usersCount]] = await db.execute("SELECT COUNT(*) as total FROM users WHERE role = 'user'");
        const [[revenueResult]] = await db.execute(
            "SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM bookings WHERE status IN ('confirmed', 'completed')"
        );

        res.json({
            totalRooms: roomsCount.total,
            availableRooms: availableRooms.total,
            totalBookings: bookingsCount.total,
            confirmedBookings: confirmedCount.total,
            totalUsers: usersCount.total,
            totalRevenue: Number(revenueResult.totalRevenue)
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats.' });
    }
};
