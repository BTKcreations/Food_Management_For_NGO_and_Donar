const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Request = require('../models/Request');

// @desc    Get platform analytics/statistics
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    // Overall stats
    const totalDonations = await Donation.countDocuments();
    const activeDonations = await Donation.countDocuments({ status: 'available' });
    const completedDonations = await Donation.countDocuments({ status: 'delivered' });
    const totalServingsDelivered = await Donation.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$servings' } } }
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalDonors = await User.countDocuments({ role: 'donor', isActive: true });
    const totalNGOs = await User.countDocuments({ role: 'ngo', isActive: true });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer', isActive: true });

    const totalTransactions = await Transaction.countDocuments();
    const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });

    const openRequests = await Request.countDocuments({ status: 'open' });
    const fulfilledRequests = await Request.countDocuments({ status: 'fulfilled' });

    // Donations by food type
    const donationsByType = await Donation.aggregate([
      { $group: { _id: '$foodType', count: { $sum: 1 }, totalServings: { $sum: '$servings' } } },
      { $sort: { count: -1 } }
    ]);

    // Donations over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const donationsOverTime = await Donation.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          servings: { $sum: '$servings' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top donors
    const topDonors = await User.find({ role: 'donor', totalDonations: { $gt: 0 } })
      .select('name organization totalDonations')
      .sort({ totalDonations: -1 })
      .limit(10);

    // Top volunteers
    const topVolunteers = await User.find({ role: 'volunteer', totalDeliveries: { $gt: 0 } })
      .select('name totalDeliveries')
      .sort({ totalDeliveries: -1 })
      .limit(10);

    // Status distribution
    const statusDistribution = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalDonations,
          activeDonations,
          completedDonations,
          totalServingsDelivered: totalServingsDelivered[0]?.total || 0,
          totalUsers,
          totalDonors,
          totalNGOs,
          totalVolunteers,
          totalTransactions,
          completedTransactions,
          pendingTransactions,
          openRequests,
          fulfilledRequests,
          successRate: totalDonations > 0 
            ? ((completedDonations / totalDonations) * 100).toFixed(1) 
            : 0
        },
        donationsByType,
        donationsOverTime,
        topDonors,
        topVolunteers,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analytics',
      error: error.message
    });
  }
};

// @desc    Get user-specific analytics
// @route   GET /api/analytics/me
exports.getMyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let analytics = {};

    if (role === 'donor') {
      const myDonations = await Donation.countDocuments({ donor: userId });
      const deliveredDonations = await Donation.countDocuments({ donor: userId, status: 'delivered' });
      const totalServings = await Donation.aggregate([
        { $match: { donor: userId, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$servings' } } }
      ]);

      const recentDonations = await Donation.find({ donor: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('foodName status servings createdAt');

      analytics = {
        myDonations,
        deliveredDonations,
        totalServingsProvided: totalServings[0]?.total || 0,
        recentDonations,
        impactScore: deliveredDonations * 10
      };
    } else if (role === 'ngo') {
      const claimedDonations = await Donation.countDocuments({ claimedBy: userId });
      const myRequests = await Request.countDocuments({ requester: userId });
      const fulfilledRequests = await Request.countDocuments({ requester: userId, status: 'fulfilled' });

      analytics = {
        claimedDonations,
        myRequests,
        fulfilledRequests,
        totalReceived: req.user.totalReceived
      };
    } else if (role === 'volunteer') {
      const myDeliveries = await Transaction.countDocuments({ volunteer: userId });
      const completedDeliveries = await Transaction.countDocuments({ volunteer: userId, status: 'completed' });

      analytics = {
        myDeliveries,
        completedDeliveries,
        totalDeliveries: req.user.totalDeliveries
      };
    }

    res.status(200).json({
      success: true,
      role,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating personal analytics',
      error: error.message
    });
  }
};
