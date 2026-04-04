const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  foodType: {
    type: String,
    enum: ['raw', 'packaged', 'beverages', 'bakery', 'fruits_vegetables', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'servings'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  sourceDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  },
  qualityImages: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for expiry tracking
inventorySchema.index({ ngo: 1, expiryDate: 1 });
inventorySchema.index({ ngo: 1, foodType: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
