const Inventory = require('../models/Inventory');
const Request = require('../models/Request');
const Notification = require('../models/Notification');

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

// @desc    Distribute inventory to a request or manual recipient
// @route   POST /api/inventory/:id/distribute
exports.distributeInventory = async (req, res) => {
  try {
    const { quantity, requestId, manualRecipient } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // Check if enough stock exists
    const distributeQty = parseInt(quantity);
    const availableQty = parseInt(item.quantity) || 0;
    
    if (distributeQty > availableQty) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough stock. Available: ${availableQty}` 
      });
    }

    // Deduct from inventory
    item.quantity = availableQty - distributeQty;
    if (item.quantity <= 0) {
      await Inventory.findByIdAndDelete(req.params.id);
    } else {
      await item.save();
    }

    // If linked to a Request
    if (requestId) {
      const request = await Request.findById(requestId);
      if (request) {
        request.status = 'fulfilled';
        await request.save();

        // Notify the requester
        await Notification.create({
          recipient: request.requester,
          type: 'request_fulfilled',
          title: '🍱 Food is on its way!',
          message: `Your request has been fulfilled from the ${req.user.organization || 'NGO'} warehouse.`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Distribution successful',
      remainingQuantity: item.quantity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
