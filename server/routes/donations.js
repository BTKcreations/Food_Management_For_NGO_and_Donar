const express = require('express');
const router = express.Router();
const {
  createDonation, getDonations, getDonation,
  getMyDonations, claimDonation, updateDonationStatus, deleteDonation
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getDonations);
router.get('/my', protect, getMyDonations);
router.get('/:id', protect, getDonation);
router.post('/', protect, authorize('donor', 'admin'), upload.array('images', 3), createDonation);
router.put('/:id/claim', protect, authorize('ngo', 'volunteer', 'admin'), claimDonation);
router.put('/:id/status', protect, updateDonationStatus);
router.delete('/:id', protect, deleteDonation);

module.exports = router;
