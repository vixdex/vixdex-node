
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000
    },
    
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          process.env.SEPOLIA_RPC_URL
        ),
      network_id: 11155111, // Sepolia chain ID
      gas: 2500000,
      gasPrice: 10000000000, // 10 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }

  },
  compilers: {
    solc: {
      version: "0.8.13", // Specify the Solidity version
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
};
