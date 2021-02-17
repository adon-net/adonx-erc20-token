const duration = require('../utils/duration.Helper');
const time = require('../utils/time.Helper')


const AdonxToken = artifacts.require("./AdonxToken.sol");
const AdonxTokenSale = artifacts.require("./AdonxTokenSale.sol");

module.exports = async function (deployer, network, accounts) {

  const rate = 5000;
  const ethWallet = '0xA4603750b8cE88906709EF1a1d963340D31F7cC3';
  const openingTime = Math.floor(Date.now() / 1000) + duration.minutes(5);
  const closingTime = openingTime + duration.weeks(6);  
  const unlockTime  = closingTime + duration.weeks(4);  

  console.log('Opening Time  # ' + time.toDateTime(openingTime));
  console.log('Closing Time  # ' + time.toDateTime(closingTime));
  console.log('Unlock  Time  # ' + time.toDateTime(unlockTime));

  const token = await AdonxToken.deployed();

  await deployer.deploy(
    AdonxTokenSale,
    rate,
    ethWallet,
    token.address,
    openingTime,
    closingTime,
    unlockTime
  );

  const tokenSale = await AdonxTokenSale.deployed();
  // await tokenSale.pause();

  return true;
};
