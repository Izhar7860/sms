const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

// Resident create/list
router.post('/bookings', authGuard, bookingsController.createBooking);
router.get('/bookings', authGuard, bookingsController.listBookings);

// Emergency
router.post('/bookings/emergency', authGuard, bookingsController.emergencyBooking);

// Admin approve/reject/flow
router.get('/admin/bookings', authGuard, roleGuard(['admin']), bookingsController.listAdminBookings);
router.patch('/admin/bookings/:bookingId', authGuard, roleGuard(['admin']), bookingsController.updateBookingStatus);
router.post('/bookings/:bookingId/rate', authGuard, bookingsController.rateBooking);

module.exports = router;

