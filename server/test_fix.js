require('dotenv').config();
const mongoose = require('mongoose');
const Donation = require('./models/Donation');
const User = require('./models/User'); // Required for population

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food_bridge');
    console.log('Connected to MongoDB');

    const donation = await Donation.findOne()
      .populate('donor', 'name email phone organization profileImage address')
      .populate('claimedBy', 'name email phone organization')
      .populate('assignedVolunteer', 'name email phone');

    console.log('Successfully fetched and populated donation:', donation ? 'success' : 'not found');
    if (donation) {
        console.log('Sample donation keys:', Object.keys(donation.toObject()));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
