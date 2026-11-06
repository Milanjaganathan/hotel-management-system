const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_management_super_secret_jwt_key_2026';

// Middleware to verify if request has a valid JWT token
exports.verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];

        if (!authHeader) {
            return res.status(401).json({
                message: 'Access denied. No authorization token provided.'
            });
        }

        // Handle 'Bearer <token>' or raw token
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        if (!token) {
            return res.status(401).json({
                message: 'Invalid authorization token format.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Session expired or invalid token. Please log in again.',
            error: error.message
        });
    }
};

// Middleware to verify if authenticated user has admin role
exports.verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Access denied: Admin privileges are required for this action.'
        });
    }
    next();
};

// Optional auth: attaches user if token is present, continues otherwise
exports.optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7).trim()
                : authHeader.trim();
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
            }
        }
    } catch (err) {
        // Silently ignore if optional token is invalid
    }
    next();
};
