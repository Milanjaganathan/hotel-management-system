# 🏨 Grand Hotel Management System

A full-stack Hotel Management & Reservation System built with **Node.js**, **Express 5**, **MySQL**, **JWT Authentication**, and modern responsive **Vanilla JavaScript & CSS**.

---

## ✨ Features

- **Guest Portal**:
  - 🏠 **Luxury Homepage**: Hero section, quick room availability checker, featured suites, and amenities.
  - 🛏️ **Room Explorer**: Filter rooms by category, price range, guest capacity, and keywords with real-time UI updates.
  - 📅 **Interactive Booking Engine**: Dynamic nights & price calculation, special requests, and instant reservation confirmation.
  - 👤 **Guest Dashboard**: View booking history, booking status badges (`confirmed`, `pending`, `cancelled`, `completed`), and self-service reservation cancellation.
- **Admin Portal**:
  - 📊 **Executive Analytics**: Real-time counters for Total Rooms, Available Rooms, Total Reservations, Confirmed Stays, and Total Revenue.
  - 📋 **Reservation Management**: View all customer reservations and update statuses (`confirmed`, `completed`, `cancelled`).
  - ➕ **Room Management**: Add new rooms with pricing, capacity, category, image URL, and descriptions, or delete rooms.
- **Security & Architecture**:
  - 🔐 **JWT Token Authentication** with Bearer authorization and role-based access control (`admin` vs `user`).
  - 🛡️ **Bcryptjs Password Hashing** (10 salt rounds).
  - 🗄️ **MySQL Connection Pooling** via `mysql2/promise` with automatic database & table initialization.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v16 or higher)
- **MySQL / XAMPP**: Ensure MySQL service is running.

### 2. Database & Environment Configuration
The system includes `.env` pre-configured to connect to your MySQL database. If using XAMPP on port 3307:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hotel_managements
DB_PORT=3307
JWT_SECRET=hotel_management_super_secret_jwt_key_2026
```

### 3. Initialize Database (Automatic or Manual)
The server automatically creates the database, all tables, and seeds initial data on boot. You can also run the setup manually:
```bash
npm run setup-db
```

### 4. Start the Application
```bash
# Start server
npm start

# Or with nodemon for development
npm run dev
```

Visit the application in your browser:
👉 **http://localhost:5000**

---

## 🔑 Default Credentials

The system comes pre-seeded with two ready-to-use accounts:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@hotel.com` | `Admin@123` |
| **Demo Guest** | `guest@hotel.com` | `Guest@123` |

*(You can also click the quick demo buttons on the login screen to autofill credentials instantly)*

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate user & retrieve JWT token
- `GET /api/auth/me` - Get current user profile *(Requires Token)*
- `PUT /api/auth/profile` - Update user details *(Requires Token)*

### 🛏️ Rooms (`/api/rooms`)
- `GET /api/rooms` - Get all rooms with optional filters (`type`, `capacity`, `maxPrice`, `search`)
- `GET /api/rooms/:id` - Get room details by ID
- `POST /api/rooms` - Add a new room *(Admin only)*
- `PUT /api/rooms/:id` - Update room details *(Admin only)*
- `DELETE /api/rooms/:id` - Delete room *(Admin only)*

### 📅 Bookings (`/api/bookings`)
- `POST /api/bookings` - Create a new reservation
- `GET /api/bookings/my` - Get logged-in user's reservations *(Requires Token)*
- `GET /api/bookings/all` - Get all reservations across the hotel *(Admin only)*
- `GET /api/bookings/stats` - Get summary statistics and total revenue *(Admin only)*
- `POST /api/bookings/:id/cancel` - Cancel a reservation *(User/Admin)*
- `PUT /api/bookings/:id/status` - Update booking status *(Admin only)*

---

## 🗃️ Database Schema

The database `hotel_managements` consists of 3 relational tables:
1. `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `created_at`)
2. `rooms` (`id`, `room_number`, `room_type`, `price`, `capacity`, `description`, `image_url`, `status`, `created_at`)
3. `bookings` (`id`, `user_id`, `room_id`, `check_in`, `check_out`, `total_amount`, `status`, `special_requests`, `created_at`)

A standalone SQL script is also available at `database.sql` for manual import via phpMyAdmin or MySQL Workbench.
