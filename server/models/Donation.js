const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodType: {
    type: String,
    enum: ['cooked', 'raw', 'packaged', 'beverages', 'bakery', 'fruits_vegetables', 'other'],
    default: 'other'
  },
  source: {
    type: String,
    enum: ['restaurant', 'hotel', 'marriage_event', 'corporate_event', 'household', 'canteen', 'other'],
    default: 'other'
  },
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  quantity: {
    type: String,
    default: 'Unspecified'
  },
  servings: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingServings: {
    type: Number,
    default: function() {
      return this.servings;
    }
  },
  totalWeight: {
    type: Number,
    default: 0 // Optional weight in KG for impact calculations
  },
  preparedAt: {
    type: Date,
    required: [true, 'Preparation time is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required']
  },
  images: [{
    type: String
  }],
  items: [{
    name: { type: String, required: true },
    image: { type: String, required: true },
    quantityOrWeight: { type: String },
    servings: { type: Number },
    preparedAt: { type: Date },
    expiresAt: { type: Date }
  }],
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
    required: [true, 'Pickup address is required'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'partially_claimed', 'fully_claimed', 'picked_up', 'delivered', 'expired', 'cancelled'],
    default: 'available'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  safetyChecked: {
    type: Boolean,
    default: false
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  allergens: [{
    type: String
  }],
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 300
  },
  safetyCertified: {
    type: Boolean,
    default: false,
    required: [true, 'You must certify the food safety before donating']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for geospatial queries and status filtering
donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
