const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Inventory = require('../models/Inventory');
const Request = require('../models/Request');

// @desc    Create a transaction when donation is claimed
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { donationId, requestId, notes } = req.body;

    const donation = await Donation.findById(donationId).populate('donor');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const transaction = await Transaction.create({
      donation: donationId,
      donor: donation.donor._id,
      receiver: req.user._id,
      ngo: req.user._id, // The NGO claiming the food
      request: requestId || null,
      pickupLocation: donation.location,
      allocatedServings: req.body.allocatedServings || donation.remainingServings,
      notes
    });

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

// @desc    Distribute food from NGO inventory to a Receiver Request
// @route   POST /api/transactions/outbound
exports.distributeInventory = async (req, res) => {
  try {
    const { inventoryId, requestId, allocatedQuantity, notes } = req.body;
    
    // 1. Fetch Inventory item
    const inventory = await Inventory.findById(inventoryId).populate('sourceDonation');
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (inventory.ngo.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not your inventory' });
    
    // 2. Fetch Receiver Request
    const receiverRequest = await Request.findById(requestId).populate('requester');
    if (!receiverRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (receiverRequest.status !== 'open') return res.status(400).json({ success: false, message: 'Request is no longer open' });
    
    const qtyToDeduct = parseInt(allocatedQuantity) || receiverRequest.servingsNeeded;
    if (qtyToDeduct > inventory.quantity) {
      return res.status(400).json({ success: false, message: `Only ${inventory.quantity} remaining in inventory` });
    }
    
    // 3. Create Outbound Transaction
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    const transaction = await Transaction.create({
      donation: inventory.sourceDonation ? inventory.sourceDonation._id : null,
      donor: inventory.sourceDonation ? inventory.sourceDonation.donor : req.user._id,
      receiver: receiverRequest.requester._id,
      request: receiverRequest._id,
      ngo: req.user._id,
      destinationType: 'receiver',
      allocatedServings: qtyToDeduct,
      status: 'accepted',
      pickupLocation: req.user.location || { type: 'Point', coordinates: [0, 0] },
      notes: notes || `Outbound Delivery from Hub: ${inventory.foodName}`,
      pickupCode,
      deliveryCode
    });
    
    // 4. Update Inventory
    inventory.quantity -= qtyToDeduct;
    if (inventory.quantity <= 0) {
      await Inventory.findByIdAndDelete(inventory._id);
    } else {
      await inventory.save();
    }
    
    // 5. Update Request
    receiverRequest.status = 'matched';
    receiverRequest.matchedDonation = transaction.donation;
    await receiverRequest.save();
    
    // 6. Notify Receiver
    await Notification.create({
      recipient: receiverRequest.requester._id,
      sender: req.user._id,
      type: 'delivery_assigned',
      title: '🚚 Your Food Request is Fulfilling!',
      message: `${req.user.name} is preparing ${qtyToDeduct} servings of ${inventory.foodName} for your location.`,
      relatedDonation: transaction.donation
    });
    
    res.status(201).json({ success: true, message: 'Outbound Delivery initialized', transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions (admin) or user transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      if (role === 'ngo') {
        filter.ngo = req.user._id;
      } else if (role === 'donor') {
        filter.donor = req.user._id;
      } else if (role === 'receiver') {
        filter.receiver = req.user._id;
      } else {
        // Base visibility: user is donor, receiver, or ngo
        filter.$or = [
          { donor: req.user._id },
          { receiver: req.user._id },
          { ngo: req.user._id }
        ];
      }
    }

    if (status) {
      filter.status = status;
    } else if (req.query.activeOnly === 'true') {
      filter.status = { $in: ['accepted', 'picked_up', 'in_transit'] };
    }

    const transactions = await Transaction.find(filter)
      .populate('donation', 'foodName foodType source quantity servings status images address')
      .populate('donor', 'name email phone organization')
      .populate('receiver', 'name email phone organization')
      .populate('ngo', 'name email phone')
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
      .populate('ngo', 'name email phone');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Authorization check
    const isDonor = transaction.donor._id.toString() === req.user._id.toString();
    const isReceiver = transaction.receiver._id.toString() === req.user._id.toString();
    const isNGO = transaction.ngo?._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isReceiver && !isNGO && !isAdmin) {
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
      
      // Update ngo stats & Karma
      if (transaction.ngo) {
        await User.findByIdAndUpdate(transaction.ngo, { 
          $inc: { 
            totalDeliveries: 1,
            karmaPoints: 10 
          } 
        });
      }

      // WAREHOUSE LOGIC: If destination is warehouse, add to NGO inventory
      if (transaction.destinationType === 'warehouse') {
        const Donation = require('../models/Donation');
        const donation = await Donation.findById(transaction.donation);
        
        if (donation.items && donation.items.length > 0) {
          const inventoryItems = donation.items.map(item => ({
            ngo: transaction.receiver,
            foodName: item.name,
            foodType: donation.foodType,
            quantity: item.servings > 0 ? item.servings : parseInt(item.quantityOrWeight) || 1,
            unit: item.servings > 0 ? 'servings' : 'units',
            expiryDate: item.expiresAt || donation.expiresAt,
            sourceDonation: donation._id,
            qualityImages: transaction.deliveryImages || []
          }));
          await Inventory.insertMany(inventoryItems);
        } else {
          await Inventory.create({
            ngo: transaction.receiver,
            foodName: donation.foodName,
            foodType: donation.foodType,
            quantity: transaction.allocatedServings || donation.quantity,
            expiryDate: donation.expiresAt,
            sourceDonation: donation._id,
            qualityImages: transaction.deliveryImages || []
          });
        }
      } else {
        // Increment receiver stats
        await User.findByIdAndUpdate(transaction.receiver, { $inc: { totalReceived: 1 } });
      }
    }

    await transaction.save();

    // TRIGGER NOTIFICATIONS FOR TRANSACTION UPDATES
    const notifs = [];
    if (status === 'in_transit') {
      // Notify Donor
      notifs.push({
        recipient: transaction.donor,
        sender: req.user._id,
        type: 'donation_picked_up',
        title: '📦 Your food was picked up!',
        message: `The volunteer has picked up ${transaction.donation?.foodName} and is on their way.`,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id
      });
      // Notify NGO (Receiver)
      notifs.push({
        recipient: transaction.receiver,
        sender: req.user._id,
        type: 'donation_picked_up',
        title: '🚚 Your food is coming!',
        message: `A volunteer is now in transit with your claimed food (${transaction.donation?.foodName}).`,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id
      });
    } else if (status === 'completed') {
       // Notify Donor
       notifs.push({
        recipient: transaction.donor,
        sender: req.user._id,
        type: 'donation_delivered',
        title: '✅ Mission Accomplished!',
        message: `Your donation of ${transaction.donation?.foodName} was delivered successfully.`,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id,
        images: transaction.deliveryImages || []
      });
      // Notify NGO
      notifs.push({
        recipient: transaction.receiver,
        sender: req.user._id,
        type: 'donation_delivered',
        title: '🍱 Food Arrived!',
        message: `The food you claimed (${transaction.donation?.foodName}) has been delivered.`,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id
      });
    }

    // Create appropriate notifications for Donor and NGO
    let donorTitle = '', donorMsg = '', donorNotifType = 'system_alert';
    let receiverTitle = '', receiverMsg = '', receiverNotifType = 'system_alert';

    if (status === 'picked_up') {
      // Notify Donor
      donorTitle = '📦 Food picked up!';
      donorMsg = `Your donation of ${transaction.donation?.foodName} has been picked up and is on its way.`;
      donorNotifType = 'donation_picked_up';
      
      // Notify NGO (Receiver/Deliverer)
      receiverTitle = '🚚 Food is in transit!';
      receiverMsg = `An NGO has picked up the food (${transaction.donation?.foodName}) and is heading your way.`;
      receiverNotifType = 'donation_picked_up';
    } else if (status === 'delivered') {
      // Notify Donor
      donorTitle = '🎉 Food delivered successfully!';
      donorMsg = `Your donation of ${transaction.donation?.foodName} has been delivered to those in need. Thank you!`;
      donorNotifType = 'donation_delivered';
      
      // Notify NGO (Receiver)
      receiverTitle = '✅ Food received!';
      receiverMsg = `The donation of ${transaction.donation?.foodName} has been successfully delivered to your location.`;
      receiverNotifType = 'donation_delivered';
    }

    // Send notifications
    const statusNotifs = [];
    if (donorTitle) {
      statusNotifs.push({
        recipient: transaction.donor,
        sender: req.user._id,
        type: donorNotifType,
        title: donorTitle,
        message: donorMsg,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id,
        images: transaction.deliveryImages || []
      });
    }
    if (receiverTitle && transaction.receiver) {
      statusNotifs.push({
        recipient: transaction.receiver,
        sender: req.user._id,
        type: receiverNotifType,
        title: receiverTitle,
        message: receiverMsg,
        relatedDonation: transaction.donation?._id,
        relatedTransaction: transaction._id
      });
    }

    if (statusNotifs.length > 0) {
      await Notification.insertMany(statusNotifs);
    }

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

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
