const express = require('express');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const workersController = require('../controllers/workersController');

const router = express.Router();

// Resident listings
router.get('/workers', authGuard, workersController.listWorkers);
router.get('/workers/:workerId', authGuard, workersController.getWorker);

// Admin worker management
router.post('/admin/workers', authGuard, roleGuard(['admin']), workersController.addWorker);
router.patch('/admin/workers/:workerId', authGuard, roleGuard(['admin']), workersController.editWorker);
router.delete('/admin/workers/:workerId', authGuard, roleGuard(['admin']), workersController.removeWorker);
router.post('/admin/workers/:workerId/verify', authGuard, roleGuard(['admin']), workersController.verifyWorker);
router.post('/admin/workers/:workerId/id-proof', authGuard, roleGuard(['admin']), workersController.uploadIdProof);

module.exports = router;

