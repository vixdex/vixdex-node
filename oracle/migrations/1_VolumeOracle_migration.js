var contract = artifacts.require("VolumeOracle");
module.exports = function (deployer) {
    deployer.deploy(contract);
};