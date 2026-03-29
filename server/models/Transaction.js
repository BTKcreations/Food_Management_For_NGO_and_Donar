const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destinationType: {
    type: String,
    enum: ['receiver', 'warehouse'],
    default: 'receiver'
  },
  allocatedServings: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryImages: [{
    type: String
  }],
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  liveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_transit', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  pickupTime: {
    type: Date,
    default: null
  },
  deliveryTime: {
    type: Date,
    default: null
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  deliveryLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  pickupCode: {
    type: String,
    select: false // Only show when specifically requested for security
  },
  deliveryCode: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

transactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
