const Request = require('../models/Request');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc    Create a food request
// @route   POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const {
      foodType, description, quantity, servingsNeeded,
      urgency, address, contactPhone, latitude, longitude,
      beneficiaryCount, needByTime
    } = req.body;

    const request = await Request.create({
      requester: req.user._id,
      foodType,
      description,
      quantity,
      servingsNeeded,
      urgency,
      address,
      contactPhone: contactPhone || req.user.phone,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0]
      },
      beneficiaryCount,
      needByTime
    });

    // Notify donors about new request
    const donors = await require('../models/User').find({
      role: 'donor',
      isActive: true
    }).limit(30);

    const notifications = donors.map(donor => ({
      recipient: donor._id,
      sender: req.user._id,
      type: 'new_request',
      title: `🆘 ${urgency === 'critical' ? 'URGENT' : 'New'} Food Request`,
      message: `${req.user.organization || req.user.name} needs ${servingsNeeded} servings of ${foodType === 'any' ? 'food' : foodType} food.`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

// @desc    Get all open requests
// @route   GET /api/requests
exports.getRequests = async (req, res) => {
  try {
    const { status = 'open', urgency, page = 1, limit = 20 } = req.query;
    
    let filter = { status };
    if (urgency) filter.urgency = urgency;

    const requests = await Request.find(filter)
      .populate('requester', 'name email phone organization')
      .populate('matchedDonation')
      .sort({ urgency: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// @desc    Get my requests
// @route   GET /api/requests/my
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('matchedDonation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your requests',
      error: error.message
    });
  }
};

// @desc    Match a request with a donation
// @route   PUT /api/requests/:id/match
exports.matchRequest = async (req, res) => {
  try {
    const { donationId } = req.body;
    
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    request.status = 'matched';
    request.matchedDonation = donationId;
    await request.save();

    // Notify requester
    await Notification.create({
      recipient: request.requester,
      type: 'request_matched',
      title: '🎯 Your request has been matched!',
      message: `A food donation has been matched to your request. ${donation.foodName} is on its way!`,
      relatedDonation: donation._id
    });

    res.status(200).json({
      success: true,
      message: 'Request matched with donation successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error matching request',
      error: error.message
    });
  }
};

// @desc    Cancel a request
// @route   PUT /api/requests/:id/cancel
exports.cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const isOwner = request.requester.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request cancelled',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling request',
      error: error.message
    });
  }
};
