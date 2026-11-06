-- Hotel Management System Database Schema
CREATE DATABASE IF NOT EXISTS hotel_managements CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_managements;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Rooms Table
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

-- 3. Bookings Table
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

-- Seed Default Admin (Password: Admin@123)
-- bcrypt hash for 'Admin@123': $2a$10$wEkgj9Xp7GvU9X1r04w4..h72uP8t9Zt6HnQjU1rS6t49L/GgX1O2
INSERT INTO users (name, email, password, role, phone)
SELECT 'Hotel Administrator', 'admin@hotel.com', '$2a$10$wEkgj9Xp7GvU9X1r04w4..h72uP8t9Zt6HnQjU1rS6t49L/GgX1O2', 'admin', '+91 9876543210'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hotel.com');

-- Seed Default Guest User (Password: Guest@123)
-- bcrypt hash for 'Guest@123': $2a$10$7r7rF793Y1B9.2.V2h2Ww.XfFvCg2d8N9V0L6tGq8p3U9mZ1sXyZa
INSERT INTO users (name, email, password, role, phone)
SELECT 'Demo Guest', 'guest@hotel.com', '$2a$10$ZkR8x17pU92hWc3N0mYfFeL7H2tGq9x3P8vU1rS6t49L/GgX1O2', 'user', '+91 9123456780'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'guest@hotel.com');

-- Seed Sample Rooms
INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '101', 'Single Deluxe Room', 1999.00, 1, 'Cozy single room with high-speed WiFi, smart TV, ergonomic desk, and en-suite marble bathroom.', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '101');

INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '102', 'Executive Double Room', 3499.00, 2, 'Spacious double bed room featuring contemporary decor, city views, mini-bar, and rainfall shower.', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '102');

INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '201', 'Luxury Suite', 5999.00, 2, 'Elegant suite with private living area, king size bed, complimentary breakfast, and scenic skyline balcony.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '201');

INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '202', 'Premium Ocean View Suite', 7499.00, 3, 'Breathtaking ocean view suite with master bedroom, soaking tub, ambient lighting, and 24/7 butler service.', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '202');

INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '301', 'Royal Family Suite', 9999.00, 4, 'Expansive multi-room suite tailored for families, featuring two master bedrooms, kitchenette, and play area.', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '301');

INSERT INTO rooms (room_number, room_type, price, capacity, description, image_url, status)
SELECT '302', 'Presidential Penthouse Suite', 14999.00, 4, 'The pinnacle of luxury with panoramic penthouse terrace, jacuzzi, private dining, and VIP lounge access.', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', 'available'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '302');
