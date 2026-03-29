const express = require('express');
const router = express.Router();
const { getInventory, updateInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('ngo', 'admin'));

router.get('/', getInventory);
router.put('/:id', updateInventory);

module.exports = router;
