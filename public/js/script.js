/**
 * Grand Hotel Management System - Core Client-Side Logic
 */

// ==========================================
// Authentication & Storage Helpers
// ==========================================
function getToken() {
    return localStorage.getItem('hotel_token');
}

function getUser() {
    try {
        const userStr = localStorage.getItem('hotel_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

function setAuth(token, user) {
    localStorage.setItem('hotel_token', token);
    localStorage.setItem('hotel_user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_user');
}

function logout() {
    clearAuth();
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 600);
}

function authHeaders() {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ==========================================
// Toast Notification System
// ==========================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// Dynamic Navbar Updater
// ==========================================
function renderNavbar() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const user = getUser();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const isActive = (page) => {
        return (currentPage === page || (currentPage === '' && page === 'index.html')) ? 'class="active"' : '';
    };

    let html = `
        <a href="index.html" ${isActive('index.html')}>Home</a>
        <a href="rooms.html" ${isActive('rooms.html')}>Rooms</a>
        <a href="booking.html" class="btn-nav">Book Now</a>
    `;

    if (user) {
        html += `
            <a href="dashboard.html" ${isActive('dashboard.html')}>Dashboard</a>
            <div class="user-badge">
                <div class="user-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <span class="user-name">${user.name.split(' ')[0]}</span>
                ${user.role === 'admin' ? '<span class="badge badge-admin" style="font-size: 10px; padding: 2px 6px;">Admin</span>' : ''}
            </div>
            <button onclick="logout()" class="btn-logout" title="Sign Out">Logout</button>
        `;
    } else {
        html += `
            <a href="login.html" ${isActive('login.html')}>Login</a>
            <a href="register.html" ${isActive('register.html')}>Register</a>
        `;
    }

    nav.innerHTML = html;
}

// ==========================================
// Utility Date Helpers
// ==========================================
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ==========================================
// Page: Index (Home)
// ==========================================
async function initIndexPage() {
    const featuredContainer = document.getElementById('featured-rooms');
    if (!featuredContainer) return;

    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to load rooms');
        const rooms = await response.json();

        // Show top 3 featured rooms
        const featured = rooms.slice(0, 3);
        featuredContainer.innerHTML = '';

        featured.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-image-wrapper">
                    <img src="${room.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}" alt="${room.room_type}" class="room-image">
                    <span class="badge badge-${room.status} room-status-badge">${room.status}</span>
                    <span class="room-number-tag">Room #${room.room_number}</span>
                </div>
                <div class="room-content">
                    <h3 class="room-title">${room.room_type}</h3>
                    <p class="room-desc">${room.description || 'Premium hotel accommodation with modern amenities.'}</p>
                    <div class="room-meta">
                        <div class="room-meta-item">👥 Up to ${room.capacity} Guests</div>
                        <div class="room-meta-item">✨ Free WiFi & AC</div>
                    </div>
                    <div class="room-footer">
                        <div class="room-price">₹${Number(room.price).toLocaleString('en-IN')} <span>/ night</span></div>
                        <a href="booking.html?room_id=${room.id}" class="btn btn-sm">Reserve</a>
                    </div>
                </div>
            `;
            featuredContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading featured rooms:', err);
    }
}

// ==========================================
// Page: Rooms Listing
// ==========================================
async function loadRooms(filterQuery = '') {
    const container = document.getElementById('rooms');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Loading available accommodations...</div>';

    try {
        const url = `/api/rooms${filterQuery ? '?' + filterQuery : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load rooms');
        const rooms = await response.json();

        if (rooms.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                    <h3>No rooms match your search criteria</h3>
                    <p style="color: #64748b; margin: 10px 0 20px;">Try adjusting your filters or price range to find available rooms.</p>
                    <button onclick="resetFilters()" class="btn btn-secondary">Clear Filters</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';

            const isAvailable = room.status === 'available';

            card.innerHTML = `
                <div class="room-image-wrapper">
                    <img src="${room.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}" alt="${room.room_type}" class="room-image">
                    <span class="badge badge-${room.status} room-status-badge">${room.status}</span>
                    <span class="room-number-tag">Room #${room.room_number}</span>
                </div>
                <div class="room-content">
                    <h3 class="room-title">${room.room_type}</h3>
                    <p class="room-desc">${room.description || 'Spacious, elegant living space equipped with modern hospitality conveniences.'}</p>
                    <div class="room-meta">
                        <div class="room-meta-item">👥 ${room.capacity} Guest${room.capacity > 1 ? 's' : ''}</div>
                        <div class="room-meta-item">🛏️ King Bed</div>
                        <div class="room-meta-item">📶 High-Speed WiFi</div>
                    </div>
                    <div class="room-footer">
                        <div class="room-price">₹${Number(room.price).toLocaleString('en-IN')} <span>/ night</span></div>
                        ${isAvailable 
                            ? `<a href="booking.html?room_id=${room.id}" class="btn">Book Now</a>`
                            : `<button class="btn btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed;">Unavailable</button>`
                        }
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
                <p>Failed to connect to the database or retrieve rooms.</p>
                <p style="font-size: 13px; color: #64748b; margin-top: 6px;">Ensure MySQL service is running and server is connected.</p>
            </div>
        `;
    }
}

function handleRoomFilters(e) {
    if (e) e.preventDefault();
    const type = document.getElementById('filter-type')?.value;
    const maxPrice = document.getElementById('filter-price')?.value;
    const capacity = document.getElementById('filter-capacity')?.value;
    const search = document.getElementById('filter-search')?.value;

    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (capacity && capacity !== 'all') params.append('capacity', capacity);
    if (search) params.append('search', search.trim());

    loadRooms(params.toString());
}

function resetFilters() {
    const form = document.getElementById('filter-form');
    if (form) form.reset();
    loadRooms('');
}

// ==========================================
// Page: Booking
// ==========================================
let allRoomsList = [];

async function initBookingPage() {
    const roomSelect = document.getElementById('room_id');
    const checkInInput = document.getElementById('check_in');
    const checkOutInput = document.getElementById('check_out');

    if (!roomSelect || !checkInInput || !checkOutInput) return;

    // Set minimum dates
    const today = getTodayString();
    const tomorrow = getTomorrowString();
    checkInInput.min = today;
    checkInInput.value = today;
    checkOutInput.min = tomorrow;
    checkOutInput.value = tomorrow;

    // Check if user is logged in
    const user = getUser();
    const guestNotice = document.getElementById('guest-auth-notice');
    if (guestNotice) {
        if (!user) {
            guestNotice.innerHTML = `
                <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
                    ⚠️ You are not logged in. <a href="login.html" style="font-weight: 700; color: #b45309;">Log in</a> or <a href="register.html" style="font-weight: 700; color: #b45309;">Register</a> to confirm your booking effortlessly!
                </div>
            `;
        } else {
            guestNotice.innerHTML = `
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
                    ✓ Booking as <strong>${user.name}</strong> (${user.email})
                </div>
            `;
        }
    }

    try {
        const response = await fetch('/api/rooms');
        allRoomsList = await response.json();

        roomSelect.innerHTML = '<option value="">-- Choose a Room --</option>';
        allRoomsList.forEach(room => {
            const opt = document.createElement('option');
            opt.value = room.id;
            opt.textContent = `${room.room_type} (Room #${room.room_number}) - ₹${Number(room.price).toLocaleString('en-IN')}/night`;
            if (room.status !== 'available') {
                opt.textContent += ` [${room.status.toUpperCase()}]`;
                opt.disabled = true;
            }
            roomSelect.appendChild(opt);
        });

        // Preselect room from URL query param if present
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedRoomId = urlParams.get('room_id');
        if (preselectedRoomId) {
            roomSelect.value = preselectedRoomId;
        } else if (allRoomsList.length > 0) {
            // Select first available room
            const firstAvailable = allRoomsList.find(r => r.status === 'available');
            if (firstAvailable) roomSelect.value = firstAvailable.id;
        }

        updateBookingSummary();

        // Attach listeners
        roomSelect.addEventListener('change', updateBookingSummary);
        checkInInput.addEventListener('change', () => {
            // Adjust check_out min date
            const inDate = new Date(checkInInput.value);
            inDate.setDate(inDate.getDate() + 1);
            checkOutInput.min = inDate.toISOString().split('T')[0];
            if (new Date(checkOutInput.value) <= new Date(checkInInput.value)) {
                checkOutInput.value = checkOutInput.min;
            }
            updateBookingSummary();
        });
        checkOutInput.addEventListener('change', updateBookingSummary);

    } catch (err) {
        console.error('Error initializing booking page:', err);
    }

    // Handle Form Submit
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
}

function updateBookingSummary() {
    const roomSelect = document.getElementById('room_id');
    const checkInInput = document.getElementById('check_in');
    const checkOutInput = document.getElementById('check_out');

    const summaryRoom = document.getElementById('summary-room-name');
    const summaryRate = document.getElementById('summary-rate');
    const summaryNights = document.getElementById('summary-nights');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTaxes = document.getElementById('summary-taxes');
    const summaryTotal = document.getElementById('summary-total');
    const summaryImg = document.getElementById('summary-img');

    if (!roomSelect || !summaryRoom) return;

    const selectedRoom = allRoomsList.find(r => String(r.id) === String(roomSelect.value));

    if (!selectedRoom) {
        summaryRoom.textContent = 'Please choose a room';
        summaryRate.textContent = '₹0';
        summaryNights.textContent = '0 nights';
        summarySubtotal.textContent = '₹0';
        summaryTaxes.textContent = '₹0';
        summaryTotal.textContent = '₹0';
        return;
    }

    summaryRoom.textContent = `${selectedRoom.room_type} (Room #${selectedRoom.room_number})`;
    summaryRate.textContent = `₹${Number(selectedRoom.price).toLocaleString('en-IN')}`;
    if (summaryImg && selectedRoom.image_url) {
        summaryImg.src = selectedRoom.image_url;
    }

    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    
    let nights = 1;
    if (checkOut > checkIn) {
        const diff = Math.abs(checkOut - checkIn);
        nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const subtotal = nights * Number(selectedRoom.price);
    const taxes = 0; // Inclusive of taxes
    const total = subtotal + taxes;

    summaryNights.textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    summarySubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    summaryTaxes.textContent = `Included`;
    summaryTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
}

async function handleBookingSubmit(e) {
    e.preventDefault();

    const user = getUser();
    if (!user) {
        showToast('Please log in or register before booking a room', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=booking.html';
        }, 1200);
        return;
    }

    const roomId = document.getElementById('room_id').value;
    const checkIn = document.getElementById('check_in').value;
    const checkOut = document.getElementById('check_out').value;
    const specialRequests = document.getElementById('special_requests')?.value || '';

    if (!roomId) {
        showToast('Please select a room', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submit-booking-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Confirming Reservation...';
    }

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                user_id: user.id,
                room_id: Number(roomId),
                check_in: checkIn,
                check_out: checkOut,
                special_requests: specialRequests
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Booking failed');
        }

        showToast('Booking Confirmed Successfully!', 'success');

        // Redirect to dashboard after 1.2s
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);

    } catch (err) {
        showToast(err.message, 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Reservation';
        }
    }
}

// ==========================================
// Page: Login & Register
// ==========================================
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('login-btn');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setAuth(data.token, data.user);
            showToast(`Welcome back, ${data.user.name}!`, 'success');

            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'dashboard.html';

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 800);

        } catch (err) {
            showToast(err.message, 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        }
    });
}

function fillDemoCredentials(email, password) {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = password;
        showToast(`Filled credentials for ${email}`, 'info');
    }
}

function initRegisterPage() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const submitBtn = document.getElementById('register-btn');

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setAuth(data.token, data.user);
            showToast('Account created successfully! Welcome to Grand Hotel.', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (err) {
            showToast(err.message, 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        }
    });
}

// ==========================================
// Page: Dashboard
// ==========================================
async function initDashboardPage() {
    const user = getUser();
    if (!user || !getToken()) {
        showToast('Please log in to access your dashboard', 'warning');
        window.location.href = 'login.html?redirect=dashboard.html';
        return;
    }

    // Set Welcome Header
    const welcomeName = document.getElementById('dash-user-name');
    const userEmail = document.getElementById('dash-user-email');
    const userRoleBadge = document.getElementById('dash-user-role');
    const avatarEl = document.getElementById('dash-avatar');

    if (welcomeName) welcomeName.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (userRoleBadge) {
        userRoleBadge.className = `badge badge-${user.role}`;
        userRoleBadge.textContent = user.role.toUpperCase();
    }

    // Always load user's personal bookings
    loadMyBookings();

    // If Admin, show Admin statistics & Admin controls
    if (user.role === 'admin') {
        const adminSection = document.getElementById('admin-section');
        if (adminSection) adminSection.style.display = 'block';

        const adminTabBtns = document.querySelectorAll('.admin-only-tab');
        adminTabBtns.forEach(btn => btn.style.display = 'inline-block');

        loadAdminStats();
        loadAllBookings();
        loadAdminRooms();
    }
}

async function loadMyBookings() {
    const tbody = document.getElementById('my-bookings-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Loading reservations...</td></tr>';

    try {
        const response = await fetch('/api/bookings/my', {
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch bookings');
        const bookings = await response.json();

        if (bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                        You have no room reservations yet.
                        <div style="margin-top: 10px;">
                            <a href="rooms.html" class="btn btn-sm">Browse Rooms & Book Now</a>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            const canCancel = b.status === 'confirmed' || b.status === 'pending';

            tr.innerHTML = `
                <td><strong>#${b.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${b.room_type}</div>
                    <div style="font-size: 12px; color: #64748b;">Room #${b.room_number}</div>
                </td>
                <td>${formatDate(b.check_in)}</td>
                <td>${formatDate(b.check_out)}</td>
                <td><strong>₹${Number(b.total_amount).toLocaleString('en-IN')}</strong></td>
                <td><span class="badge badge-${b.status}">${b.status}</span></td>
                <td>
                    ${canCancel 
                        ? `<button onclick="cancelBooking(${b.id})" class="btn btn-danger btn-sm">Cancel</button>` 
                        : `<span style="color: #94a3b8; font-size: 12px;">Completed</span>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">${err.message}</td></tr>`;
    }
}

async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
        const response = await fetch(`/api/bookings/${id}/cancel`, {
            method: 'POST',
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to cancel booking');

        showToast('Reservation cancelled successfully', 'success');
        loadMyBookings();
        if (getUser()?.role === 'admin') {
            loadAdminStats();
            loadAllBookings();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ------------------------------------------
// Admin Functions
// ------------------------------------------
async function loadAdminStats() {
    try {
        const response = await fetch('/api/bookings/stats', {
            headers: authHeaders()
        });
        if (!response.ok) return;

        const stats = await response.json();

        const statRooms = document.getElementById('stat-total-rooms');
        const statBookings = document.getElementById('stat-total-bookings');
        const statConfirmed = document.getElementById('stat-confirmed-bookings');
        const statRevenue = document.getElementById('stat-total-revenue');

        if (statRooms) statRooms.textContent = stats.totalRooms;
        if (statBookings) statBookings.textContent = stats.totalBookings;
        if (statConfirmed) statConfirmed.textContent = stats.confirmedBookings;
        if (statRevenue) statRevenue.textContent = `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`;

    } catch (err) {
        console.error('Error loading admin stats:', err);
    }
}

async function loadAllBookings() {
    const tbody = document.getElementById('all-bookings-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px;">Loading all guest bookings...</td></tr>';

    try {
        const response = await fetch('/api/bookings/all', {
            headers: authHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch all bookings');
        const bookings = await response.json();

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">No bookings found across the system.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${b.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${b.user_name}</div>
                    <div style="font-size: 12px; color: #64748b;">${b.user_email}</div>
                </td>
                <td>${b.room_type} (#${b.room_number})</td>
                <td>${formatDate(b.check_in)}</td>
                <td>${formatDate(b.check_out)}</td>
                <td><strong>₹${Number(b.total_amount).toLocaleString('en-IN')}</strong></td>
                <td>
                    <select onchange="updateBookingStatus(${b.id}, this.value)" class="form-control" style="padding: 4px 8px; font-size: 12px; width: auto;">
                        <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </td>
                <td>
                    <button onclick="cancelBooking(${b.id})" class="btn btn-danger btn-sm" ${b.status === 'cancelled' ? 'disabled style="opacity:0.4;"' : ''}>Cancel</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 20px;">${err.message}</td></tr>`;
    }
}

async function updateBookingStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/bookings/${id}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Status update failed');

        showToast(data.message, 'success');
        loadAdminStats();
    } catch (err) {
        showToast(err.message, 'error');
        loadAllBookings();
    }
}

async function loadAdminRooms() {
    const tbody = document.getElementById('admin-rooms-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Loading rooms...</td></tr>';

    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to load rooms');
        const rooms = await response.json();

        tbody.innerHTML = '';
        rooms.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${r.room_number}</strong></td>
                <td>
                    <div style="font-weight: 600;">${r.room_type}</div>
                    <div style="font-size: 12px; color: #64748b;">${r.description ? r.description.slice(0, 45) + '...' : ''}</div>
                </td>
                <td>👥 ${r.capacity} Guests</td>
                <td><strong>₹${Number(r.price).toLocaleString('en-IN')}</strong></td>
                <td><span class="badge badge-${r.status}">${r.status}</span></td>
                <td>
                    <button onclick="deleteRoom(${r.id})" class="btn btn-danger btn-sm">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">${err.message}</td></tr>`;
    }
}

async function deleteRoom(id) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
        const response = await fetch(`/api/rooms/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete room');

        showToast(data.message, 'success');
        loadAdminRooms();
        loadAdminStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openAddRoomModal() {
    const modal = document.getElementById('add-room-modal');
    if (modal) modal.classList.add('active');
}

function closeAddRoomModal() {
    const modal = document.getElementById('add-room-modal');
    if (modal) modal.classList.remove('active');
}

async function handleAddRoomSubmit(e) {
    e.preventDefault();

    const room_number = document.getElementById('new-room-number').value.trim();
    const room_type = document.getElementById('new-room-type').value;
    const price = document.getElementById('new-room-price').value;
    const capacity = document.getElementById('new-room-capacity').value;
    const description = document.getElementById('new-room-desc').value.trim();
    const image_url = document.getElementById('new-room-image').value.trim();

    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                room_number,
                room_type,
                price: Number(price),
                capacity: Number(capacity),
                description,
                image_url
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add room');

        showToast(data.message, 'success');
        closeAddRoomModal();
        document.getElementById('add-room-form').reset();
        loadAdminRooms();
        loadAdminStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function switchDashboardTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// ==========================================
// Initialization Router on DOM Ready
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();

    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        initIndexPage();
    } else if (path.endsWith('rooms.html') || path.endsWith('/rooms')) {
        loadRooms();
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', handleRoomFilters);
            filterForm.addEventListener('change', handleRoomFilters);
        }
    } else if (path.endsWith('booking.html') || path.endsWith('/booking')) {
        initBookingPage();
    } else if (path.endsWith('login.html') || path.endsWith('/login')) {
        initLoginPage();
    } else if (path.endsWith('register.html') || path.endsWith('/register')) {
        initRegisterPage();
    } else if (path.endsWith('dashboard.html') || path.endsWith('/dashboard')) {
        initDashboardPage();
    }
});
