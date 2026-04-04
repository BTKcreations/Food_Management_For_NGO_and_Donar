const express = require('express');
const router = express.Router();
const { getInventory, updateInventory, distributeInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('ngo', 'admin'));

router.get('/', getInventory);
router.put('/:id', updateInventory);
router.post('/:id/distribute', distributeInventory);

module.exports = router;
