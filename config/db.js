require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'hotel_managements',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create Promise-based connection pool
const pool = mysql.createPool(dbConfig);

// Initialize Database & Tables automatically on start
async function initDatabase() {
    let rootConn;
    try {
        // First connect without specifying database to ensure DB exists
        rootConn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.end();

        // Connect to the database pool and ensure tables exist
        const connection = await pool.getConnection();

        // 1. Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                phone VARCHAR(20) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Rooms Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_number VARCHAR(20) NOT NULL UNIQUE,
                room_type VARCHAR(50) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                capacity INT NOT NULL DEFAULT 2,
                description TEXT,
                image_url VARCHAR(500) DEFAULT NULL,
                status ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 3. Bookings Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                room_id INT NOT NULL,
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
                special_requests TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Seed Admin User if none exists
        const [adminRows] = await connection.query('SELECT id FROM users WHERE role = ?', ['admin']);
        if (adminRows.length === 0) {
            const adminPassword = await bcrypt.hash('Admin@123', 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, phone)
                 VALUES (?, ?, ?, ?, ?)`,
                ['Hotel Administrator', 'admin@hotel.com', adminPassword, 'admin', '+91 9876543210']
            );
            console.log('✓ Seeded default admin: admin@hotel.com (Password: Admin@123)');
        }

        // Seed Demo Guest User if none exists
        const [guestRows] = await connection.query('SELECT id FROM users WHERE email = ?', ['guest@hotel.com']);
        if (guestRows.length === 0) {
            const guestPassword = await bcrypt.hash('Guest@123', 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, phone)
                 VALUES (?, ?, ?, ?, ?)`,
                ['Demo Guest', 'guest@hotel.com', guestPassword, 'user', '+91 9123456780']
            );
            console.log('✓ Seeded demo guest: guest@hotel.com (Password: Guest@123)');
        }

        // Seed Rooms if empty
        const [roomRows] = await connection.query('SELECT COUNT(*) as count FROM rooms');
        if (roomRows[0].count === 0) {
            const sampleRooms = [
                ['101', 'Single Deluxe Room', 1999.00, 1, 'Cozy single room with high-speed WiFi, smart TV, ergonomic desk, and en-suite marble bathroom.', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', 'available'],
                ['102', 'Executive Double Room', 3499.00, 2, 'Spacious double bed room featuring contemporary decor, city views, mini-bar, and rainfall shower.', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'available'],
                ['201', 'Luxury Suite', 5999.00, 2, 'Elegant suite with private living area, king size bed, complimentary breakfast, and scenic skyline balcony.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'available'],
                ['202', 'Premium Ocean View Suite', 7499.00, 3, 'Breathtaking ocean view suite with master bedroom, soaking tub, ambient lighting, and 24/7 butler service.', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', 'available'],
                ['301', 'Royal Family Suite', 9999.00, 4, 'Expansive multi-room suite tailored for families, featuring two master bedrooms, kitchenette, and play area.', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', 'available'],
                ['302', 'Presidential Penthouse Suite', 14999.00, 4, 'The pinnacle of luxury with panoramic penthouse terrace, jacuzzi, private dining, and VIP lounge access.', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', 'available']
            ];

            for (const room of sampleRooms) {
                await connection.query(
                    `INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    room
                );
            }
            console.log('✓ Seeded 6 sample hotel rooms successfully.');
        }

        connection.release();
        console.log('✓ MySQL Connected & Database Initialized Successfully!');
        return true;
    } catch (err) {
        console.error('⚠️  Database Connection / Initialization Warning:');
        console.error(`   Message: ${err.message}`);
        console.error('   👉 Tip: Ensure MySQL server (e.g., XAMPP or MySQL Service) is running,');
        console.error('      and credentials in hotel-management/.env match your MySQL settings.');
        return false;
    }
}

// Export the pool directly so existing db.execute / db.query code works seamlessly
module.exports = pool;
module.exports.initDatabase = initDatabase;
