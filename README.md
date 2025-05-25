# Vixdex

VixDex - Decentralized Volatility Trading Protocol

## About this Project
VixDex is a decentralized volatility trading protocol. It is a Uniswap V4 hook that introduces a custom pricing model for trading directly on volatility on-chain. VixDex allows traders to take positions on whether an asset’s volatility will increase or decrease, similar to VIX options trading but in a fully decentralized and automated manner.

## About this repo

This repository contains a Node.js script that fetches 24-hour trading volume data from a crypto API (Gecko Terminal)&  pushes it on-chain to a smart contract acting as an Oracle

# Features

1) Fetches real-time 24h volume data at fixed intervals (e.g., every hour)

2) Sends data to an Ethereum-compatible smart contract

# Tech Stack

1) Node.js for the off-chain Oracle fetcher

2) Ethers.js for blockchain interaction

3) Solidity for the Oracle contract & truffle framework