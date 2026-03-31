const express = require('express');
const router = express.Router();
const {
  createTransaction, getTransactions, getTransaction,
  updateTransactionStatus, addFeedback, updateLiveLocation,
  distributeInventory
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);
router.post('/outbound', protect, authorize('ngo', 'admin'), distributeInventory);
router.get('/:id', protect, getTransaction);
router.put('/:id/status', protect, upload.array('deliveryImages', 3), updateTransactionStatus);
router.put('/:id/location', protect, authorize('ngo', 'admin'), updateLiveLocation);
router.put('/:id/feedback', protect, addFeedback);

module.exports = router;
