const { ethers } = require('ethers');
const connectDB = require('../lib/db');
const PairInitiatedEvent = require('../models/PairInitiatedEvent');
require('dotenv').config();

// Minimal ABI with only the event needed
const ABI = [
  'event PairInitiated(address indexed _deriveToken, address indexed _vixHighToken, address indexed _vixLowToken, uint256 _initiatedTime, uint256 initiatedIV)',
];

class EventListener {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await connectDB();

      // Initialize provider and contract
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        ABI,
        this.provider
      );

      console.log('✅ Event listener initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing event listener:', error);
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('ℹ️ Event listener is already running');
      return;
    }

    try {
      if (!this.contract) {
        await this.initialize();
      }

      console.log('🔄 Starting event listener...');
      this.isRunning = true;

      // 1. First, fetch and store all past events
      await this.fetchPastEvents();

      // 2. Then start listening for new blocks
      this.provider.on('block', this.handleNewBlock.bind(this));

      console.log('✅ Event listener started successfully');
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async fetchPastEvents() {
    try {
      console.log('🔍 Fetching past events...');

      // Get the current block number
      const currentBlock = await this.provider.getBlockNumber();

      // Start from the specific block number you provided (8633326)
      const START_BLOCK = 8633326;
      const chunkSize = 2000; // Process in chunks of 2,000 blocks

      console.log(`ℹ️ Starting from block: ${START_BLOCK}`);
      console.log(`ℹ️ Current block: ${currentBlock}`);

      const fromBlock = Math.max(START_BLOCK, 0);

      console.log(
        `📊 Fetching events from block ${fromBlock} to ${currentBlock} in chunks of ${chunkSize} blocks`
      );

      // Process in chunks to avoid timeout/rate limiting
      for (
        let startBlock = fromBlock;
        startBlock <= currentBlock;
        startBlock += chunkSize
      ) {
        const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);

        try {
          console.log(
            `⏳ Fetching events for blocks ${startBlock} to ${endBlock}...`
          );

          // Query events for this chunk
          const events = await this.contract.queryFilter(
            this.contract.filters.PairInitiated(),
            startBlock,
            endBlock
          );

          console.log(
            `✅ Found ${events.length} events in blocks ${startBlock}-${endBlock}`
          );

          // Process events in parallel with limited concurrency
          const BATCH_SIZE = 10;
          for (let i = 0; i < events.length; i += BATCH_SIZE) {
            const batch = events.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map((event) => this.processEvent(event)));
          }
        } catch (chunkError) {
          console.error(
            `⚠️ Error processing blocks ${startBlock}-${endBlock}:`,
            chunkError.message
          );
          // Continue with next chunk even if one fails
          continue;
        }
      }

      console.log('✅ Successfully processed all past events');
    } catch (error) {
      console.error('❌ Error in fetchPastEvents:', error);
      throw error;
    }
  }

  stop() {
    if (this.provider) {
      try {
        this.provider.removeAllListeners();
        console.log('🛑 Removed all event listeners');
      } catch (error) {
        console.error('❌ Error stopping provider:', error);
      }
    }
    this.isRunning = false;
    console.log('🛑 Event listener stopped');
  }

  async handleNewBlock(blockNumber) {
    try {
      // Get events from the latest block
      const events = await this.contract.queryFilter(
        this.contract.filters.PairInitiated(),
        blockNumber,
        blockNumber
      );

      if (events.length > 0) {
        console.log(
          `📝 Found ${events.length} new PairInitiated event(s) in block ${blockNumber}`
        );
        for (const event of events) {
          await this.processEvent(event);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber}:`, error);
    }
  }

  async processEvent(event) {
    try {
      const eventData = {
        deriveToken: event.args._deriveToken,
        vixHighToken: event.args._vixHighToken,
        vixLowToken: event.args._vixLowToken,
        initiatedTime: new Date(Number(event.args._initiatedTime) * 1000),
        initiatedIV: Number(event.args.initiatedIV),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };

      // Save to database (upsert to prevent duplicates)
      await PairInitiatedEvent.findOneAndUpdate(
        { transactionHash: event.transactionHash },
        eventData,
        { upsert: true, new: true }
      );

      console.log(`💾 Saved event: ${event.transactionHash}`);
      return true;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - event already exists
        console.log(`ℹ️ Event already exists: ${event.transactionHash}`);
        return true;
      } else {
        console.error('❌ Error saving event:', error);
        return false;
      }
    }
  }

  async saveEvent(eventData) {
    try {
      const newEvent = new PairInitiatedEvent(eventData);
      await newEvent.save();
      console.log(`Event saved: ${eventData.transactionHash}`);
      return newEvent;
    } catch (error) {
      throw error;
    }
  }

  handleProviderError(error) {
    console.error('Provider error:', error);
    this.stop();
    // Attempt to reconnect after a delay
    setTimeout(() => this.start(), 5000);
  }
}

// ... (keep all existing code until the end of the file)

// Create and start the event listener
async function startEventListener() {
  try {
    const listener = new EventListener();
    await listener.initialize();
    await listener.start();
    return listener;
  } catch (error) {
    console.error('❌ Error starting event listener:', error);
    throw error;
  }
}

// Export the EventListener class and start function
module.exports = {
  EventListener,
  startEventListener,
};
