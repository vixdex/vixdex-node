const { EventListener } = require('./services/eventListener');

async function main() {
  console.log('🚀 Starting event listener in development mode...');
  
  const listener = new EventListener();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down event listener...');
    await listener.stop();
    process.exit(0);
  });

  try {
    await listener.initialize();
    await listener.start();
    console.log('✅ Event listener is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('❌ Failed to start event listener:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
