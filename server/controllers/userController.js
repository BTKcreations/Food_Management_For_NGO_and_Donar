const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    let filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Verify user (admin)
// @route   PUT /api/users/:id/verify
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been verified`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
};

// @desc    Toggle user active status (admin)
// @route   PUT /api/users/:id/toggle-active
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// @desc    Get available volunteers
// @route   GET /api/users/volunteers/available
exports.getAvailableVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({
      role: 'volunteer',
      isActive: true,
      isVerified: true
    }).select('name phone email location totalDeliveries');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching volunteers',
      error: error.message
    });
  }
};
