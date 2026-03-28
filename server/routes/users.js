const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, verifyUser,
  toggleUserActive, getAvailableVolunteers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getUsers);
router.get('/volunteers/available', protect, getAvailableVolunteers);
router.get('/:id', protect, getUser);
router.put('/:id/verify', protect, authorize('admin'), verifyUser);
router.put('/:id/toggle-active', protect, authorize('admin'), toggleUserActive);

module.exports = router;
