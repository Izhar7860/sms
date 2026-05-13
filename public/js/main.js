// Common JavaScript for Society Management System

const defaultSMSData = {
  stats: {
    totalFlats: 125,
    totalResidents: 456,
    pendingPayments: 23,
    complaints: 12
  },
  residents: [],
  payments: [
    { id: 1, resident: 'Amit Sharma', month: 'Jan 2024', amount: 5000, status: 'paid' },
    { id: 2, resident: 'Priya Patel', month: 'Jan 2024', amount: 5000, status: 'pending' },
    { id: 3, resident: 'Raj Kumar', month: 'Dec 2023', amount: 5000, status: 'paid' }
  ],
  complaints: [
    {
      id: 1,
      title: 'Water leakage in flat 3B',
      resident: 'Amit Sharma',
      flat: '3B',
      priority: 'High',
      status: 'In Progress',
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Lift not working',
      resident: 'Society Resident',
      flat: '-',
      priority: 'Medium',
      status: 'Resolved',
      date: '2024-01-10'
    }
  ],
  notices: [
    { id: 1, title: 'Society Maintenance Meeting', date: '2024-01-20', content: 'Meeting at 7 PM in community hall.', target: 'All Residents' },
    { id: 2, title: 'Parking Rules Update', date: '2024-01-18', content: 'New visitor parking policy.', target: 'All Residents' }
  ],
  parkingSlots: [
    { id: 1, slot: 'P-01', location: 'Ground Floor', status: 'available' },
    { id: 2, slot: 'P-02', location: 'Ground Floor', status: 'occupied' },
    { id: 3, slot: 'P-03', location: 'Underground Basement', status: 'available' },
    { id: 4, slot: 'P-04', location: 'Underground Basement', status: 'occupied' },
    { id: 5, slot: 'P-05', location: 'First Floor', status: 'reserved' },
    { id: 6, slot: 'P-06', location: 'First Floor', status: 'available' }
  ],
  parkingAllocations: []
};

window.SMSData = structuredClone
  ? structuredClone(defaultSMSData)
  : JSON.parse(JSON.stringify(defaultSMSData));

const pathname = window.location.pathname;
const isPagesRoute = pathname.includes('/pages/');
const appPaths = {
  home: isPagesRoute ? '../index.html' : 'index.html',
  login: isPagesRoute ? 'login.html' : 'pages/login.html',
  admin: isPagesRoute ? 'admin-dashboard.html' : 'pages/admin-dashboard.html',
  resident: isPagesRoute ? 'resident-dashboard.html' : 'pages/resident-dashboard.html'
};

const firebaseConfig = window.SMS_FIREBASE_CONFIG || {};
const inferredDatabaseUrl = firebaseConfig.databaseURL || (
  firebaseConfig.projectId
    ? `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    : ''
);
const runtimeFirebaseConfig = inferredDatabaseUrl
  ? { ...firebaseConfig, databaseURL: inferredDatabaseUrl }
  : firebaseConfig;
const hasFirebaseConfig = Boolean(
  window.firebase &&
  runtimeFirebaseConfig.apiKey &&
  runtimeFirebaseConfig.authDomain &&
  runtimeFirebaseConfig.projectId
);

const firebaseApp = hasFirebaseConfig
  ? (firebase.apps?.length ? firebase.app() : firebase.initializeApp(runtimeFirebaseConfig))
  : null;

const auth = hasFirebaseConfig
  ? firebase.auth()
  : null;

const hasDatabaseConfig = Boolean(

  hasFirebaseConfig &&
  typeof firebase.database === 'function' &&
  inferredDatabaseUrl
);

const database = hasDatabaseConfig
  ? firebase.app().database()
  : null;

let authFormInitialized = false;
const databaseListeners = [];
let parkingSlotsSeeded = false;
let parkingAllocationSaving = false;
const localComplaintsStorageKey = 'sms_local_complaints';

// Realtime “new notice/complaint” in-app notifications
let lastNoticesSignature = '';
let lastComplaintsSignature = '';


document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  setActiveNavLink();
  initForms();
  
  // Apply immediate UI state from sessionStorage to prevent flicker
  applyInitialAuthState();

  let initialUser = null;
  if (auth) {
    initialUser = await initAuth();
  } else {
    showConfigWarning();
  }

  const authRequired = document.body?.dataset.authRequired === 'true';
  if (!authRequired || initialUser || !auth) {
    await hydrateAppData();
  }
});

window.addEventListener('beforeunload', detachDatabaseListeners);

function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!sidebar) return;

  const syncSidebarForViewport = () => {
    if (window.innerWidth <= 992) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
  };

  syncSidebarForViewport();

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
    });
  }

  window.addEventListener('resize', syncSidebarForViewport);

  document.addEventListener('click', (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isToggleClick = event.target.id === 'sidebar-toggle' || event.target.closest('#sidebar-toggle');

    if (!isClickInsideSidebar && !isToggleClick && window.innerWidth <= 992) {
      sidebar.classList.add('collapsed');
    }
  });
}

function setActiveNavLink() {
  const currentPage = pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || href === `pages/${currentPage}` || href === `../${currentPage}`) {
      link.classList.add('active');
    }
  });
}

async function hydrateAppData() {
  renderAppData();
  if (!database) return;

  try {
    const collections = getPageDataCollections();

    if (collections.has('stats')) attachRealtimeCollection('stats', defaultSMSData.stats, (value) => {
      window.SMSData.stats = { ...defaultSMSData.stats, ...(value || {}) };
      renderAppData();
    });

    if (collections.has('residents')) attachRealtimeCollection('residents', defaultSMSData.residents, (value, rawValue) => {
      window.SMSData.residents = normalizeCollection(value, defaultSMSData.residents);
      if (rawValue) {
        window.SMSData.stats.totalResidents = window.SMSData.residents.length;
      }
      renderAppData();
    });

    if (collections.has('payments')) attachRealtimeCollection('payments', defaultSMSData.payments, (value, rawValue) => {
      window.SMSData.payments = normalizeCollection(value, defaultSMSData.payments);
      if (rawValue) {
        window.SMSData.stats.pendingPayments = countPendingPayments(window.SMSData.payments);
      }
      renderAppData();
    });

    if (collections.has('complaints')) attachRealtimeCollection('complaints', defaultSMSData.complaints, (value) => {
      window.SMSData.complaints = normalizeCollection(value, defaultSMSData.complaints);
      window.SMSData.stats.complaints = window.SMSData.complaints.length;
      notifyOnNewItems('complaint');
      renderAppData();
    });

    if (collections.has('notices')) attachRealtimeCollection('notices', defaultSMSData.notices, (value) => {
      window.SMSData.notices = normalizeCollection(value, defaultSMSData.notices);
      notifyOnNewItems('notice');
      renderAppData();
    });


    if (collections.has('parkingSlots')) attachRealtimeCollection('parkingSlots', defaultSMSData.parkingSlots, (value, rawValue, error) => {
      window.SMSData.parkingSlots = rawValue
        ? normalizeCollection(value, defaultSMSData.parkingSlots)
        : [...defaultSMSData.parkingSlots];
      if (!rawValue && !error) {
        seedDefaultParkingSlots();
      }
      renderAppData();
    });

    if (collections.has('parkingAllocations')) attachRealtimeCollection('parkingAllocations', defaultSMSData.parkingAllocations, (value) => {
      window.SMSData.parkingAllocations = normalizeCollection(value, defaultSMSData.parkingAllocations);
      renderAppData();
    });
  } catch (error) {
    console.warn('[database] falling back to local demo data', error);
    renderAppData();
  }
}

function getPageDataCollections() {
  const collections = new Set();
  const has = (selector) => Boolean(document.querySelector(selector));

  if (has('.stat-flats, .stat-residents, .stat-pending, .stat-complaints')) {
    collections.add('stats');
  }

  if (has('#add-resident-form, .stat-residents')) {
    collections.add('residents');
  }

  if (has('.stat-pending, [data-payments-table]')) {
    collections.add('payments');
  }

  if (has('[data-complaint-form], [data-complaints-table], [data-complaint-stat], .stat-complaints')) {
    collections.add('complaints');
  }

  if (has('#notices-list, #notice-form, [data-notice-count]')) {
    collections.add('notices');
  }

  if (has('.parking-grid, #parking-allocations-table, #allocationForm, [data-parking-stat]')) {
    collections.add('parkingSlots');
    collections.add('parkingAllocations');
  }

  return collections;
}

function attachRealtimeCollection(path, fallbackValue, onValue) {
  const ref = database.ref(path);
  const listener = ref.on(
    'value',
    (snapshot) => {
      const rawValue = snapshot.val();
      const value = rawValue ?? getRealtimeEmptyValue(fallbackValue);
      onValue(value, rawValue);
    },
    (error) => {
      console.warn(`[database] failed to subscribe to ${path}`, error);
      onValue(getRealtimeEmptyValue(fallbackValue), null, error);
    }
  );

  databaseListeners.push({ ref, listener });
}

function detachDatabaseListeners() {
  databaseListeners.forEach(({ ref, listener }) => {
    ref.off('value', listener);
  });
  databaseListeners.length = 0;
}

function getRealtimeEmptyValue(fallbackValue) {
  if (Array.isArray(fallbackValue)) return [];
  return fallbackValue;
}

function renderAppData() {
  mergeLocalComplaints();
  updateStats();
  renderParkingGrid();
  renderParkingSlotOptions();
  renderParkingAllocationsTable();
  renderNotices();
  renderComplaints();
}

function notifyOnNewItems(type) {
  try {
    const nowNotices = Array.isArray(window.SMSData?.notices) ? window.SMSData.notices : [];
    const nowComplaints = Array.isArray(window.SMSData?.complaints) ? window.SMSData.complaints : [];

    if (type === 'notice') {
      const signature = nowNotices
        .slice(0, 50)
        .map((n) => `${n.id || ''}|${n.title || ''}|${n.date || ''}`)
        .join('~');

      if (!lastNoticesSignature) {
        lastNoticesSignature = signature;
        return;
      }

      if (signature !== lastNoticesSignature) {
        const newest = nowNotices[0];
        const newestTitle = newest?.title || 'New Notice';
        showToast(`🔔 New notice: ${newestTitle}`, 'info');

        lastNoticesSignature = signature;
      }


      return;
    }

    if (type === 'complaint') {
      const signature = nowComplaints
        .slice(0, 50)
        .map((c) => `${c.id || ''}|${c.title || c.subject || ''}|${c.date || ''}`)
        .join('~');

      if (!lastComplaintsSignature) {
        lastComplaintsSignature = signature;
        return;
      }

      if (signature !== lastComplaintsSignature) {
        const newest = nowComplaints[0];
        const newestSubject = newest?.title || newest?.subject || 'New Complaint';
        showToast(`🚨 New complaint: ${newestSubject}`, 'warning');
        lastComplaintsSignature = signature;
        return;
      }

    }
  } catch (e) {
    console.warn('[notify] failed', e);
  }
}


function normalizeCollection(value, fallback) {
  if (!value) return [...fallback];
  if (Array.isArray(value)) return value;

  return Object.entries(value)
    .map(([key, item]) => ({ id: item?.id || key, ...item }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function updateStats() {
  const stats = window.SMSData.stats;
  const statElements = {
    flats: document.querySelector('.stat-flats'),
    residents: document.querySelector('.stat-residents'),
    pending: document.querySelector('.stat-pending'),
    complaints: document.querySelector('.stat-complaints')
  };

  if (statElements.flats) statElements.flats.textContent = stats.totalFlats;
  if (statElements.residents) statElements.residents.textContent = stats.totalResidents;
  if (statElements.pending) statElements.pending.textContent = stats.pendingPayments;
  if (statElements.complaints) statElements.complaints.textContent = stats.complaints;

  const parkingStats = summarizeParking(window.SMSData.parkingSlots);
  const parkingStatEls = document.querySelectorAll('[data-parking-stat]');
  parkingStatEls.forEach((element) => {
    const key = element.dataset.parkingStat;
    if (key in parkingStats) {
      element.textContent = parkingStats[key];
    }
  });

  const complaintStats = summarizeComplaints(window.SMSData.complaints);
  const complaintStatEls = document.querySelectorAll('[data-complaint-stat]');
  complaintStatEls.forEach((element) => {
    const key = element.dataset.complaintStat;
    if (key in complaintStats) {
      element.textContent = complaintStats[key];
    }
  });

  const noticeCount = document.querySelector('[data-notice-count]');
  if (noticeCount) {
    noticeCount.textContent = `${window.SMSData.notices.length} Active`;
  }
}

function summarizeParking(slots) {
  return slots.reduce(
    (summary, slot) => {
      const status = (slot.status || '').toLowerCase();
      summary.total += 1;
      if (status === 'available') summary.available += 1;
      if (status === 'occupied') summary.occupied += 1;
      if (status === 'reserved') summary.reserved += 1;
      return summary;
    },
    { available: 0, occupied: 0, reserved: 0, total: 0 }
  );
}

function summarizeComplaints(complaints) {
  return complaints.reduce(
    (summary, complaint) => {
      const status = (complaint.status || '').toLowerCase();
      summary.total += 1;
      if (status === 'pending') summary.pending += 1;
      if (status === 'in progress') summary.inProgress += 1;
      if (status === 'resolved') summary.resolved += 1;
      return summary;
    },
    { total: 0, pending: 0, inProgress: 0, resolved: 0 }
  );
}

function countPendingPayments(payments) {
  return payments.reduce((count, payment) => {
    return count + (((payment.status || '').toLowerCase() === 'pending') ? 1 : 0);
  }, 0);
}

function renderParkingGrid() {
  const container = document.querySelector('.parking-grid');
  if (!container) return;

  container.innerHTML = '';
  window.SMSData.parkingSlots.forEach((slot, index) => {
    const allocation = findAllocationForSlot(slot);
    const slotEl = document.createElement('div');
    const slotName = slot.slot || `P-${String(index + 1).padStart(2, '0')}`;
    const status = slot.status || 'available';
    slotEl.className = `parking-slot ${status}`;
    slotEl.textContent = slotName;
    const location = allocation?.location || slot.location || 'Location not set';
    slotEl.title = allocation
      ? `${capitalize(status)} - ${allocation.ownerName || 'Allocated'} (${allocation.flat || 'Flat not set'}) - ${location}`
      : `${capitalize(status)} - ${location}`;
    container.appendChild(slotEl);
  });
}

function renderParkingSlotOptions() {
  const select = document.querySelector('#allocationForm [name="slot"]');
  if (!select) return;

  const selectedSlot = select.value;
  select.innerHTML = '<option value="">Choose slot...</option>';

  window.SMSData.parkingSlots.forEach((slot, index) => {
    const slotName = slot.slot || `P-${String(index + 1).padStart(2, '0')}`;
    const status = (slot.status || 'available').toLowerCase();
    const option = document.createElement('option');
    option.value = slotName;
    const slotLocation = slot.location ? ` - ${slot.location}` : '';
    option.textContent = status === 'available'
      ? `${slotName}${slotLocation}`
      : `${slotName}${slotLocation} (${capitalize(status)})`;
    option.disabled = status !== 'available' && slotName !== selectedSlot;
    select.appendChild(option);
  });

  if ([...select.options].some((option) => option.value === selectedSlot)) {
    select.value = selectedSlot;
  }
}

function getParkingSlotInputElements() {
  const form = document.getElementById('allocationForm');
  if (!form) return {};

  return {
    form,
    slotSelect: form.querySelector('[name="slot"]'),
    createSlotToggle: form.querySelector('[name="createSlot"]'),
    newSlotField: document.getElementById('new-slot-field'),
    newSlotInput: form.querySelector('[name="newSlot"]')
  };
}

function setParkingSlotCreationMode(enabled) {
  const {
    slotSelect,
    createSlotToggle,
    newSlotField,
    newSlotInput
  } = getParkingSlotInputElements();

  if (!slotSelect || !createSlotToggle || !newSlotField || !newSlotInput) return;

  createSlotToggle.checked = enabled;
  newSlotField.classList.toggle('d-none', !enabled);
  slotSelect.disabled = enabled;
  slotSelect.required = !enabled;
  newSlotInput.disabled = !enabled;
  newSlotInput.required = enabled;

  if (enabled) {
    slotSelect.value = '';
  } else {
    newSlotInput.value = '';
  }
}

function normalizeParkingSlotName(value) {
  return (value || '')
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function parkingSlotExists(slotName) {
  const normalizedSlotName = normalizeParkingSlotName(slotName);
  return window.SMSData.parkingSlots.some((slot) => normalizeParkingSlotName(slot.slot) === normalizedSlotName);
}

function findAllocationForSlot(slot) {
  const allocationId = slot.allocationId;
  if (allocationId) {
    const byId = window.SMSData.parkingAllocations.find((allocation) => allocation.id === allocationId);
    if (byId) return byId;
  }

  return window.SMSData.parkingAllocations.find((allocation) => allocation.slot === slot.slot);
}

function renderNotices() {
  const noticesList = document.getElementById('notices-list');
  if (noticesList) {
    noticesList.innerHTML = '';
    window.SMSData.notices.slice(0, 3).forEach((notice) => {
      const noticeEl = document.createElement('div');
      noticeEl.className = 'notice-item mb-3 p-3 bg-light rounded';
      noticeEl.innerHTML = `
        <h6 class="mb-1">${escapeHtml(notice.title)}</h6>
        <small class="text-muted">${formatDate(notice.date)}</small>
        <p class="mb-0 mt-1 small">${escapeHtml(notice.content)}</p>
      `;
      noticesList.appendChild(noticeEl);
    });
  }

  const noticesContainer = document.getElementById('notices-container');
  if (noticesContainer) {
    noticesContainer.innerHTML = '';
    window.SMSData.notices.forEach((notice) => {
      const noticeCard = document.createElement('div');
      noticeCard.className = 'p-4 border-bottom';
      noticeCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="mb-1">${escapeHtml(notice.title)}</h6>
          <span class="badge bg-primary">${formatDate(notice.date)}</span>
        </div>
        <p class="mb-2 text-muted">${escapeHtml(notice.content)}</p>
        <small class="text-muted d-block">${escapeHtml(notice.target || 'All Residents')}</small>
      `;
      noticesContainer.appendChild(noticeCard);
    });
  }
}

function renderComplaints() {
  const complaintsTableBody = document.querySelector('[data-complaints-table]');
  if (!complaintsTableBody) return;

  complaintsTableBody.innerHTML = '';
  if (!window.SMSData.complaints.length) {
    complaintsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-5">
          <i class="fas fa-inbox d-block mb-3 fs-3 text-secondary"></i>
          No complaints have been logged yet.
        </td>
      </tr>
    `;
  }

  window.SMSData.complaints.forEach((complaint, index) => {
    const row = document.createElement('tr');
    const complaintId = complaint.id || index;
    const subject = complaint.title || complaint.subject || 'Complaint';
    const resident = complaint.resident || 'Resident';
    const flat = complaint.flat || '-';
    
    row.innerHTML = `
      <td>
        <div class="d-flex flex-column">
          <span class="text-xs fw-bold text-uppercase text-secondary mb-1" style="font-size: 0.7rem; letter-spacing: 0.5px;">
            ${escapeHtml(getComplaintReference(complaintId, index))}
          </span>
          <h6 class="mb-1 fw-bold text-dark">${escapeHtml(subject)}</h6>
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${getPriorityBadgeClass(complaint.priority)} rounded-pill" style="font-size: 0.65rem;">
              ${escapeHtml(complaint.priority || 'Medium')}
            </span>
            <span class="text-muted small text-truncate" style="max-width: 250px;">
              ${escapeHtml(getComplaintSnippet(complaint.description))}
            </span>
          </div>
        </div>
      </td>
      <td>
        <div class="d-flex flex-column">
          <span class="fw-medium text-dark">${escapeHtml(resident)}</span>
          <span class="text-muted small">Flat ${escapeHtml(flat)}</span>
        </div>
      </td>
      <td>
        <span class="badge ${getComplaintBadgeClass(complaint.status)} rounded-pill px-3">
          ${escapeHtml(complaint.status || 'Pending')}
        </span>
      </td>
      <td>
        <div class="text-muted small">
          ${formatShortDate(complaint.date)}
        </div>
      </td>
      <td>
        <button class="btn btn-sm btn-light border rounded-pill px-3 view-complaint-btn" type="button" data-id="${complaintId}">
          <i class="fas fa-eye me-1 text-primary"></i>View Case
        </button>
      </td>
    `;
    complaintsTableBody.appendChild(row);
  });

  if (complaintsTableBody.dataset.bound !== 'true') {
    complaintsTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-complaint-btn');
      if (btn) {
        showComplaintDetails(btn.dataset.id);
      }
    });
    complaintsTableBody.dataset.bound = 'true';
  }
}

function showComplaintDetails(id) {
  const complaint = window.SMSData.complaints.find((c) => (c.id || window.SMSData.complaints.indexOf(c)).toString() === id.toString());
  if (!complaint) return;

  const modalEl = document.getElementById('complaintDetailsModal');
  if (!modalEl) return;

  document.getElementById('detail-id').textContent = getComplaintReference(id, window.SMSData.complaints.indexOf(complaint));
  document.getElementById('detail-subject').textContent = complaint.title || complaint.subject || 'Complaint';
  document.getElementById('detail-resident').textContent = complaint.resident || 'Resident';
  document.getElementById('detail-flat').textContent = complaint.flat || '-';
  document.getElementById('detail-description').textContent = complaint.description || 'No description provided.';
  document.getElementById('detail-date').textContent = formatDate(complaint.date);
  document.getElementById('detail-status-copy').textContent = complaint.status || 'Pending';

  const priorityEl = document.getElementById('detail-priority');
  priorityEl.textContent = complaint.priority || 'Medium';
  priorityEl.className = `badge ${getPriorityBadgeClass(complaint.priority)}`;

  const statusEl = document.getElementById('detail-status');
  statusEl.textContent = complaint.status || 'Pending';
  statusEl.className = `badge ${getComplaintBadgeClass(complaint.status)}`;

  const resolveBtn = document.getElementById('resolve-complaint-btn');
  const isAdmin = getUserRole(auth?.currentUser) === 'admin';
  if (resolveBtn) {
    resolveBtn.classList.toggle('d-none', !isAdmin || (complaint.status || '').toLowerCase() === 'resolved');
    resolveBtn.onclick = async () => {
      if (!confirm('Are you sure you want to resolve this complaint?')) return;

      try {
        await updateComplaintStatus(id, 'Resolved');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        showToast('Complaint marked as resolved.', 'success');
      } catch (error) {
        showToast(error.message || 'Failed to update complaint status.', 'danger');
      }
    };
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function updateComplaintStatus(id, status) {
  ensureDatabaseAvailable('update complaint status');
  try {
    await database.ref(`complaints/${id}`).update({ status });
    // Local update will happen via realtime listener
  } catch (error) {
    console.error('Failed to update complaint status', error);
    throw new Error('Unable to update complaint status in Firebase.');
  }
}

function getPriorityColor(priority) {
  const p = (priority || '').toLowerCase();
  if (p === 'high' || p === 'urgent') return 'danger';
  if (p === 'medium') return 'warning text-dark';
  return 'info';
}

function getPriorityBadgeClass(priority) {
  return `bg-${getPriorityColor(priority)}`;
}

function getComplaintBadgeClass(status) {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'resolved') return 'bg-success';
  if (normalizedStatus === 'in progress') return 'bg-primary';
  return 'bg-warning text-dark';
}

function getComplaintReference(id, index) {
  if (typeof id === 'string' && id.trim()) {
    // If it's a long Firebase ID, show a shorter version
    const displayId = id.length > 10 ? id.substring(0, 8).toUpperCase() : id;
    return `Case #${displayId}`;
  }
  const safeIndex = Number.isFinite(index) ? index + 1 : 1;
  return `Case #${String(safeIndex).padStart(3, '0')}`;
}

function getComplaintSnippet(description) {
  const value = (description || '').trim();
  if (!value) return 'No description provided yet.';
  return value.length > 110 ? `${value.slice(0, 107)}...` : value;
}

function initForms() {
  initComplaintForms();
  initNoticeForm();
  initAdminForms();
  initParkingSlotForm();
  initParkingAllocationForm();

  const payButtons = document.querySelectorAll('.pay-btn');
  payButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Redirecting to payment gateway... (Demo)', 'info');
    });
  });
}

function initParkingAllocationForm() {
  const allocationForm = document.getElementById('allocationForm');
  const addButton = document.getElementById('add-allocation-btn');
  const saveButton = document.getElementById('save-allocation-btn');
  const { createSlotToggle } = getParkingSlotInputElements();

  if (addButton) {
    addButton.addEventListener('click', window.showAllocationModal);
  }

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      await window.saveAllocation();
    });
  }

  if (!allocationForm) return;

  if (createSlotToggle) {
    createSlotToggle.addEventListener('change', (event) => {
      setParkingSlotCreationMode(event.target.checked);
    });
  }

  setParkingSlotCreationMode(Boolean(createSlotToggle?.checked));

  allocationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await window.saveAllocation();
  });
}

function initParkingSlotForm() {
  const slotForm = document.getElementById('parking-slot-form');
  const submitButton = document.getElementById('add-parking-slot-btn');
  if (!slotForm) return;

  slotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!slotForm.reportValidity()) return;

    const formData = new FormData(slotForm);
    const parkingSlot = {
      slot: normalizeParkingSlotName(formData.get('slotName')),
      location: formData.get('location')?.toString().trim(),
      status: formData.get('status')?.toString().trim() || 'available'
    };

    if (!parkingSlot.slot) {
      showToast('Please enter a slot name', 'warning');
      return;
    }

    if (parkingSlotExists(parkingSlot.slot)) {
      showToast(`${parkingSlot.slot} already exists. Choose another slot name.`, 'warning');
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
      }

      const ref = await saveParkingSlot(parkingSlot);
      showToast(
        ref?.localOnly
          ? 'Parking slot saved locally. Firebase rules are still blocking database writes.'
          : 'Parking slot added successfully!',
        ref?.localOnly ? 'warning' : 'success'
      );
      slotForm.reset();
      renderParkingSlotOptions();
    } catch (error) {
      showToast(error.message || 'Failed to add parking slot.', 'danger');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Slot';
      }
    }
  });
}

function initAdminForms() {
  const addResidentForm = document.getElementById('add-resident-form');
  if (!addResidentForm) return;

  addResidentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusEl = document.getElementById('add-resident-status');
    const submitBtn = document.getElementById('add-resident-btn');
    const formData = new FormData(addResidentForm);
    const resident = {
      name: formData.get('name')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      flat: formData.get('flat')?.toString().trim(),
      floorNumber: formData.get('floorNumber')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      role: 'resident'
    };

    if (!addResidentForm.reportValidity()) return;

    setAuthStatus(statusEl, 'info', 'Creating account...');
    submitBtn.disabled = true;

    try {
      const temporaryPassword = generateTemporaryPassword();

      // 1. Create the user via Backend API, with a Firebase client fallback for static deployments.
      const data = await createResidentAuthAccount(resident, temporaryPassword);

      // 2. Add resident details to Realtime Database
      await createResidentProfile(data.localId, resident);

      // 3. Send password setup email to resident
      await sendResidentPasswordSetupEmail(resident.email);

      setAuthStatus(statusEl, 'success', 'Resident account created. Password setup email sent.');
      addResidentForm.reset();
      
      // Close modal after delay
      setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addResidentModal'));
        if (modal) modal.hide();
        clearAuthStatus(statusEl);
      }, 2000);

    } catch (error) {
      console.error('[admin] add resident failed', error);
      setAuthStatus(statusEl, 'danger', error.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function createResidentAuthAccount(resident, password) {
  try {
    return await createResidentViaBackend(resident, password);
  } catch (error) {
    if (!shouldUseClientAuthFallback(error)) {
      throw error;
    }

    console.warn('[admin] create-user API unavailable, falling back to Firebase client auth', error);
    return createResidentViaSecondaryAuth(resident, password);
  }
}

async function createResidentViaBackend(resident, password) {
  let response;

  try {
    response = await fetch('/api/auth/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: resident.email,
        password,
        role: resident.role,
        displayName: resident.name
      })
    });
  } catch (error) {
    error.apiUnavailable = true;
    throw error;
  }

  const data = await readApiResponse(response, 'Failed to create resident account');
  if (!response.ok) {
    const error = new Error(data.error || `Failed to create resident account (HTTP ${response.status})`);
    error.status = response.status;
    error.apiUnavailable = response.status === 404 || response.status === 405 || response.status >= 500;
    throw error;
  }

  if (!data.localId) {
    const error = new Error('Backend created the resident account but did not return a Firebase user id.');
    error.apiUnavailable = true;
    throw error;
  }

  return data;
}

async function createResidentViaSecondaryAuth(resident, password) {
  if (!firebaseApp || !runtimeFirebaseConfig.apiKey) {
    throw new Error('Firebase is not configured, so the resident account cannot be created.');
  }

  const secondaryAppName = `resident-create-${Date.now()}`;
  const secondaryApp = firebase.initializeApp(runtimeFirebaseConfig, secondaryAppName);
  const secondaryAuth = secondaryApp.auth();

  try {
    const userCredential = await secondaryAuth.createUserWithEmailAndPassword(resident.email, password);
    await userCredential.user.updateProfile({ displayName: resident.role || 'resident' });
    return {
      status: 'success',
      email: userCredential.user.email,
      localId: userCredential.user.uid
    };
  } finally {
    await secondaryAuth.signOut().catch(() => {});
    await secondaryApp.delete().catch(() => {});
  }
}

async function sendResidentPasswordSetupEmail(email) {
  try {
    const resetResponse = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const resetData = await readApiResponse(resetResponse, 'Resident created, but password setup email could not be sent.');
    if (!resetResponse.ok) {
      const error = new Error(resetData.error || `Resident created, but password setup email could not be sent (HTTP ${resetResponse.status}).`);
      error.status = resetResponse.status;
      error.apiUnavailable = resetResponse.status === 404 || resetResponse.status === 405 || resetResponse.status >= 500;
      throw error;
    }
  } catch (error) {
    if (!shouldUseClientAuthFallback(error)) {
      throw error;
    }

    console.warn('[admin] reset-password API unavailable, falling back to Firebase client auth', error);
    if (!auth) {
      throw new Error('Resident created, but password setup email could not be sent because Firebase Auth is not configured.');
    }
    await auth.sendPasswordResetEmail(email, { url: getEmailRedirectUrl() });
  }
}

function shouldUseClientAuthFallback(error) {
  return Boolean(error?.apiUnavailable || error instanceof TypeError);
}

function generateTemporaryPassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let index = 0; index < length; index += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function readApiResponse(response, fallbackMessage = 'Request failed') {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (!body.trim()) {
    return response.ok
      ? {}
      : { error: `${fallbackMessage} (HTTP ${response.status}).` };
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error(`${fallbackMessage}: backend returned invalid JSON.`);
    }
  }

  if (!response.ok) {
    throw new Error(`${fallbackMessage}: ${body.slice(0, 180)}`);
  }

  return { message: body };
}

function initComplaintForms() {
  const complaintForms = document.querySelectorAll('[data-complaint-form]');
  complaintForms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const formData = new FormData(form);
        const complaint = {
          title: formData.get('subject')?.toString().trim() || 'Complaint',
          description: formData.get('description')?.toString().trim() || '',
          resident: formData.get('resident')?.toString().trim() || auth?.currentUser?.email || 'Resident',
          flat: formData.get('flat')?.toString().trim() || '-',
          priority: formData.get('priority')?.toString().trim() || 'Medium',
          status: 'Pending',
          date: new Date().toISOString()
        };

        const ref = await saveComplaint(complaint);

        showToast(
          ref?.localOnly
            ? 'Complaint submitted locally. Firebase rules are blocking database writes.'
            : 'Complaint submitted successfully!',
          ref?.localOnly ? 'warning' : 'success'
        );
        form.reset();
      } catch (error) {
        showToast(error.message || 'Failed to submit complaint.', 'danger');
      }
    });
  });
}

function initNoticeForm() {
  const noticeForm = document.getElementById('notice-form');
  if (!noticeForm) return;

  noticeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const formData = new FormData(noticeForm);
      const notice = {
        title: formData.get('title')?.toString().trim() || 'Notice',
        content: formData.get('content')?.toString().trim() || '',
        target: formData.get('target')?.toString().trim() || 'All Residents',
        author: auth?.currentUser?.email || 'Admin',
        date: new Date().toISOString()
      };

      await addCollectionItem('notices', notice);

      showToast('Notice published successfully!', 'success');
      noticeForm.reset();
    } catch (error) {
      showToast(error.message || 'Failed to publish notice.', 'danger');
    }
  });
}

async function addCollectionItem(collectionName, item) {
  ensureDatabaseAvailable(`write ${collectionName}`);

  try {
    return await database.ref(collectionName).push(item);
  } catch (error) {
    console.error(`[database] failed to write ${collectionName}`, error);
    throw new Error(`Unable to save ${collectionName} to Firebase.`);
  }
}

async function saveComplaint(complaint) {
  if (!database) {
    return saveLocalComplaint(complaint);
  }

  try {
    return await database.ref('complaints').push(complaint);
  } catch (error) {
    console.error('[database] failed to write complaints', error);
    if (isPermissionDeniedError(error)) {
      return saveLocalComplaint(complaint);
    }
    throw new Error('Unable to save complaint to Firebase.');
  }
}

function saveLocalComplaint(complaint) {
  const localComplaint = {
    id: `local-complaint-${Date.now()}`,
    ...complaint
  };

  window.SMSData.complaints = [
    localComplaint,
    ...window.SMSData.complaints
  ];
  persistLocalComplaints();
  renderAppData();

  return { key: localComplaint.id, localOnly: true };
}

function mergeLocalComplaints() {
  const localComplaints = readLocalComplaints();
  if (!localComplaints.length) return;

  const knownIds = new Set(window.SMSData.complaints.map((complaint) => complaint.id));
  const missingLocalComplaints = localComplaints.filter((complaint) => !knownIds.has(complaint.id));
  if (!missingLocalComplaints.length) return;

  window.SMSData.complaints = [
    ...missingLocalComplaints,
    ...window.SMSData.complaints
  ];
}

function persistLocalComplaints() {
  try {
    const localComplaints = window.SMSData.complaints.filter((complaint) => {
      return typeof complaint.id === 'string' && complaint.id.startsWith('local-complaint-');
    });
    localStorage.setItem(localComplaintsStorageKey, JSON.stringify(localComplaints));
  } catch (error) {
    console.warn('[storage] failed to persist local complaints', error);
  }
}

function readLocalComplaints() {
  try {
    const storedValue = localStorage.getItem(localComplaintsStorageKey);
    const complaints = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(complaints) ? complaints : [];
  } catch (error) {
    console.warn('[storage] failed to read local complaints', error);
    return [];
  }
}

async function seedDefaultParkingSlots() {
  if (parkingSlotsSeeded || !database) return;
  parkingSlotsSeeded = true;

  const updates = {};
  defaultSMSData.parkingSlots.forEach((slot) => {
    const key = `slot${slot.id || slot.slot?.replace(/\D/g, '')}`;
    updates[`parkingSlots/${key}`] = {
      slot: slot.slot,
      location: slot.location || '',
      status: slot.status || 'available'
    };
  });

  try {
    await database.ref().update(updates);
  } catch (error) {
    parkingSlotsSeeded = false;
    if (isPermissionDeniedError(error)) {
      console.warn('[database] parking slot seed skipped because Firebase rules denied access.');
      return;
    }
    console.error('[database] failed to seed parking slots', error);
  }
}

async function saveParkingSlot(parkingSlot) {
  ensureDatabaseAvailable('save parking slot');

  try {
    const existingSlot = await findParkingSlotRecord(parkingSlot.slot);
    if (existingSlot?.key) {
      throw new Error(`${parkingSlot.slot} already exists.`);
    }

    const slotRef = database.ref('parkingSlots').push();
    const slotRecord = {
      slot: parkingSlot.slot,
      location: parkingSlot.location || '',
      status: (parkingSlot.status || 'available').toLowerCase()
    };

    await database.ref().update({
      [`parkingSlots/${slotRef.key}`]: slotRecord
    });

    return slotRef;
  } catch (error) {
    console.error('[database] failed to save parking slot', error);
    if (isPermissionDeniedError(error)) {
      return saveLocalParkingSlot(parkingSlot);
    }
    throw error instanceof Error ? error : new Error('Unable to save parking slot to Firebase.');
  }
}

async function saveParkingAllocation(allocation) {
  ensureDatabaseAvailable('save parking allocation');

  try {
    const allocationRef = database.ref('parkingAllocations').push();
    const allocationRecord = {
      ...allocation,
      createdAt: new Date().toISOString(),
      createdBy: auth?.currentUser?.email || 'system'
    };
    const parkingSlot = await findParkingSlotRecord(allocation.slot);
    const slotRef = parkingSlot?.key
      ? database.ref(`parkingSlots/${parkingSlot.key}`)
      : database.ref('parkingSlots').push();

    const slotRecord = {
      ...(parkingSlot?.value || {}),
      slot: allocation.slot,
      location: parkingSlot?.value?.location || allocation.location || '',
      status: getSlotStatusForAllocation(allocation.status),
      allocationId: allocationRef.key
    };

    await database.ref().update({
      [`parkingAllocations/${allocationRef.key}`]: allocationRecord,
      [`parkingSlots/${slotRef.key}`]: slotRecord
    });

    return allocationRef;
  } catch (error) {
    console.error('[database] failed to save parking allocation', error);
    if (isPermissionDeniedError(error)) {
      return saveLocalParkingAllocation(allocation);
    }
    throw new Error('Unable to save parking allocation to Firebase.');
  }
}

async function findParkingSlotRecord(slotName) {
  const snapshot = await database
    .ref('parkingSlots')
    .orderByChild('slot')
    .equalTo(slotName)
    .limitToFirst(1)
    .once('value');
  const value = snapshot.val();
  if (!value) return null;

  const [key, slot] = Object.entries(value)[0];
  return { key, value: slot };
}

function getSlotStatusForAllocation(status) {
  return (status || '').toLowerCase() === 'active' ? 'occupied' : 'reserved';
}

function saveLocalParkingSlot(parkingSlot) {
  const id = `local-slot-${Date.now()}`;
  window.SMSData.parkingSlots.push({
    id,
    slot: parkingSlot.slot,
    location: parkingSlot.location || '',
    status: (parkingSlot.status || 'available').toLowerCase()
  });
  renderAppData();
  return { key: id, localOnly: true };
}

function saveLocalParkingAllocation(allocation) {
  const id = `local-${Date.now()}`;
  const localAllocation = { id, ...allocation };
  const slotStatus = getSlotStatusForAllocation(allocation.status);
  const existingSlot = window.SMSData.parkingSlots.find((slot) => slot.slot === allocation.slot);

  window.SMSData.parkingAllocations = [
    localAllocation,
    ...window.SMSData.parkingAllocations
  ];

  if (existingSlot) {
    existingSlot.location = existingSlot.location || allocation.location || '';
    existingSlot.status = slotStatus;
    existingSlot.allocationId = id;
  } else {
    window.SMSData.parkingSlots.push({
      id,
      slot: allocation.slot,
      location: allocation.location || '',
      status: slotStatus,
      allocationId: id
    });
  }

  renderAppData();
  return { key: id, localOnly: true };
}

function deleteLocalParkingAllocation(allocationId) {
  const allocation = window.SMSData.parkingAllocations.find((item) => item.id === allocationId);
  window.SMSData.parkingAllocations = window.SMSData.parkingAllocations.filter((item) => item.id !== allocationId);

  if (allocation?.slot) {
    const parkingSlot = window.SMSData.parkingSlots.find((slot) => slot.slot === allocation.slot);
    if (parkingSlot) {
      parkingSlot.status = 'available';
      delete parkingSlot.allocationId;
    }
  }

  renderAppData();
}

function isPermissionDeniedError(error) {
  const message = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return message.includes('permission_denied') || message.includes('permission denied');
}

function ensureDatabaseAvailable(action) {
  if (database) return;
  throw new Error(`Cannot ${action} because Firebase Realtime Database is not configured.`);
}

async function createResidentProfile(uid, resident) {
  ensureDatabaseAvailable('save resident profile');

  if (!uid) {
    throw new Error('Cannot save resident profile without a Firebase user id.');
  }

  const profile = {
    id: uid,
    ...resident,
    role: resident.role || 'resident',
    createdAt: new Date().toISOString()
  };

  await database.ref().update({
    [`residents/${uid}`]: profile,
    [`users/${uid}`]: {
      email: resident.email || '',
      phone: resident.phone || '',
      role: profile.role
    }
  });

  try {
    await database.ref('stats/totalResidents').transaction((current) => (current || 0) + 1);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      console.info('[database] resident saved, but totalResidents counter was not updated because rules denied access.');
      return;
    }
    throw error;
  }
}

async function syncCurrentUserRole(user) {
  if (!database || !user?.uid) return;

  try {
    await database.ref(`users/${user.uid}`).update({
      email: user.email || '',
      role: getUserRole(user)
    });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      console.info('[database] user role sync skipped because Firebase rules denied access.');
      return;
    }
    console.warn('[database] failed to sync user role', error);
  }
}

function showToast(message, variant = 'info') {
  const container = getToastContainer();
  const toastEl = document.createElement('div');
  const variantClass = variant === 'danger'
    ? 'text-bg-danger'
    : variant === 'success'
      ? 'text-bg-success'
      : variant === 'warning'
        ? 'text-bg-warning'
        : 'text-bg-dark';

  toastEl.className = `toast align-items-center border-0 ${variantClass}`;
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 3200 });
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
  toast.show();
}

function getToastContainer() {
  let container = document.getElementById('app-toast-container');
  if (container) return container;

  container = document.createElement('div');
  container.id = 'app-toast-container';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  document.body.appendChild(container);
  return container;
}

async function initAuth() {
  console.log('[auth] initAuth');

  return new Promise((resolve) => {
    let initialStateResolved = false;

    auth.onAuthStateChanged(async (user) => {
      console.log('[auth] stateChanged', user ? { email: user.email, displayName: user.displayName } : null);

      if (user) {
        sessionStorage.setItem('user_role', getUserRole(user));
        sessionStorage.setItem('user_email', user.email);
        await syncCurrentUserRole(user);
      } else {
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_email');
      }

      updateAuthProfile(user);
      updateHomeAuthState(user);
      await applyAuthGuard(user);

      if (!authFormInitialized && document.body?.dataset.authPage === 'login') {
        initAuthForm(user);
        authFormInitialized = true;
      }

      if (!initialStateResolved) {
        initialStateResolved = true;
        resolve(user);
      }
    });
  });
}

function applyInitialAuthState() {
  const storedRole = sessionStorage.getItem('user_role');
  const storedEmail = sessionStorage.getItem('user_email');
  
  if (storedRole) {
    // Mock a user object for immediate UI update
    const mockUser = { email: storedEmail, displayName: storedRole };
    updateAuthProfile(mockUser);
    updateHomeAuthState(mockUser);
  }
}

function initAuthForm(user) {
  const authForm = document.getElementById('login-form');
  if (!authForm) return;

  if (user && !isRecoveryFlow()) {
    window.location.href = getDashboardPath(getUserRole(user));
    return;
  }

  const authMode = document.getElementById('auth-mode');
  const submitButton = document.getElementById('auth-submit-btn');
  const emailField = document.getElementById('email-field');
  const passwordField = document.getElementById('password-field');
  const roleGroup = document.getElementById('role-group');
  const authStatus = document.getElementById('auth-status');
  const authHint = document.getElementById('auth-hint');
  const passwordInput = document.getElementById('auth-password');
  const emailInput = document.getElementById('auth-email');

  const updateAuthMode = () => {
    const mode = authMode.value;
    const isReset = mode === 'reset';
    const isSignup = mode === 'signup';
    const isPasswordUpdate = mode === 'update-password';

    emailField.classList.toggle('d-none', isPasswordUpdate);
    passwordField.classList.toggle('d-none', isReset);
    roleGroup.classList.toggle('d-none', !isSignup);
    emailInput.toggleAttribute('required', !isPasswordUpdate);
    passwordInput.toggleAttribute('required', !isReset);
    submitButton.innerHTML = isReset
      ? '<i class="fas fa-paper-plane me-2"></i>Send Reset Link'
      : isPasswordUpdate
        ? '<i class="fas fa-key me-2"></i>Set New Password'
        : isSignup
          ? '<i class="fas fa-user-plus me-2"></i>Create Account'
          : '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
    authHint.textContent = isReset
      ? 'Firebase will email a password reset link to this address.'
      : isPasswordUpdate
        ? 'Enter a new password after opening the reset link from your email.'
        : isSignup
          ? 'New users will be created in Firebase Auth with the selected role.'
          : 'Use an existing Firebase Auth email and password to sign in.';
    clearAuthStatus(authStatus);
  };

  authMode.addEventListener('change', updateAuthMode);
  if (isRecoveryFlow()) {
    authMode.value = 'update-password';
  }
  updateAuthMode();

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthStatus(authStatus);

    const mode = authMode.value;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'resident';

    setAuthStatus(authStatus, 'info', 'Please wait...');
    submitButton.disabled = true;

    try {
      if (mode === 'login') {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const signedInUser = userCredential.user;
        setAuthStatus(authStatus, 'success', 'Signed in successfully. Redirecting...');
        window.location.href = getDashboardPath(getUserRole(signedInUser));
        return;
      }

      if (mode === 'signup') {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: selectedRole });
        try {
          await createResidentProfile(userCredential.user.uid, {
            name: email.split('@')[0],
            email,
            flat: '-',
            role: selectedRole
          });
        } catch (profileError) {
          console.error('[auth] resident profile sync failed', profileError);
          throw new Error(`Account created, but resident profile sync failed: ${profileError.message}`);
        }
        setAuthStatus(authStatus, 'success', 'Account created and saved successfully.');
        authForm.reset();
        updateAuthMode();
        return;
      }

      if (mode === 'update-password') {
        const actionCode = new URLSearchParams(window.location.search).get('oobCode');
        if (!actionCode) throw new Error('Password reset link is missing or invalid.');

        await auth.confirmPasswordReset(actionCode, password);
        setAuthStatus(authStatus, 'success', 'Password updated successfully. Redirecting to sign in...');
        clearRecoveryHash();
        window.location.href = appPaths.login;
        return;
      }

      await auth.sendPasswordResetEmail(email, {
        url: getEmailRedirectUrl()
      });

      setAuthStatus(authStatus, 'success', 'Password reset email sent. Please check your inbox.');
    } catch (error) {
      setAuthStatus(authStatus, 'danger', error.message || 'Authentication failed.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function applyAuthGuard(user) {
  console.log('[auth] applyAuthGuard', {
    authRequired: document.body?.dataset.authRequired,
    roleRequired: document.body?.dataset.authRole,
    isLoginPage: document.body?.dataset.authPage === 'login',
    user: user ? { email: user.email, displayName: user.displayName } : null
  });

  const body = document.body;
  if (!body) return;

  const authRequired = body.dataset.authRequired === 'true';
  const roleRequired = body.dataset.authRole;
  const isLoginPage = body.dataset.authPage === 'login';

  if (isLoginPage && user && !isRecoveryFlow()) {
    window.location.href = getDashboardPath(getUserRole(user));
    return;
  }

  if (!authRequired) return;

  if (!user) {
    redirectToLogin();
    return;
  }

  if (roleRequired) {
    const userRole = getUserRole(user);
    if (userRole !== roleRequired) {
      window.location.href = getDashboardPath(userRole);
    }
  }
}

function updateAuthProfile(user) {
  const emailElement = document.querySelector('[data-auth-email]');
  const roleElement = document.querySelector('[data-auth-role-display]');

  if (emailElement) {
    emailElement.textContent = user?.email || 'Guest';
  }

  const role = user ? getUserRole(user) : 'visitor';
  if (roleElement) {
    roleElement.textContent = capitalize(role);
  }

  // Role-based sidebar link visibility
  const adminLinks = document.querySelectorAll('.nav-link[href*="admin-dashboard"]');
  const residentLinks = document.querySelectorAll('.nav-link[href*="resident-dashboard"]');
  
  adminLinks.forEach(link => {
    const parentLi = link.closest('li');
    if (parentLi) {
      parentLi.style.display = role === 'admin' ? 'block' : 'none';
    }
  });

  residentLinks.forEach(link => {
    const parentLi = link.closest('li');
    if (parentLi) {
      // Hide Resident Dashboard for Admins, show for Residents
      parentLi.style.display = role === 'resident' ? 'block' : 'none';
    }
  });
}

function updateHomeAuthState(user) {
  if (document.body?.dataset.homePage !== 'true') return;

  const authLink = document.querySelector('[data-home-auth-link]');
  const heroLink = document.querySelector('[data-home-hero-link]');
  const heroLabel = document.querySelector('[data-home-hero-label]');
  const greeting = document.querySelector('[data-home-greeting]');
  const logoutButton = document.querySelector('[data-home-logout-btn]');

  if (!authLink || !heroLink || !heroLabel || !greeting || !logoutButton) return;

  if (user) {
    const dashboardPath = getDashboardPath(getUserRole(user));
    authLink.href = dashboardPath;
    authLink.textContent = 'Dashboard';
    heroLink.href = dashboardPath;
    heroLabel.textContent = 'Open Dashboard';
    greeting.textContent = `Welcome back, ${user.email || capitalize(getUserRole(user))}`;
    logoutButton.classList.remove('d-none');
    return;
  }

  authLink.href = appPaths.login;
  authLink.textContent = 'Login';
  heroLink.href = appPaths.login;
  heroLabel.textContent = 'Get Started';
  greeting.textContent = 'Welcome to Society Management System';
  logoutButton.classList.add('d-none');
}

function showConfigWarning() {
  if (document.body?.dataset.authRequired === 'true') {
    redirectToLogin();
    return;
  }

  const configStatus = document.getElementById('firebase-config-status');
  if (!configStatus) return;

  const needsDatabaseUrl = hasFirebaseConfig && !hasDatabaseConfig;
  configStatus.className = 'alert alert-warning mb-4';
  configStatus.innerHTML = [
    '<strong>Firebase setup required.</strong>',
    'Add your Firebase config in <code>js/firebase-config.js</code> and enable Email/Password sign-in in the Firebase Console.',
    needsDatabaseUrl
      ? 'Realtime Database is enabled in the UI, so also add <code>databaseURL</code> to the Firebase config.'
      : ''
  ].join(' ');
}

function setAuthStatus(element, variant, message) {
  if (!element) return;
  element.className = `alert alert-${variant}`;
  element.textContent = message;
}

function clearAuthStatus(element) {
  if (!element) return;
  element.className = 'd-none';
  element.textContent = '';
}

function getUserRole(user) {
  return user?.displayName === 'admin' ? 'admin' : 'resident';
}

function getDashboardPath(role) {
  return role === 'admin' ? appPaths.admin : appPaths.resident;
}

function getEmailRedirectUrl() {
  const url = new URL(window.location.href);
  if (url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') {
    url.hostname = 'localhost';
  }
  url.pathname = `${pathname.substring(0, pathname.lastIndexOf('/'))}${isPagesRoute ? '/login.html' : '/pages/login.html'}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function redirectToLogin() {
  window.location.href = appPaths.login;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatShortDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isRecoveryFlow() {
  return window.location.hash.includes('type=recovery');
}

function clearRecoveryHash() {
  if (!window.location.hash) return;
  history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

async function logout() {
  if (auth) {
    await auth.signOut();
  }
  
  sessionStorage.removeItem('user_role');
  sessionStorage.removeItem('user_email');

  redirectToLogin();
}

window.logout = logout;

window.showAllocationModal = function() {
  const modalEl = document.getElementById('allocationModal');
  const form = document.getElementById('allocationForm');
  if (!modalEl || !form) return;

  const modal = new bootstrap.Modal(modalEl);
  form.reset();
  renderParkingSlotOptions();
  setParkingSlotCreationMode(false);
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  form.querySelector('[name="allocatedDate"]').value = today.toISOString().split('T')[0];
  form.querySelector('[name="expiryDate"]').value = nextYear.toISOString().split('T')[0];
  modal.show();
};

window.saveAllocation = async function() {
  const form = document.getElementById('allocationForm');
  const saveButton = document.getElementById('save-allocation-btn');
  if (!form || parkingAllocationSaving) return;
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const createNewSlot = formData.get('createSlot') === 'on';
  const selectedSlot = normalizeParkingSlotName(formData.get('slot'));
  const newSlot = normalizeParkingSlotName(formData.get('newSlot'));
  const allocation = {
    slot: createNewSlot ? newSlot : selectedSlot,
    location: formData.get('location')?.toString().trim(),
    ownerName: formData.get('ownerName')?.toString().trim(),
    flat: formData.get('flat')?.toString().trim(),
    vehicleNumber: formData.get('vehicleNumber')?.toString().trim(),
    status: formData.get('status') || 'pending',
    allocatedDate: formData.get('allocatedDate'),
    expiryDate: formData.get('expiryDate')
  };

  if (!allocation.slot) {
    showToast(createNewSlot ? 'Please enter a new slot name' : 'Please select a slot', 'warning');
    return;
  }

  if (!allocation.location) {
    showToast('Please select a parking location', 'warning');
    return;
  }

  if (createNewSlot && parkingSlotExists(allocation.slot)) {
    showToast(`${allocation.slot} already exists. Choose another slot name.`, 'warning');
    return;
  }

  if (allocation.expiryDate && allocation.allocatedDate && allocation.expiryDate < allocation.allocatedDate) {
    showToast('Expiry date cannot be before allocated date.', 'warning');
    return;
  }

  const existingSlot = window.SMSData.parkingSlots.find((slot) => normalizeParkingSlotName(slot.slot) === allocation.slot);
  const selectedSlotStatus = (existingSlot?.status || 'available').toLowerCase();
  if (existingSlot && selectedSlotStatus !== 'available') {
    showToast(`${allocation.slot} is already ${selectedSlotStatus}. Choose an available slot.`, 'warning');
    return;
  }

  try {
    parkingAllocationSaving = true;
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
    }

    const ref = await saveParkingAllocation(allocation);
    showToast(
      ref?.localOnly
        ? 'Saved locally. Firebase rules are still blocking database writes.'
        : 'Parking allocation saved!',
      ref?.localOnly ? 'warning' : 'success'
    );
    bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    form.reset();
  } catch (error) {
    showToast('Failed to save: ' + error.message, 'danger');
  } finally {
    parkingAllocationSaving = false;
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Allocation';
    }
  }
};

window.deleteAllocation = async function(allocationId) {
  if (!allocationId || !confirm('Delete this parking allocation?')) return;

  try {
    if (allocationId.startsWith('local-')) {
      deleteLocalParkingAllocation(allocationId);
      showToast('Local parking allocation deleted.', 'success');
      return;
    }

    ensureDatabaseAvailable('delete parking allocation');
    const allocation = window.SMSData.parkingAllocations.find((item) => item.id === allocationId);
    const updates = {
      [`parkingAllocations/${allocationId}`]: null
    };

    if (allocation?.slot) {
      const parkingSlot = await findParkingSlotRecord(allocation.slot);
      if (parkingSlot?.key) {
        updates[`parkingSlots/${parkingSlot.key}/status`] = 'available';
        updates[`parkingSlots/${parkingSlot.key}/allocationId`] = null;
      }
    }

    await database.ref().update(updates);
    showToast('Parking allocation deleted.', 'success');
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      deleteLocalParkingAllocation(allocationId);
      showToast('Deleted locally. Firebase rules are still blocking database writes.', 'warning');
      return;
    }
    showToast(error.message || 'Failed to delete allocation.', 'danger');
  }
};

window.editAllocation = function() {
  showToast('Delete and recreate the allocation to change it.', 'info');
};

function renderParkingAllocationsTable() {
  const tbody = document.querySelector('#parking-allocations-table tbody, .table tbody');
  if (!tbody || !window.SMSData.parkingAllocations) return;

  tbody.innerHTML = '';
  if (!window.SMSData.parkingAllocations.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          <i class="fas fa-inbox fs-1 text-muted mb-3"></i>
          No parking allocations
        </td>
      </tr>
    `;
    return;
  }

  window.SMSData.parkingAllocations.forEach((alloc) => {
    const row = document.createElement('tr');
    const statusBadge = alloc.status === 'active' 
      ? 'badge bg-success' 
      : alloc.status === 'pending' 
        ? 'badge bg-warning text-dark' 
        : 'badge bg-secondary';
    row.innerHTML = `
      <td><strong>${escapeHtml(alloc.slot)}</strong></td>
      <td>${escapeHtml(alloc.location || 'Not set')}</td>
      <td>${escapeHtml(alloc.ownerName)}</td>
      <td>${escapeHtml(alloc.flat)}</td>
      <td>${escapeHtml(alloc.vehicleNumber)}</td>
      <td><span class="${statusBadge}">${escapeHtml(capitalize(alloc.status))}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editAllocation('${alloc.id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteAllocation('${alloc.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
