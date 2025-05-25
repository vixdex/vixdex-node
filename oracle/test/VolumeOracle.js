var oracleContract = artifacts.require("VolumeOracle");
contract("volume oracle", function (accounts) {
    
    it("set 24 hour volume", async function () {
        const contract = await oracleContract.deployed();
       let _volume24HrInUSD = 1000;
        let _volume24HrInBaseToken = 500;
        let _volume24HrInQuoteToken = 5;
        let _v3PoolAddress = "0xC4ce8E63921b8B6cBdB8fCB6Bd64cC701Fb926f2"
        await contract.setVolumeData(
            _volume24HrInUSD,
            _volume24HrInBaseToken,
            _volume24HrInQuoteToken,
            _v3PoolAddress
        );
        let volume = await contract.getVolumeData(_v3PoolAddress);
        console.log("Volume in USD: ", volume.volume24HrInUSD.toString());
        console.log("Volume in Base Token: ", volume.volume24HrInBaseToken.toString());
        console.log("Volume in Quote Token: ", volume.volume24HrInQuoteToken.toString());
        assert.equal(volume.volume24HrInUSD.toString(), _volume24HrInUSD.toString(), "Volume in USD does not match");
        
    })
})