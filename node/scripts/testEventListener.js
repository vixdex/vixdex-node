const eventListener = require('../services/eventListener');

async function test() {
  console.log('Testing Event Listener...');

  try {
    // Initialize the event listener
    await eventListener.initialize();
    console.log('Event listener initialized successfully');

    // Start listening for events
    await eventListener.start();
    console.log('Event listener started successfully');

    // Keep the process running
    setInterval(() => {
      console.log('Event listener is running...');
    }, 60000); // Log every minute to show it's still running
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
test().catch(console.error);

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down test...');
  eventListener.stop();
  process.exit(0);
});
