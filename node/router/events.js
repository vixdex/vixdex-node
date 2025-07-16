const express = require('express');
const router = express.Router();
const PairInitiatedEvent = require('../models/PairInitiatedEvent');

// Get all events with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      PairInitiatedEvent.find()
        .sort({ blockNumber: -1, transactionIndex: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PairInitiatedEvent.countDocuments(),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
    });
  }
});

// Get events by token address
router.get('/token/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { deriveToken: tokenAddress.toLowerCase() },
        { vixHighToken: tokenAddress.toLowerCase() },
        { vixLowToken: tokenAddress.toLowerCase() },
      ],
    };

    const [events, total] = await Promise.all([
      PairInitiatedEvent.find(query)
        .sort({ blockNumber: -1, transactionIndex: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PairInitiatedEvent.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events by token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events by token',
    });
  }
});

// Get event by transaction hash
router.get('/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const event = await PairInitiatedEvent.findOne({
      transactionHash: txHash.toLowerCase(),
    }).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event by tx hash:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
    });
  }
});

// Get latest events
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const events = await PairInitiatedEvent.find()
      .sort({ blockNumber: -1, transactionIndex: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching latest events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest events',
    });
  }
});

// Add this new route before module.exports
router.get('/debug/console', async (req, res) => {
  try {
    console.log('📋 Fetching all events for console output...');

    const events = await PairInitiatedEvent.find()
      .sort({ blockNumber: -1, transactionIndex: -1 })
      .limit(10) // Show only last 10 events in console
      .lean();

    console.log('\n=== PAIR INITIATED EVENTS ===');
    console.log(`Found ${events.length} events:\n`);

    events.forEach((event, index) => {
      console.log(`🔹 Event #${index + 1}:`);
      console.log(`   TX Hash: ${event.transactionHash}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   Derive Token: ${event.deriveToken}`);
      console.log(`   VIX High Token: ${event.vixHighToken}`);
      console.log(`   VIX Low Token: ${event.vixLowToken}`);
      console.log(`   Initiated IV: ${event.initiatedIV}`);
      console.log(
        `   Timestamp: ${new Date(event.initiatedTime).toISOString()}`
      );
      console.log('----------------------------------');
    });

    res.json({
      success: true,
      message: `Logged ${events.length} events to console`,
      count: events.length,
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug endpoint failed',
    });
  }
});

// Debug endpoint to check database status
router.get('/debug/db-status', async (req, res) => {
  try {
    const count = await PairInitiatedEvent.countDocuments();
    const sample = await PairInitiatedEvent.findOne().sort({ blockNumber: -1 });

    res.json({
      success: true,
      dbStatus: 'connected',
      totalEvents: count,
      latestEvent: sample,
    });
  } catch (error) {
    console.error('Database check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database check failed',
      details: error.message,
    });
  }
});

module.exports = router;
