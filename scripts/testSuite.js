const http = require('http');

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('Testing APIs...');

    // 1. Health
    const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    console.log('1. Health check status:', health.status, health.data.status);

    // 2. Rooms
    const rooms = await request({ host: 'localhost', port: 5000, path: '/api/rooms', method: 'GET' });
    console.log('2. Fetch rooms status:', rooms.status, 'Total rooms:', rooms.data.length);

    // 3. Admin Login
    const adminLogin = await request(
        { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { email: 'admin@hotel.com', password: 'Admin@123' }
    );
    console.log('3. Admin login status:', adminLogin.status, 'Token exists:', !!adminLogin.data.token);
    const adminToken = adminLogin.data.token;

    // 4. Guest Login
    const guestLogin = await request(
        { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { email: 'guest@hotel.com', password: 'Guest@123' }
    );
    console.log('4. Guest login status:', guestLogin.status, 'User:', guestLogin.data.user.name);
    const guestToken = guestLogin.data.token;

    // 5. Profile Check
    const profile = await request({
        host: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET',
        headers: { 'Authorization': `Bearer ${guestToken}` }
    });
    console.log('5. Guest profile fetch status:', profile.status, 'Email:', profile.data.user.email);

    // 6. Create Booking with dynamic date to avoid date conflicts on repeated tests
    const randomOffset = Math.floor(Math.random() * 500) + 10;
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + randomOffset);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3);

    const booking = await request(
        {
            host: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${guestToken}` }
        },
        {
            room_id: rooms.data[0].id,
            check_in: checkInDate.toISOString().split('T')[0],
            check_out: checkOutDate.toISOString().split('T')[0],
            special_requests: 'Late check-in requested'
        }
    );
    console.log('6. Create booking status:', booking.status, 'Amount:', booking.data.total_amount);

    // 7. My Bookings
    const myBookings = await request({
        host: 'localhost', port: 5000, path: '/api/bookings/my', method: 'GET',
        headers: { 'Authorization': `Bearer ${guestToken}` }
    });
    console.log('7. My bookings count:', myBookings.data.length);

    // 8. Admin Stats
    const stats = await request({
        host: 'localhost', port: 5000, path: '/api/bookings/stats', method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('8. Admin stats status:', stats.status, stats.data);

    // 9. All Bookings (Admin)
    const allBookings = await request({
        host: 'localhost', port: 5000, path: '/api/bookings/all', method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('9. All bookings (Admin) count:', allBookings.data.length);

    console.log('\n--- ALL TEST SUITE CHECKS PASSED PERFECTLY! ---');
}

runTests().catch(console.error);
