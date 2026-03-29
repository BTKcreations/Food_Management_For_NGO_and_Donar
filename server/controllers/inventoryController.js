const Inventory = require('../models/Inventory');

// @desc    Get all inventory for an NGO
// @route   GET /api/inventory
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ ngo: req.user._id })
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
};

// @desc    Update inventory quantity (Manual adjustment)
// @route   PUT /api/inventory/:id
exports.updateInventory = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    item.quantity = quantity;
    item.lastUpdated = Date.now();
    await item.save();

    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
