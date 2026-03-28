const express = require('express');
const router = express.Router();
const {
  createTransaction, getTransactions, getTransaction,
  updateTransactionStatus, addFeedback, selfAssign, updateLiveLocation,
  getAvailableTransactions
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getTransactions);
router.get('/available', protect, authorize('volunteer', 'admin'), getAvailableTransactions);
router.post('/', protect, createTransaction);
router.get('/:id', protect, getTransaction);
router.put('/:id/status', protect, upload.array('deliveryImages', 3), updateTransactionStatus);
router.put('/:id/location', protect, authorize('volunteer', 'admin'), updateLiveLocation);
router.put('/:id/feedback', protect, addFeedback);
router.put('/:id/assign', protect, authorize('volunteer', 'admin'), selfAssign);

module.exports = router;
