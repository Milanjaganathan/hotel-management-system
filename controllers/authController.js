const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_management_super_secret_jwt_key_2026';

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required fields.'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                message: 'Please provide a valid email address.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Check if user already exists
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [trimmedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, 'user', ?)
        `;

        const [result] = await db.execute(sql, [name.trim(), trimmedEmail, hashedPassword, phone || null]);

        const newUserId = result.insertId;

        // Generate JWT token
        const token = jwt.sign(
            { id: newUserId, role: 'user', email: trimmedEmail, name: name.trim() },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful! Welcome to Grand Hotel.',
            token,
            user: {
                id: newUserId,
                name: name.trim(),
                email: trimmedEmail,
                role: 'user',
                phone: phone || null
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed due to a server error.',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [trimmedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error during login.',
            error: error.message
        });
    }
};

// Get current logged-in user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.execute(
            'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.json({
            user: users[0]
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Error fetching user profile.' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name cannot be empty.' });
        }

        await db.execute(
            'UPDATE users SET name = ?, phone = ? WHERE id = ?',
            [name.trim(), phone || null, userId]
        );

        res.json({
            message: 'Profile updated successfully.'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile.' });
    }
};
