const db = require('../config/db');

// Get all rooms (with optional filters)
exports.getRooms = async (req, res) => {
    try {
        const { type, status, maxPrice, capacity, search } = req.query;

        let query = 'SELECT * FROM rooms WHERE 1=1';
        const params = [];

        if (type && type !== 'all') {
            query += ' AND room_type = ?';
            params.push(type);
        }

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        if (maxPrice) {
            query += ' AND price <= ?';
            params.push(Number(maxPrice));
        }

        if (capacity) {
            query += ' AND capacity >= ?';
            params.push(Number(capacity));
        }

        if (search) {
            query += ' AND (room_type LIKE ? OR room_number LIKE ? OR description LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY price ASC';

        const [rooms] = await db.execute(query, params);
        res.json(rooms);

    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({
            message: 'Unable to fetch rooms.',
            error: error.message
        });
    }
};

// Get single room by ID
exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rooms] = await db.execute('SELECT * FROM rooms WHERE id = ?', [id]);

        if (rooms.length === 0) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        res.json(rooms[0]);
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ message: 'Error retrieving room details.' });
    }
};

// Add new room (Admin only)
exports.addRoom = async (req, res) => {
    try {
        const {
            room_number,
            room_type,
            price,
            capacity,
            description,
            image_url,
            status
        } = req.body;

        if (!room_number || !room_type || !price || !capacity) {
            return res.status(400).json({
                message: 'Room number, type, price, and capacity are required.'
            });
        }

        // Check if room_number already exists
        const [existing] = await db.execute(
            'SELECT id FROM rooms WHERE room_number = ?',
            [room_number]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: `Room number ${room_number} already exists.`
            });
        }

        const defaultImage = image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
        const roomStatus = status || 'available';

        const [result] = await db.execute(
            `INSERT INTO rooms
            (room_number, room_type, price, capacity, description, image_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [room_number, room_type, Number(price), Number(capacity), description || '', defaultImage, roomStatus]
        );

        res.status(201).json({
            message: 'Room added successfully!',
            roomId: result.insertId
        });

    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({
            message: 'Unable to add room.',
            error: error.message
        });
    }
};

// Update room (Admin only)
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            room_type,
            price,
            capacity,
            description,
            image_url,
            status
        } = req.body;

        const [existing] = await db.execute('SELECT * FROM rooms WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        await db.execute(
            `UPDATE rooms
             SET room_type = COALESCE(?, room_type),
                 price = COALESCE(?, price),
                 capacity = COALESCE(?, capacity),
                 description = COALESCE(?, description),
                 image_url = COALESCE(?, image_url),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [room_type, price, capacity, description, image_url, status, id]
        );

        res.json({ message: 'Room updated successfully.' });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Error updating room.' });
    }
};

// Delete room (Admin only)
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if there are active bookings
        const [activeBookings] = await db.execute(
            `SELECT id FROM bookings WHERE room_id = ? AND status IN ('pending', 'confirmed')`,
            [id]
        );

        if (activeBookings.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete room with active or confirmed bookings. Cancel them first or mark room as maintenance.'
            });
        }

        const [result] = await db.execute('DELETE FROM rooms WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        res.json({ message: 'Room deleted successfully.' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Error deleting room.' });
    }
};
