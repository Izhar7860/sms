const { ApiError } = require('../utils/apiError');

const bookingsStore = new Map();
const allowedStatuses = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Rated', 'Rejected'];

function createBooking(req, res) {
  const id = `b_${Date.now()}`;
  const booking = {
    id,
    booking_status: 'Pending',
    requested_at: new Date().toISOString(),
    issue_image_urls: [],
    ...req.body,
    requested_at: req.body.requested_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  bookingsStore.set(id, booking);
  res.status(201).json({ data: booking });
}

function listBookings(req, res) {
  const list = Array.from(bookingsStore.values());
  // placeholder: would filter by resident_user_id
  res.json({ data: list });
}

function listAdminBookings(req, res) {
  const { status } = req.query;
  let items = Array.from(bookingsStore.values());
  if (status && status !== 'all') {
    items = items.filter((b) => b.booking_status === status);
  }
  res.json({ data: items });
}

function updateBookingStatus(req, res) {
  const { bookingId } = req.params;
  const existing = bookingsStore.get(bookingId);
  if (!existing) throw new ApiError('Booking not found', 404);

  const { booking_status, status } = req.body;
  const nextStatus = booking_status || status;

  if (nextStatus && !allowedStatuses.includes(nextStatus)) throw new ApiError('Invalid booking status', 400);

  if (!nextStatus) throw new ApiError('Missing booking_status', 400);

  // status flow check is placeholder
  existing.booking_status = nextStatus;
  existing.updated_at = new Date().toISOString();

  bookingsStore.set(bookingId, existing);
  res.json({ data: existing });
}

function rateBooking(req, res) {
  const { bookingId } = req.params;
  const existing = bookingsStore.get(bookingId);
  if (!existing) throw new ApiError('Booking not found', 404);

  const { rating, rating_comment } = req.body;
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) throw new ApiError('Rating must be between 1 and 5', 400);

  existing.rating = r;
  existing.rating_comment = rating_comment || '';
  existing.booking_status = 'Rated';
  existing.updated_at = new Date().toISOString();

  bookingsStore.set(bookingId, existing);
  res.json({ data: existing });
}

function emergencyBooking(req, res) {
  // emergency: create booking with immediate requested time; still requires admin acceptance.
  const id = `b_${Date.now()}`;
  const booking = {
    id,
    booking_status: 'Pending',
    requested_at: req.body?.requested_at || new Date().toISOString(),
    issue_description: req.body?.issue_description || '',
    worker_id: req.body?.worker_id,
    category_name: req.body?.category_name,
    resident_user_id: req.body?.resident_user_id,
    emergency: true,
    updated_at: new Date().toISOString()
  };
  bookingsStore.set(id, booking);
  res.status(201).json({ data: booking });
}

module.exports = {
  createBooking,
  listBookings,
  listAdminBookings,
  updateBookingStatus,
  rateBooking,
  emergencyBooking
};

