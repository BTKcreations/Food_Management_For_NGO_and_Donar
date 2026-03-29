const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new donation
// @route   POST /api/donations
exports.createDonation = async (req, res) => {
  try {
    const {
      foodType, foodName, description, quantity, servings,
      preparedAt, expiresAt, address, contactPhone,
      latitude, longitude, isVegetarian, allergens, specialInstructions,
      safetyCertified, urgency, itemNames, itemPreparedDates, itemExpiresDates
    } = req.body;

    // Handle items (name + image + dates mapping)
    const items = [];
    if (itemNames && req.files) {
      const names = Array.isArray(itemNames) ? itemNames : [itemNames];
      const prepDates = Array.isArray(itemPreparedDates) ? itemPreparedDates : [itemPreparedDates];
      const expiryDates = Array.isArray(itemExpiresDates) ? itemExpiresDates : [itemExpiresDates];
      
      names.forEach((name, index) => {
        if (req.files[index]) {
          items.push({
            name,
            image: req.files[index].path,
            preparedAt: prepDates[index] || null,
            expiresAt: expiryDates[index] || null
          });
        }
      });
    }

    const donation = await Donation.create({
      donor: req.user._id,
      foodType,
      foodName,
      description,
      quantity,
      servings,
      preparedAt,
      expiresAt,
      address,
      contactPhone: contactPhone || req.user.phone,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0]
      },
      isVegetarian,
      allergens,
      specialInstructions,
      safetyCertified,
      urgency: urgency || 'medium',
      images: req.files ? req.files.map(f => f.path) : [],
      items: items
    });

    // Increment donor's total donations
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalDonations: 1 } });

    // Notify nearby NGOs about new donation
    const nearbyNGOs = await User.find({
      role: { $in: ['ngo', 'volunteer'] },
      _id: { $ne: req.user._id },
      isActive: true
    }).limit(50);

    const notifications = nearbyNGOs.map(ngo => ({
      recipient: ngo._id,
      sender: req.user._id,
      type: 'new_donation',
      title: '🍽️ New Food Donation Available!',
      message: `${req.user.name} has donated ${servings} servings of ${foodName}. Claim it before it expires!`,
      relatedDonation: donation._id
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating donation',
      error: error.message
    });
  }
};

// @desc    Get all available donations
// @route   GET /api/donations
exports.getDonations = async (req, res) => {
  try {
    const { status, foodType, page = 1, limit = 20, latitude, longitude, radius } = req.query;
    
    let filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'available';
    }

    if (foodType) {
      filter.foodType = foodType;
    }

    // Filter expired donations
    filter.expiresAt = { $gt: new Date() };

    // Geospatial query if coordinates provided
    if (latitude && longitude) {
      const maxDistance = (parseInt(radius) || 10) * 1000; // Convert km to meters
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      };
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'name email phone organization profileImage')
      .populate('claimedBy', 'name email phone organization')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: donations.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      donations
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message
    });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone organization profileImage address')
      .populate('claimedBy', 'name email phone organization')
      .populate('assignedVolunteer', 'name email phone');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching donation',
      error: error.message
    });
  }
};

// @desc    Get donations by current user (donor)
// @route   GET /api/donations/my
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('claimedBy', 'name email phone organization')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your donations',
      error: error.message
    });
  }
};

// @desc    Claim a donation (NGO/volunteer)
// @route   PUT /api/donations/:id/claim
exports.claimDonation = async (req, res) => {
  try {
    const { claimQuantity, destinationType, receiverId, notes } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (!['available', 'partially_claimed'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: `Donation is ${donation.status}` });
    }

    const amountToClaim = parseInt(claimQuantity) || donation.remainingServings;

    if (amountToClaim > donation.remainingServings) {
      return res.status(400).json({ success: false, message: `Only ${donation.remainingServings} servings left` });
    }

    // Determine destination
    let finalReceiverId = req.user._id; // Default is NGO itself
    if (destinationType === 'receiver' && receiverId) {
      finalReceiverId = receiverId;
    }

    // Update donation quantity
    donation.remainingServings -= amountToClaim;
    donation.status = donation.remainingServings <= 0 ? 'fully_claimed' : 'partially_claimed';
    donation.claimedBy = req.user._id;
    donation.claimedAt = new Date();
    await donation.save();

    // Notify donor
    await Notification.create({
      recipient: donation.donor,
      sender: req.user._id,
      type: 'donation_claimed',
      title: '✅ Your donation is being redistributed!',
      message: `${req.user.name} has claimed ${amountToClaim} servings of ${donation.foodName} for ${destinationType === 'warehouse' ? 'their warehouse' : 'a recipient'}.`,
      relatedDonation: donation._id
    });

    // Create Transaction
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

    const transaction = await Transaction.create({
      donation: donation._id,
      donor: donation.donor,
      receiver: finalReceiverId,
      destinationType: destinationType || 'receiver',
      allocatedServings: amountToClaim,
      status: 'accepted',
      pickupLocation: donation.location,
      notes: notes || `Redistribution of ${amountToClaim} servings`,
      pickupCode,
      deliveryCode
    });

    res.status(200).json({
      success: true,
      message: `${amountToClaim} servings claimed successfully`,
      donation,
      transaction
    });
  } catch (error) {
    console.error('Claim donation error:', error);
    res.status(500).json({ success: false, message: 'Error claiming donation', error: error.message });
  }
};

// @desc    Update donation status
// @route   PUT /api/donations/:id/status
exports.updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check authorization
    const isOwner = donation.donor.toString() === req.user._id.toString();
    const isClaimer = donation.claimedBy && donation.claimedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isClaimer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donation'
      });
    }

    const validTransitions = {
      'available': ['claimed', 'cancelled', 'expired'],
      'claimed': ['picked_up', 'available', 'cancelled'],
      'picked_up': ['delivered', 'cancelled'],
      'delivered': [],
      'expired': [],
      'cancelled': ['available']
    };

    if (!validTransitions[donation.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${donation.status}' to '${status}'`
      });
    }

    donation.status = status;
    
    if (status === 'available') {
      donation.claimedBy = null;
      donation.claimedAt = null;
      donation.assignedVolunteer = null;
    }
    
    await donation.save();

    // UPDATE LINKED TRANSACTION STATUS
    const statusMapping = {
      'picked_up': 'in_transit',
      'delivered': 'completed',
      'cancelled': 'cancelled',
      'available': 'cancelled'
    };

    if (statusMapping[status]) {
      const updateData = { status: statusMapping[status] };
      if (status === 'picked_up') updateData.pickupTime = new Date();
      if (status === 'delivered') updateData.deliveryTime = new Date();

      console.log(`Updating transaction for donation ${donation._id} to status ${updateData.status}`);
      const updatedTrans = await Transaction.findOneAndUpdate(
        { donation: donation._id, status: { $ne: 'completed' } },
        updateData,
        { sort: { createdAt: -1 }, new: true }
      );
      console.log('Updated transaction result:', updatedTrans ? updatedTrans._id : 'No active transaction found');
    }


    // Create appropriate notification
    let notifyUserId = null;
    let notifTitle = '';
    let notifMessage = '';
    let notifType = 'system_alert';

    if (status === 'picked_up') {
      notifyUserId = donation.donor;
      notifTitle = '📦 Food picked up!';
      notifMessage = `Your donation of ${donation.foodName} has been picked up and is on its way.`;
      notifType = 'donation_picked_up';
    } else if (status === 'delivered') {
      notifyUserId = donation.donor;
      notifTitle = '🎉 Food delivered successfully!';
      notifMessage = `Your donation of ${donation.foodName} has been delivered to those in need. Thank you!`;
      notifType = 'donation_delivered';
    }

    if (notifyUserId) {
      await Notification.create({
        recipient: notifyUserId,
        sender: req.user._id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        relatedDonation: donation._id
      });
    }

    res.status(200).json({
      success: true,
      message: `Donation status updated to '${status}'`,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating donation status',
      error: error.message
    });
  }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    const isOwner = donation.donor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this donation'
      });
    }

    if (donation.status === 'claimed' || donation.status === 'picked_up') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a donation that is currently claimed or in transit'
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting donation',
      error: error.message
    });
  }
};
