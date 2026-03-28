const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodType: {
    type: String,
    enum: ['cooked', 'raw', 'packaged', 'any'],
    default: 'any'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  quantity: {
    type: String,
    required: [true, 'Quantity needed is required']
  },
  servingsNeeded: {
    type: Number,
    required: [true, 'Number of servings needed is required'],
    min: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'matched', 'fulfilled', 'cancelled'],
    default: 'open'
  },
  matchedDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null
  },
  beneficiaryCount: {
    type: Number,
    default: 1,
    min: 1
  },
  needByTime: {
    type: Date,
    required: [true, 'Need-by time is required']
  }
}, {
  timestamps: true
});

requestSchema.index({ location: '2dsphere' });
requestSchema.index({ status: 1, urgency: 1 });

module.exports = mongoose.model('Request', requestSchema);
