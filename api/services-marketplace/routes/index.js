const express = require('express');

const workersRoutes = require('./workers');
const bookingsRoutes = require('./bookings');

const router = express.Router();

router.use(workersRoutes);
router.use(bookingsRoutes);

module.exports = router;

