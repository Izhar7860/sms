/* Society Services Marketplace */
(function () {
  const pathname = window.location.pathname;
  const isServices = pathname.includes('services-marketplace') || pathname.endsWith('/services');
  const isWorkers = pathname.includes('worker-profiles') || pathname.endsWith('/workers');
  const isBookings = pathname.includes('bookings') && !pathname.includes('admin-workers-bookings');
  const isAdmin = pathname.includes('admin-workers-bookings');

  const API_BASE = '/api/marketplace';
  const WORKER_STORE_KEY = 'sms_marketplace_workers_cache';
  const BOOKING_STORE_KEY = 'sms_marketplace_bookings_cache';
  const EVENT_STORE_KEY = 'sms_marketplace_recent_events';

  const CATEGORIES = [
    'Plumbers',
    'Electricians',
    'Maids',
    'Cooks',
    'Drivers',
    'Cleaners',
    'Tutors',
    'Car washers',
    'AC repair',
    'RO repair',
    'Pest control',
    'House helpers',
    'Laundry'
  ];

  const demoWorkers = [
    {
      id: 'w1',
      name: 'Ravi Kumar',
      categories: ['Plumbers', 'House helpers'],
      experienceYears: 6,
      phone: '9876543210',
      available: true,
      rating: 4.7,
      verified: true,
      reviews: [
        { name: 'Amit', stars: 5, text: 'Quick response and good work.' },
        { name: 'Neha', stars: 4, text: 'Professional and clean finish.' }
      ]
    },
    {
      id: 'w2',
      name: 'Sana Ali',
      categories: ['Maids', 'Cleaners', 'Laundry'],
      experienceYears: 4,
      phone: '9123456780',
      available: true,
      rating: 4.5,
      verified: true,
      reviews: [{ name: 'Priya', stars: 5, text: 'Very hygienic and punctual.' }]
    },
    {
      id: 'w3',
      name: 'Vikram Singh',
      categories: ['Electricians'],
      experienceYears: 8,
      phone: '9001122334',
      available: false,
      rating: 4.9,
      verified: true,
      reviews: [{ name: 'Rahul', stars: 5, text: 'Resolved the issue in one visit.' }]
    },
    {
      id: 'w4',
      name: 'Meera Joshi',
      categories: ['Cooks'],
      experienceYears: 5,
      phone: '9898989898',
      available: true,
      rating: 4.4,
      verified: false,
      reviews: [{ name: 'Jaya', stars: 4, text: 'Good taste and hygiene.' }]
    },
    {
      id: 'w5',
      name: 'Akash Verma',
      categories: ['AC repair', 'RO repair', 'Pest control'],
      experienceYears: 7,
      phone: '9765432109',
      available: true,
      rating: 4.6,
      verified: true,
      reviews: [{ name: 'Karan', stars: 5, text: 'Explained everything clearly.' }]
    }
  ];

  const state = {
    workers: [],
    bookings: [],
    apiAvailable: true
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function toast(message, variant = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, variant);
      return;
    }
    window.alert(message);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeWorker(raw) {
    return {
      id: raw.id,
      name: raw.name || raw.full_name || 'Worker',
      photo: raw.photo || raw.photo_url || '',
      categories: Array.isArray(raw.categories)
        ? raw.categories
        : [raw.category || raw.category_name].filter(Boolean),
      experienceYears: Number(raw.experienceYears ?? raw.experience_years ?? 0),
      phone: raw.phone || raw.phone_number || '',
      available: raw.available ?? raw.availability_status === 'available',
      rating: Number(raw.rating ?? raw.average_rating ?? 4.2),
      verified: Boolean(raw.verified),
      reviews: Array.isArray(raw.reviews) ? raw.reviews : []
    };
  }

  function normalizeBooking(raw) {
    const worker = state.workers.find((w) => w.id === raw.worker_id || w.id === raw.workerId);
    return {
      id: raw.id,
      workerId: raw.workerId || raw.worker_id || worker?.id || '',
      workerName: raw.workerName || raw.worker_name || worker?.name || 'Worker',
      category: raw.category || raw.category_name || worker?.categories?.[0] || 'Service',
      requestedAt: raw.requestedAt || raw.requested_at || new Date().toISOString(),
      status: raw.status || raw.booking_status || 'Pending',
      issue: raw.issue || raw.issue_description || '',
      resident: raw.resident || raw.resident_name || raw.resident_user_id || currentUserEmail(),
      emergency: Boolean(raw.emergency)
    };
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return payload.data ?? payload;
  }

  async function loadWorkers() {
    try {
      const data = await apiFetch('/workers');
      state.workers = data.map(normalizeWorker);
      state.apiAvailable = true;
      setJson(WORKER_STORE_KEY, state.workers);
    } catch {
      state.apiAvailable = false;
      const cached = getJson(WORKER_STORE_KEY, []);
      state.workers = (cached.length ? cached : demoWorkers).map(normalizeWorker);
    }
  }

  async function loadBookings(admin = false) {
    try {
      const data = await apiFetch(admin ? '/admin/bookings' : '/bookings');
      state.bookings = data.map(normalizeBooking);
      state.apiAvailable = true;
      setJson(BOOKING_STORE_KEY, state.bookings);
    } catch {
      state.apiAvailable = false;
      const cached = getJson(BOOKING_STORE_KEY, []);
      state.bookings = cached.map(normalizeBooking);
      if (!state.bookings.length) {
        state.bookings = [{
          id: 'b1',
          workerName: 'Ravi Kumar',
          category: 'Plumbers',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'Pending',
          resident: currentUserEmail()
        }];
        setJson(BOOKING_STORE_KEY, state.bookings);
      }
    }
  }

  function currentUserEmail() {
    return sessionStorage.getItem('user_email') || $('[data-auth-email]')?.textContent?.trim() || 'resident@demo.local';
  }

  function rememberEvent(message) {
    const events = getJson(EVENT_STORE_KEY, []);
    setJson(EVENT_STORE_KEY, [{ id: Date.now(), message, time: new Date().toISOString() }, ...events].slice(0, 5));
    renderRecentEvents();
  }

  function statusBadge(status) {
    const s = normalizeText(status);
    if (s === 'pending') return 'bg-warning text-dark';
    if (s === 'accepted') return 'bg-primary';
    if (s === 'in progress') return 'bg-info text-dark';
    if (s === 'completed') return 'bg-success';
    if (s === 'rated') return 'bg-secondary';
    if (s === 'rejected') return 'bg-danger';
    return 'bg-secondary';
  }

  function visibleWorkers() {
    const search = $('#service-search')?.value || $('#worker-search')?.value || '';
    const category = $('#category-filter')?.value || $('#worker-category-filter')?.value || 'all';
    const availability = $('#availability-filter')?.value || $('#worker-availability-filter')?.value || 'all';
    const q = normalizeText(search);

    return state.workers
      .filter((worker) => {
        const text = normalizeText(`${worker.name} ${worker.categories.join(' ')}`);
        const matchesSearch = !q || text.includes(q);
        const matchesCategory = category === 'all' || worker.categories.includes(category);
        const matchesAvailability = availability === 'all' || worker.available;
        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => (Number(b.available) - Number(a.available)) || (b.rating - a.rating));
  }

  function renderCategoryFilterOptions() {
    [$('#category-filter'), $('#worker-category-filter')].filter(Boolean).forEach((select) => {
      const current = select.value;
      select.innerHTML = '<option value="all">All Categories</option>' +
        CATEGORIES.map((cat) => `<option value="${escapeAttr(cat)}">${escapeHtml(cat)}</option>`).join('');
      select.value = CATEGORIES.includes(current) ? current : 'all';
    });
  }

  function renderCategoryCards() {
    const container = $('#category-cards');
    if (!container) return;

    const active = $('#category-filter')?.value || 'all';
    container.innerHTML = CATEGORIES.map((cat) => {
      const count = state.workers.filter((worker) => worker.categories.includes(cat)).length;
      return `
        <button type="button" class="category-card${active === cat ? ' active' : ''}" data-category="${escapeAttr(cat)}">
          <span class="category-card-name">${escapeHtml(cat)}</span>
          <span class="badge count-pill bg-light text-dark">${count}</span>
        </button>
      `;
    }).join('');

    $$('[data-category]', container).forEach((button) => {
      button.addEventListener('click', () => {
        const select = $('#category-filter');
        if (select) select.value = button.dataset.category;
        renderMarketplace();
      });
    });
  }

  function workerCardHtml(worker) {
    const category = worker.categories[0] || 'Service';
    const photo = worker.photo
      ? `<img class="worker-photo-small" src="${escapeAttr(worker.photo)}" alt="${escapeAttr(worker.name)}">`
      : '<div class="worker-photo-small d-flex align-items-center justify-content-center"><i class="fas fa-user-tie"></i></div>';
    const skills = worker.categories.slice(0, 3).map((cat) => `<span class="skill-pill">${escapeHtml(cat)}</span>`).join('');

    return `
      <article class="worker-card" data-worker-id="${escapeAttr(worker.id)}" tabindex="0">
        <div class="top">
          ${photo}
          <div class="flex-grow-1">
            <p class="worker-name">${escapeHtml(worker.name)}</p>
            <div class="worker-sub">
              ${escapeHtml(category)}
              ${worker.verified ? '<span class="ms-2 badge rounded-pill bg-primary">Verified</span>' : ''}
            </div>
          </div>
        </div>
        <div class="mt-3 d-flex align-items-center justify-content-between gap-2">
          <span class="status-badge ${worker.available ? 'badge-available' : 'badge-unavailable'}">
            ${worker.available ? 'Available' : 'Not Available'}
          </span>
          <span class="text-warning fw-bold"><i class="fas fa-star me-1"></i>${worker.rating.toFixed(1)}</span>
        </div>
        <div class="worker-skills">${skills}</div>
      </article>
    `;
  }

  function bindWorkerCards(root = document) {
    $$('.worker-card[data-worker-id]', root).forEach((card) => {
      const open = () => openWorkerModal(state.workers.find((worker) => worker.id === card.dataset.workerId));
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function renderWorkersGrid() {
    const grids = [$('#workers-grid'), $('#workers-profiles-grid')].filter(Boolean);
    if (!grids.length) return;

    const html = visibleWorkers().map(workerCardHtml).join('') ||
      '<div class="empty-state">No workers match your filters.</div>';
    grids.forEach((grid) => {
      grid.innerHTML = html;
      bindWorkerCards(grid);
    });
  }

  function renderAiRecommended() {
    const container = $('#ai-recommended');
    if (!container) return;

    container.innerHTML = [...state.workers]
      .sort((a, b) => {
        const aScore = (a.available ? 2 : 0) + (a.verified ? 1 : 0) + a.rating;
        const bScore = (b.available ? 2 : 0) + (b.verified ? 1 : 0) + b.rating;
        return bScore - aScore;
      })
      .slice(0, 3)
      .map(workerCardHtml)
      .join('');
    bindWorkerCards(container);
  }

  function openWorkerModal(worker) {
    if (!worker) return;

    $('#worker-profile-name').textContent = worker.name;
    $('#worker-profile-category').textContent = worker.categories[0] || '-';
    $('#worker-experience').textContent = `${worker.experienceYears} years`;
    $('#worker-phone').textContent = worker.phone || '-';
    $('#worker-availability').textContent = worker.available ? 'Available Now' : 'Not Available';
    $('#worker-rating').innerHTML = `<i class="fas fa-star text-warning me-2"></i>${worker.rating.toFixed(1)}`;

    const badge = $('#worker-verification-badge');
    if (badge) {
      badge.textContent = worker.verified ? 'Verified Worker' : 'Unverified';
      badge.className = `badge rounded-pill ${worker.verified ? 'bg-primary' : 'bg-secondary'}`;
    }

    const photo = $('#worker-profile-photo');
    if (photo) {
      photo.src = worker.photo || '';
      photo.style.display = worker.photo ? 'block' : 'none';
    }

    const skills = $('#worker-skills');
    if (skills) {
      skills.innerHTML = worker.categories.map((cat) => `<span class="skill-pill">${escapeHtml(cat)}</span>`).join('');
    }

    const reviews = $('#worker-reviews');
    if (reviews) {
      reviews.innerHTML = (worker.reviews.length ? worker.reviews : [{ name: 'Resident', stars: 5, text: 'No written reviews yet.' }])
        .map((review) => `
          <div class="review-item">
            <div class="meta">
              <strong>${escapeHtml(review.name || 'Resident')}</strong>
              <span class="text-warning"><i class="fas fa-star me-1"></i>${escapeHtml(review.stars || 5)}</span>
            </div>
            <div class="mt-2 small text-light">${escapeHtml(review.text || '')}</div>
          </div>
        `)
        .join('');
    }

    const bookBtn = $('#book-worker-btn');
    if (bookBtn) {
      bookBtn.onclick = () => openBookingModal(worker);
    }

    const callBtn = $('#call-worker-btn');
    if (callBtn) {
      callBtn.onclick = () => toast(worker.phone ? `Calling ${worker.phone} (demo).` : 'Phone number unavailable.', 'info');
    }

    bootstrap.Modal.getOrCreateInstance($('#workerProfileModal')).show();
  }

  function openBookingModal(worker, emergency = false) {
    $('#booking-worker-id').value = worker.id;
    $('#booking-category').value = worker.categories[0] || '';
    $('#booking-issue').value = emergency ? 'Emergency service request' : '';
    setMinBookingTime();

    const workerModal = bootstrap.Modal.getInstance($('#workerProfileModal'));
    if (workerModal) workerModal.hide();
    bootstrap.Modal.getOrCreateInstance($('#bookingModal')).show();
  }

  async function createBooking(payload, emergency = false) {
    if (state.apiAvailable) {
      try {
        const saved = await apiFetch(emergency ? '/bookings/emergency' : '/bookings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const booking = normalizeBooking(saved);
        state.bookings = [booking, ...state.bookings.filter((item) => item.id !== booking.id)];
        setJson(BOOKING_STORE_KEY, state.bookings);
        return booking;
      } catch (error) {
        state.apiAvailable = false;
        toast(`${error.message}. Saving locally for now.`, 'warning');
      }
    }

    const worker = state.workers.find((item) => item.id === payload.worker_id);
    const localBooking = normalizeBooking({
      id: `b_${Date.now()}`,
      ...payload,
      workerName: worker?.name,
      category_name: payload.category_name,
      booking_status: 'Pending',
      emergency
    });
    state.bookings = [localBooking, ...state.bookings];
    setJson(BOOKING_STORE_KEY, state.bookings);
    return localBooking;
  }

  function wireBookingForm() {
    const form = $('#booking-form');
    if (!form || form.dataset.bound) return;

    form.dataset.bound = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const workerId = $('#booking-worker-id')?.value;
      const dateTime = $('#booking-datetime')?.value;
      const category = $('#booking-category')?.value;
      const issue = $('#booking-issue')?.value?.trim();

      if (!workerId || !dateTime || !category || !issue) {
        toast('Please fill all booking fields.', 'warning');
        return;
      }

      const emergency = issue.toLowerCase().includes('emergency');
      const booking = await createBooking({
        worker_id: workerId,
        category_name: category,
        requested_at: new Date(dateTime).toISOString(),
        issue_description: issue,
        resident_user_id: currentUserEmail()
      }, emergency);

      rememberEvent(`New ${booking.emergency ? 'emergency ' : ''}booking for ${booking.workerName}`);
      toast('Booking request submitted. Status: Pending', 'success');
      bootstrap.Modal.getInstance($('#bookingModal'))?.hide();
      form.reset();
      renderBookingsPage();
      renderAdminBookings();
    });
  }

  function renderBookingsPage() {
    if (!isBookings) return;
    const tbody = $('#bookings-table-body');
    if (!tbody) return;

    if (!state.bookings.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted py-4 text-center">No bookings yet.</td></tr>';
      return;
    }

    tbody.innerHTML = state.bookings.map((booking) => `
      <tr>
        <td><strong>${escapeHtml(booking.workerName)}</strong>${booking.emergency ? ' <span class="badge bg-danger ms-1">Emergency</span>' : ''}</td>
        <td>${escapeHtml(booking.category)}</td>
        <td class="text-muted">${escapeHtml(new Date(booking.requestedAt).toLocaleString())}</td>
        <td><span class="badge rounded-pill ${statusBadge(booking.status)}">${escapeHtml(booking.status)}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary rounded-pill" data-rate-booking="${escapeAttr(booking.id)}" ${booking.status !== 'Completed' ? 'disabled' : ''}>
            <i class="fas fa-star me-1"></i>Rate
          </button>
        </td>
      </tr>
    `).join('');

    $$('[data-rate-booking]', tbody).forEach((button) => {
      button.addEventListener('click', async () => updateBookingStatus(button.dataset.rateBooking, 'Rated', true));
    });
  }

  async function updateBookingStatus(id, status, residentRating = false) {
    const existing = state.bookings.find((booking) => booking.id === id);
    if (!existing) return;

    if (state.apiAvailable) {
      try {
        const path = residentRating ? `/bookings/${id}/rate` : `/admin/bookings/${id}`;
        const body = residentRating ? { rating: 5, rating_comment: 'Good service' } : { booking_status: status };
        const saved = await apiFetch(path, { method: residentRating ? 'POST' : 'PATCH', body: JSON.stringify(body) });
        status = normalizeBooking(saved).status;
      } catch (error) {
        state.apiAvailable = false;
        toast(`${error.message}. Updating locally for now.`, 'warning');
      }
    }

    state.bookings = state.bookings.map((booking) => (
      booking.id === id ? { ...booking, status } : booking
    ));
    setJson(BOOKING_STORE_KEY, state.bookings);
    rememberEvent(`${existing.workerName} booking moved to ${status}`);
    toast(status === 'Rated' ? 'Thanks! You rated the service.' : `Booking moved to ${status}.`, 'success');
    renderBookingsPage();
    renderAdminBookings();
  }

  function renderAdminWorkers() {
    if (!isAdmin) return;

    const form = $('#admin-worker-form');
    const categorySelect = form?.querySelector('select[name="category"]');
    if (categorySelect) {
      categorySelect.innerHTML = CATEGORIES.map((cat) => `<option value="${escapeAttr(cat)}">${escapeHtml(cat)}</option>`).join('');
    }

    const list = $('#admin-workers-list');
    if (list) {
      list.innerHTML = state.workers.map((worker) => `
        <div class="glass p-3">
          <div class="d-flex align-items-start justify-content-between gap-2">
            <div>
              <div class="fw-bold">${escapeHtml(worker.name)}</div>
              <div class="small text-muted">${escapeHtml(worker.categories[0] || '-')} &bull; ${worker.experienceYears} yrs</div>
            </div>
            <span class="badge rounded-pill ${worker.verified ? 'bg-primary' : 'bg-secondary'}">${worker.verified ? 'Verified' : 'Unverified'}</span>
          </div>
          <div class="mt-3 d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-primary rounded-pill" data-admin-verify="${escapeAttr(worker.id)}">
              <i class="fas fa-shield-alt me-1"></i>${worker.verified ? 'Unverify' : 'Verify'}
            </button>
            <button class="btn btn-sm btn-outline-success rounded-pill" data-admin-toggle="${escapeAttr(worker.id)}">
              <i class="fas fa-toggle-on me-1"></i>${worker.available ? 'Set Unavailable' : 'Set Available'}
            </button>
          </div>
        </div>
      `).join('');

      $$('[data-admin-verify]', list).forEach((button) => {
        button.addEventListener('click', () => toggleWorkerVerification(button.dataset.adminVerify));
      });
      $$('[data-admin-toggle]', list).forEach((button) => {
        button.addEventListener('click', () => toggleWorkerAvailability(button.dataset.adminToggle));
      });
    }

    if (form && !form.dataset.bound) {
      form.dataset.bound = 'true';
      form.addEventListener('submit', addAdminWorker);
    }
  }

  async function saveWorker(worker, id = '') {
    if (state.apiAvailable) {
      try {
        const saved = await apiFetch(id ? `/admin/workers/${id}` : '/admin/workers', {
          method: id ? 'PATCH' : 'POST',
          body: JSON.stringify(worker)
        });
        return normalizeWorker(saved);
      } catch (error) {
        state.apiAvailable = false;
        toast(`${error.message}. Updating locally for now.`, 'warning');
      }
    }
    return normalizeWorker({ id: id || `w_${Date.now()}`, ...worker });
  }

  async function addAdminWorker(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const worker = {
      full_name: data.get('name')?.toString().trim(),
      phone_number: data.get('phone')?.toString().trim(),
      experience_years: Number(data.get('experience') || 0),
      categories: [data.get('category')?.toString()].filter(Boolean),
      available: data.get('available') === 'true',
      verified: false
    };

    if (!worker.full_name || !worker.phone_number || !worker.categories.length) {
      toast('Please fill worker details.', 'warning');
      return;
    }

    const saved = await saveWorker(worker);
    state.workers = [saved, ...state.workers];
    setJson(WORKER_STORE_KEY, state.workers);
    form.reset();
    rememberEvent(`Worker added: ${saved.name}`);
    toast('Worker added.', 'success');
    renderAdminWorkers();
    renderMarketplace();
  }

  async function toggleWorkerVerification(id) {
    const worker = state.workers.find((item) => item.id === id);
    if (!worker) return;

    if (state.apiAvailable) {
      try {
        await apiFetch(`/admin/workers/${id}/verify`, {
          method: 'POST',
          body: JSON.stringify({ verified: !worker.verified })
        });
      } catch (error) {
        state.apiAvailable = false;
        toast(`${error.message}. Updating locally for now.`, 'warning');
      }
    }

    worker.verified = !worker.verified;
    setJson(WORKER_STORE_KEY, state.workers);
    rememberEvent(`${worker.name} verification updated`);
    toast('Verification updated.', 'success');
    renderAdminWorkers();
    renderMarketplace();
  }

  async function toggleWorkerAvailability(id) {
    const worker = state.workers.find((item) => item.id === id);
    if (!worker) return;

    const saved = await saveWorker({ available: !worker.available }, id);
    worker.available = saved.available;
    setJson(WORKER_STORE_KEY, state.workers);
    rememberEvent(`${worker.name} availability updated`);
    toast('Availability updated.', 'success');
    renderAdminWorkers();
    renderMarketplace();
  }

  function renderAdminBookings() {
    if (!isAdmin) return;

    const tbody = $('#admin-bookings-table-body');
    if (!tbody) return;

    const filter = $('#admin-booking-status-filter')?.value || 'all';
    const bookings = filter === 'all'
      ? state.bookings
      : state.bookings.filter((booking) => booking.status === filter);

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-muted py-4 text-center">No bookings for selected filter.</td></tr>';
    } else {
      tbody.innerHTML = bookings.map((booking) => {
        const next = getNextStatus(booking.status);
        return `
          <tr>
            <td class="text-muted">${escapeHtml(booking.resident)}</td>
            <td><strong>${escapeHtml(booking.workerName)}</strong>${booking.emergency ? ' <span class="badge bg-danger ms-1">Emergency</span>' : ''}</td>
            <td>${escapeHtml(booking.category)}</td>
            <td class="text-muted">${escapeHtml(new Date(booking.requestedAt).toLocaleString())}</td>
            <td><span class="badge rounded-pill ${statusBadge(booking.status)}">${escapeHtml(booking.status)}</span></td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline-primary rounded-pill" data-admin-next="${escapeAttr(booking.id)}" ${!next ? 'disabled' : ''}>
                  <i class="fas fa-forward me-1"></i>${next ? 'Move to ' + next : 'Done'}
                </button>
                ${booking.status === 'Pending' ? `
                  <button class="btn btn-sm btn-outline-success rounded-pill" data-admin-accept="${escapeAttr(booking.id)}">
                    <i class="fas fa-check me-1"></i>Accept
                  </button>
                  <button class="btn btn-sm btn-outline-danger rounded-pill" data-admin-reject="${escapeAttr(booking.id)}">
                    <i class="fas fa-times me-1"></i>Reject
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    $$('[data-admin-next]', tbody).forEach((button) => {
      button.addEventListener('click', () => updateBookingStatus(button.dataset.adminNext, getNextStatus(state.bookings.find((b) => b.id === button.dataset.adminNext)?.status)));
    });
    $$('[data-admin-accept]', tbody).forEach((button) => {
      button.addEventListener('click', () => updateBookingStatus(button.dataset.adminAccept, 'Accepted'));
    });
    $$('[data-admin-reject]', tbody).forEach((button) => {
      button.addEventListener('click', () => updateBookingStatus(button.dataset.adminReject, 'Rejected'));
    });

    updateAnalytics();
  }

  function getNextStatus(status) {
    if (status === 'Pending') return 'Accepted';
    if (status === 'Accepted') return 'In Progress';
    if (status === 'In Progress') return 'Completed';
    if (status === 'Completed') return 'Rated';
    return null;
  }

  function updateAnalytics() {
    const counts = state.bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    const setText = (id, value) => {
      const element = $(`#${id}`);
      if (element) element.textContent = value || 0;
    };
    setText('analytics-pending', counts.Pending);
    setText('analytics-accepted', counts.Accepted);
    setText('analytics-inprogress', counts['In Progress']);
    setText('analytics-completed', counts.Completed);
  }

  function renderRecentEvents() {
    const container = $('#marketplace-recent-events');
    if (!container) return;

    const events = getJson(EVENT_STORE_KEY, []);
    container.innerHTML = events.length
      ? events.map((event) => `<div class="recent-event"><span>${escapeHtml(event.message)}</span><small>${escapeHtml(new Date(event.time).toLocaleTimeString())}</small></div>`).join('')
      : '<div class="empty-state">No recent marketplace activity.</div>';
  }

  function wireControls() {
    const rerender = () => renderMarketplace();
    ['#service-search', '#worker-search', '#category-filter', '#worker-category-filter', '#availability-filter', '#worker-availability-filter']
      .forEach((selector) => {
        const element = $(selector);
        if (element && !element.dataset.bound) {
          element.dataset.bound = 'true';
          element.addEventListener(element.tagName === 'INPUT' ? 'input' : 'change', rerender);
        }
      });

    const statusFilter = $('#admin-booking-status-filter');
    if (statusFilter && !statusFilter.dataset.bound) {
      statusFilter.dataset.bound = 'true';
      statusFilter.addEventListener('change', renderAdminBookings);
    }

    const emergency = $('#emergency-book-btn');
    if (emergency && !emergency.dataset.bound) {
      emergency.dataset.bound = 'true';
      emergency.addEventListener('click', () => {
        const worker = visibleWorkers().find((item) => item.available) || state.workers[0];
        if (!worker) {
          toast('No workers available for emergency booking.', 'warning');
          return;
        }
        openBookingModal(worker, true);
        rememberEvent(`Emergency booking opened for ${worker.name}`);
      });
    }
  }

  function setMinBookingTime() {
    const input = $('#booking-datetime');
    if (!input) return;

    const date = new Date();
    date.setMinutes(date.getMinutes() + 30);
    const pad = (num) => String(num).padStart(2, '0');
    const value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    input.min = value;
    if (!input.value) input.value = value;
  }

  function renderMarketplace() {
    renderCategoryCards();
    renderWorkersGrid();
    renderAiRecommended();
    renderRecentEvents();
  }

  async function init() {
    renderCategoryFilterOptions();
    await loadWorkers();
    if (isBookings || isAdmin) await loadBookings(isAdmin);
    if (!state.bookings.length && (isBookings || isAdmin)) await loadBookings(false);

    renderMarketplace();
    renderBookingsPage();
    renderAdminWorkers();
    renderAdminBookings();
    renderRecentEvents();
    wireControls();
    wireBookingForm();
    setMinBookingTime();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
