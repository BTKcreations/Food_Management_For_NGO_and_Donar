const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const admin = require('../config/firebaseAdmin');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, organization, address, city, state, pincode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'donor',
      organization,
      address,
      city,
      state,
      pincode
    });

    // Create welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'welcome',
      title: 'Welcome to FoodBridge! 🎉',
      message: `Hello ${user.name}! Welcome to FoodBridge. Together, we can reduce food waste and fight hunger.`
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Contact admin.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        isVerified: user.isVerified,
        totalDonations: user.totalDonations,
        totalReceived: user.totalReceived,
        totalDeliveries: user.totalDeliveries
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Login/Register with Firebase
// @route   POST /api/auth/firebase
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'No ID Token provided'
      });
    }

    // 1. Verify the ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase token'
      });
    }

    const { uid, email, name, picture, phone_number } = decodedToken;

    // 2. Find or create user in MongoDB
    // Try to find by firebaseUid or email
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email }] 
    });

    if (!user) {
      // Create new user if not found
      user = await User.create({
        name: name || (email ? email.split('@')[0] : 'User'),
        email: email || `${uid}@foodbridge.com`, // Fallback for phone-only auth
        password: Math.random().toString(36).slice(-16), // Dummy password
        phone: phone_number || '',
        firebaseUid: uid,
        role: role || 'donor', // Use provided role or default to donor
        isVerified: true // Firebase users are pre-verified
      });

      // Create welcome notification
      await Notification.create({
        recipient: user._id,
        type: 'welcome',
        title: 'Welcome to FoodBridge! 🎉',
        message: `Hello ${user.name}! You have successfully joined via Firebase.`
      });
    } else if (!user.firebaseUid) {
      // Link firebaseUid to existing user if not already linked
      user.firebaseUid = uid;
      if (picture && !user.avatar) user.avatar = picture;
      // If role was explicitly provided during a login of an unlinked account, we could update it, 
      // but usually we keep the existing role.
      await user.save();
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // 3. Generate our own local JWT for the session
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Firebase Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Firebase login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      organization: req.body.organization,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Update location if coordinates provided
    if (req.body.latitude && req.body.longitude) {
      fieldsToUpdate.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};
