// Simple test script to verify the event listener is working
const { start } = require('./services/eventListener');

console.log('🚀 Starting event listener test...');

start().then(() => {
  console.log('✅ Event listener started successfully');
}).catch(error => {
  console.error('❌ Failed to start event listener:', error);
  process.exit(1);
});
