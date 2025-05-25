// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract VolumeOracle{
    struct VolumeData{
        uint256 volume24HrInUSD;
        uint256 volume24HrInBaseToken;
        uint256 volume24HrInQuoteToken;
        uint256 lastUpdatedAt; // timestamp of the last update
        uint256 expiresAt;
    }

    VolumeData public volumeData;
    mapping(address => VolumeData) public volumeDataByV3Pool;
    address public owner;
    constructor() {
        owner = msg.sender; // Set the contract deployer as the owner
    }
    modifier onlyOwner() {
        // Placeholder for owner check logic
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function setVolumeData(
        uint256 _volume24HrInUSD,
        uint256 _volume24HrInBaseToken,
        uint256 _volume24HrInQuoteToken,
        address _v3PoolAddress
    
    ) public {
    

        volumeDataByV3Pool[_v3PoolAddress] =  VolumeData(
            _volume24HrInUSD,
            _volume24HrInBaseToken,
            _volume24HrInQuoteToken,
            block.timestamp,
            block.timestamp + 1 days // Set expiration to 24 hours from now
        );
    }

    function getVolumeData(address _v3PoolAddress) public view returns (VolumeData memory) {
        return volumeDataByV3Pool[_v3PoolAddress];
    }

}