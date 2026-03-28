const express = require('express');
const router = express.Router();
const { getAnalytics, getMyAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAnalytics);
router.get('/me', protect, getMyAnalytics);

module.exports = router;
