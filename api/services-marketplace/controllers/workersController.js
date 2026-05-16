const { ApiError } = require('../utils/apiError');

const seedWorkers = [
  {
    id: 'w1',
    full_name: 'Ravi Kumar',
    categories: ['Plumbers', 'House helpers'],
    experience_years: 6,
    phone_number: '9876543210',
    availability_status: 'available',
    average_rating: 4.7,
    verified: true,
    reviews: [
      { name: 'Amit', stars: 5, text: 'Quick response and good work.' },
      { name: 'Neha', stars: 4, text: 'Professional and clean finish.' }
    ]
  },
  {
    id: 'w2',
    full_name: 'Sana Ali',
    categories: ['Maids', 'Cleaners', 'Laundry'],
    experience_years: 4,
    phone_number: '9123456780',
    availability_status: 'available',
    average_rating: 4.5,
    verified: true,
    reviews: [{ name: 'Priya', stars: 5, text: 'Very hygienic and punctual.' }]
  },
  {
    id: 'w3',
    full_name: 'Vikram Singh',
    categories: ['Electricians'],
    experience_years: 8,
    phone_number: '9001122334',
    availability_status: 'unavailable',
    average_rating: 4.9,
    verified: true,
    reviews: [{ name: 'Rahul', stars: 5, text: 'Resolved the issue in one visit.' }]
  },
  {
    id: 'w4',
    full_name: 'Meera Joshi',
    categories: ['Cooks'],
    experience_years: 5,
    phone_number: '9898989898',
    availability_status: 'available',
    average_rating: 4.4,
    verified: false,
    reviews: [{ name: 'Jaya', stars: 4, text: 'Good taste and hygiene.' }]
  },
  {
    id: 'w5',
    full_name: 'Akash Verma',
    categories: ['AC repair', 'RO repair', 'Pest control'],
    experience_years: 7,
    phone_number: '9765432109',
    availability_status: 'available',
    average_rating: 4.6,
    verified: true,
    reviews: [{ name: 'Karan', stars: 5, text: 'Explained everything clearly.' }]
  }
];

const workersStore = new Map(seedWorkers.map((worker) => [worker.id, worker]));

function normalizeWorkerBody(body = {}, existing = {}) {
  const categories = Array.isArray(body.categories)
    ? body.categories
    : [body.category, body.category_name].filter(Boolean);

  const available = body.available;
  return {
    ...existing,
    ...body,
    full_name: body.full_name || body.name || existing.full_name,
    phone_number: body.phone_number || body.phone || existing.phone_number,
    categories: categories.length ? categories : existing.categories || [],
    experience_years: Number(body.experience_years ?? body.experienceYears ?? existing.experience_years ?? 0),
    availability_status: available === undefined
      ? (body.availability_status || existing.availability_status || 'available')
      : (available === false ? 'unavailable' : 'available')
  };
}

function listWorkers(req, res) {
  const { category, q, available } = req.query;
  let items = Array.from(workersStore.values());

  if (category && category !== 'all') {
    items = items.filter((w) => (w.categories || []).includes(category));
  }

  if (q) {
    const query = String(q).toLowerCase();
    items = items.filter((w) => {
      const text = `${w.full_name || ''} ${(w.categories || []).join(' ')}`.toLowerCase();
      return text.includes(query);
    });
  }

  if (available === 'true') {
    items = items.filter((w) => w.availability_status === 'available');
  }

  res.json({ data: items });
}

function getWorker(req, res) {
  const { workerId } = req.params;
  const worker = workersStore.get(workerId);
  if (!worker) throw new ApiError('Worker not found', 404);
  res.json({ data: worker });
}

function addWorker(req, res) {
  const worker = {
    id: req.params?.workerId || `w_${Date.now()}`,
    ...normalizeWorkerBody(req.body),
    verified: Boolean(req.body.verified),
    average_rating: Number(req.body.average_rating || req.body.rating || 4.2),
    reviews: Array.isArray(req.body.reviews) ? req.body.reviews : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const id = worker.id;
  workersStore.set(id, worker);
  res.status(201).json({ data: worker });
}

function editWorker(req, res) {
  const { workerId } = req.params;
  const existing = workersStore.get(workerId);
  if (!existing) throw new ApiError('Worker not found', 404);

  const updated = { ...normalizeWorkerBody(req.body, existing), updated_at: new Date().toISOString() };
  workersStore.set(workerId, updated);
  res.json({ data: updated });
}

function removeWorker(req, res) {
  const { workerId } = req.params;
  if (!workersStore.has(workerId)) throw new ApiError('Worker not found', 404);
  workersStore.delete(workerId);
  res.json({ ok: true });
}

function verifyWorker(req, res) {
  const { workerId } = req.params;
  const existing = workersStore.get(workerId);
  if (!existing) throw new ApiError('Worker not found', 404);

  const { verified } = req.body;
  existing.verified = Boolean(verified);
  existing.updated_at = new Date().toISOString();
  workersStore.set(workerId, existing);

  res.json({ data: existing });
}

function uploadIdProof(req, res) {
  const { workerId } = req.params;
  const existing = workersStore.get(workerId);
  if (!existing) throw new ApiError('Worker not found', 404);

  // Placeholder: integrate multer + storage later.
  existing.id_proof_url = req.body?.idProofUrl || 'uploaded://placeholder';
  existing.updated_at = new Date().toISOString();
  workersStore.set(workerId, existing);

  res.json({ data: existing });
}

module.exports = {
  listWorkers,
  getWorker,
  addWorker,
  editWorker,
  removeWorker,
  verifyWorker,
  uploadIdProof
};

