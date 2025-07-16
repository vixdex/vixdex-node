var express = require('express');
var {ethers} = require("ethers")
var router = express.Router();
var oracleAbi = require('../oracleABI.json');


router.post("/uniswapV3/pool/oracle", async (req, res) => {
    const { poolAddress, chain } = req.body;
    let provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    let wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    let signer = wallet.connect(provider);
    let abi = oracleAbi.abi;
    let oracleContract = new ethers.Contract(process.env.ORACLE_CONTRACT,abi,signer);
  
    const geckoTerminalURL = `${process.env.GEKO_TERMINAL_URL}networks/${chain}/pools/${poolAddress}?include=dex&include_volume_breakdown=true`;
    
    if (!poolAddress || !chain) {
        return res.status(400).send({
            message: "poolAddress and chain are required",
        });
    }
    let isThere = await oracleContract.getVolumeData(poolAddress);
    let expireTime = isThere[4].toString();
    let expireTimeNum = parseInt(expireTime);
    let currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    let isExpired = expireTimeNum < currentTime;
    console.log("Expire Time:", expireTimeNum);
    if(!isThere || isExpired){
    console.log("working..")
         try{
        const response = await fetch(geckoTerminalURL);

        if (!response.ok) {
            return res.status(response.status).send({
                message: "Failed to fetch from GeckoTerminal",
                error: response.statusText,
            });
        }
        
        console.log(response);
        const data = await response.json();
        let volumeInUSD =data.data.attributes.volume_usd.h24;
        let volumeInBaseToken = volumeInUSD/(data.data.attributes.base_token_price_usd);
        let volumeInQuoteToken = volumeInUSD/(data.data.attributes.quote_token_price_usd);
        let tx = await oracleContract.setVolumeData(
            Math.floor(volumeInUSD),
            Math.floor(volumeInBaseToken), 
            Math.floor(volumeInQuoteToken), 
            poolAddress
        );
        let receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);
        let volumeData = await oracleContract.getVolumeData(poolAddress);
        console.log("Volume Data:", volumeData);
        return res.status(200).send({
            name:data.data.attributes.name,
            fee:data.data.attributes.pool_fee_percentage,
            message: "Data fetched successfully",
            data: volumeData.map((item) => {
              return item.toString();
            }),
            
        });
     
    }catch(error){
        console.error("Error:", error);
        return res.status(500).send({
            message: "Something went wrong",
            error: error.message,
        });
    }
    }else{
        console.log("Data already exists in the oracle contract");
        return res.status(200).send({
            message: "Data already exists",
            data: isThere.map((item) => {
              return item.toString();
            }),
        });
    }

 


})


router.post("/uniswapV3/pool/oracle/mock", async (req, res) => {
    const { poolAddress, chain, realAddress } = req.body;
    let provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    let wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    let signer = wallet.connect(provider);
    let abi = oracleAbi.abi;
    let oracleContract = new ethers.Contract(process.env.ORACLE_CONTRACT,abi,signer);
  
    const geckoTerminalURL = `${process.env.GEKO_TERMINAL_URL}networks/${chain}/pools/${realAddress}?include=dex&include_volume_breakdown=true`;
    
    if (!poolAddress || !chain) {
        return res.status(400).send({
            message: "poolAddress and chain are required",
        });
    }
    let isThere = await oracleContract.getVolumeData(poolAddress);
    let expireTime = isThere[4].toString();
    let expireTimeNum = parseInt(expireTime);
    let currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    let isExpired = expireTimeNum < currentTime;
    console.log("Expire Time:", expireTimeNum);
    if(!isThere || isExpired){
    console.log("working..")
         try{
        const response = await fetch(geckoTerminalURL);

        if (!response.ok) {
            return res.status(response.status).send({
                message: "Failed to fetch from GeckoTerminal",
                error: response.statusText,
            });
        }
        
        console.log(response);
        const data = await response.json();
        let volumeInUSD =data.data.attributes.volume_usd.h24;
        let volumeInBaseToken = volumeInUSD/(data.data.attributes.base_token_price_usd);
        let volumeInQuoteToken = volumeInUSD/(data.data.attributes.quote_token_price_usd);
        let tx = await oracleContract.setVolumeData(
            Math.floor(volumeInUSD),
            Math.floor(volumeInBaseToken), 
            Math.floor(volumeInQuoteToken), 
            poolAddress
        );
        let receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);
        let volumeData = await oracleContract.getVolumeData(poolAddress);
        console.log("Volume Data:", volumeData);
        return res.status(200).send({
            name:data.data.attributes.name,
            fee:data.data.attributes.pool_fee_percentage,
            message: "Data fetched successfully",
            data: volumeData.map((item) => {
              return item.toString();
            }),
            
        });
     
    }catch(error){
        console.error("Error:", error);
        return res.status(500).send({
            message: "Something went wrong",
            error: error.message,
        });
    }
    }else{
        console.log("Data already exists in the oracle contract");
        return res.status(200).send({
            message: "Data already exists",
            data: isThere.map((item) => {
              return item.toString();
            }),
        });
    }

 


})

module.exports = router;
