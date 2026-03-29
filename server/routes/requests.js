const express = require('express');
const router = express.Router();
const {
  createRequest, getRequests, getMyRequests,
  matchRequest, cancelRequest
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getRequests);
router.get('/my', protect, getMyRequests);
router.post('/', protect, authorize('ngo', 'receiver', 'admin'), createRequest);
router.put('/:id/match', protect, authorize('ngo', 'admin'), matchRequest);
router.put('/:id/cancel', protect, cancelRequest);

module.exports = router;
