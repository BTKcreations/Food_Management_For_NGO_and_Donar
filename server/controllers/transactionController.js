const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a transaction when donation is claimed
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { donationId, volunteerId, requestId, notes } = req.body;

    const donation = await Donation.findById(donationId).populate('donor');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const transaction = await Transaction.create({
      donation: donationId,
      donor: donation.donor._id,
      receiver: req.user._id,
      volunteer: volunteerId || null,
      request: requestId || null,
      pickupLocation: donation.location,
      notes
    });

    // Notify volunteer if assigned
    if (volunteerId) {
      await Notification.create({
        recipient: volunteerId,
        sender: req.user._id,
        type: 'volunteer_assigned',
        title: '🚗 You have a new delivery assignment!',
        message: `Please pick up ${donation.foodName} from ${donation.address}.`,
        relatedDonation: donationId,
        relatedTransaction: transaction._id
      });

      donation.assignedVolunteer = volunteerId;
      await donation.save();
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// @desc    Get all transactions (admin) or user transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      if (role === 'volunteer') {
        filter.volunteer = req.user._id;
      } else if (role === 'donor') {
        filter.donor = req.user._id;
      } else if (role === 'receiver') {
        filter.receiver = req.user._id;
      } else {
        // Base visibility: user is donor, receiver, or current volunteer
        const basicVisibility = [
          { donor: req.user._id },
          { receiver: req.user._id },
          { volunteer: req.user._id }
        ];

        // If user is a volunteer, they also need to see "Marketplace" items
        // (Claimed by NGO, but no volunteer yet)
        if (req.user.role === 'volunteer') {
          basicVisibility.push({ volunteer: null, status: 'accepted' });
        }

        filter.$or = basicVisibility;
      }
    }

    if (status) {
      filter.status = status;
    } else if (req.query.activeOnly === 'true') {
      filter.status = { $in: ['accepted', 'picked_up', 'in_transit'] };
    }

    const transactions = await Transaction.find(filter)
      .populate('donation', 'foodName foodType quantity servings status images address')
      .populate('donor', 'name email phone organization')
      .populate('receiver', 'name email phone organization')
      .populate('volunteer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// @desc    Get available transactions for volunteer marketplace
// @route   GET /api/transactions/available
exports.getAvailableTransactions = async (req, res) => {
  try {
    // Only return transactions that are accepted by an NGO but HAVE NO VOLUNTEER YET
    const filter = {
      status: 'accepted',
      volunteer: null
    };

    const transactions = await Transaction.find(filter)
      .populate('donation', 'foodName foodType quantity servings status images address location')
      .populate('donor', 'name email phone organization')
      .populate('receiver', 'name email phone organization')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available deliveries',
      error: error.message
    });
  }
};

// @desc    Get single transaction with secure codes
// @route   GET /api/transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('donation')
      .populate('donor', 'name email phone organization')
      .populate('receiver', 'name email phone organization')
      .populate('volunteer', 'name email phone');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Authorization check
    const isDonor = transaction.donor._id.toString() === req.user._id.toString();
    const isReceiver = transaction.receiver._id.toString() === req.user._id.toString();
    const isVolunteer = transaction.volunteer?._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isReceiver && !isVolunteer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Build response with conditional codes
    const response = transaction.toObject();
    
    // Select codes manually since they are hidden by default
    const secureData = await Transaction.findById(req.params.id).select('+pickupCode +deliveryCode');
    
    if (isDonor || isAdmin) response.pickupCode = secureData.pickupCode;
    if (isReceiver || isAdmin) response.deliveryCode = secureData.deliveryCode;

    res.status(200).json({ success: true, transaction: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update transaction status with verification code
// @route   PUT /api/transactions/:id/status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status, verificationCode } = req.body;
    const transaction = await Transaction.findById(req.params.id)
      .select('+pickupCode +deliveryCode')
      .populate('donation');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // SECURITY: Status verification codes
    if (status === 'in_transit') {
      if (verificationCode !== transaction.pickupCode) {
        return res.status(400).json({ success: false, message: 'Invalid Pickup Code' });
      }
    } else if (status === 'completed') {
      if (verificationCode !== transaction.deliveryCode) {
        return res.status(400).json({ success: false, message: 'Invalid Delivery Code' });
      }
    }

    transaction.status = status;

    if (status === 'in_transit') {
      transaction.pickupTime = new Date();
      if (transaction.donation) {
        transaction.donation.status = 'picked_up';
        await transaction.donation.save();
      }
    } else if (status === 'completed') {
      transaction.deliveryTime = new Date();
      if (transaction.donation) {
        transaction.donation.status = 'delivered';
        await transaction.donation.save();
      }
      
      // Save delivery proof images if provided
      if (req.files && req.files.length > 0) {
        transaction.deliveryImages = req.files.map(file => file.path);
      }
      
      // Update volunteer stats & Karma
      if (transaction.volunteer) {
        await User.findByIdAndUpdate(transaction.volunteer, { 
          $inc: { 
            totalDeliveries: 1,
            karmaPoints: 10 
          } 
        });
      }
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      message: `Transaction status updated to '${status}'`,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
};

// @desc    Self-assign volunteer to transaction
// @route   PUT /api/transactions/:id/assign
exports.selfAssign = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    if (transaction.volunteer) return res.status(400).json({ success: false, message: 'Already assigned' });
    
    transaction.volunteer = req.user._id;
    await transaction.save();

    // Also update donation
    const Donation = require('../models/Donation');
    await Donation.findByIdAndUpdate(transaction.donation, { assignedVolunteer: req.user._id });

    res.status(200).json({ success: true, message: 'Assigned successfully', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update live location of volunteer
// @route   PUT /api/transactions/:id/location
exports.updateLiveLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        liveLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        lastLocationUpdate: Date.now()
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, liveLocation: transaction.liveLocation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating location' });
  }
};

// @desc    Add feedback to transaction
// @route   PUT /api/transactions/:id/feedback
exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.feedback = { rating, comment };
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding feedback'
    });
  }
};
