require('dotenv').config()

const duration = require('../utils/duration.Helper');
const time = require('../utils/time.Helper')

const AdonxToken = artifacts.require("./AdonxToken.sol");
const AdonxTokenSale = artifacts.require("./AdonxTokenSale.sol");

module.exports = async function (deployer, network, accounts) {

  const rate = 5000;
  const ethWallet = process.env.ETH_WALLET_ADDR;

   const openingTime = Math.floor(new Date(Date.UTC(2021, 1, 18, 12, 0, 0)).getTime() / 1000); //1613649600; // Math.floor(Date.now() / 1000) + duration.minutes(5);
  const closingTime = openingTime + duration.weeks(6);  

  console.log('Opening Time  # ' + time.toDateTime(openingTime));
  console.log('Closing Time  # ' + time.toDateTime(closingTime));

  const token = await AdonxToken.deployed();

  await deployer.deploy(
    AdonxTokenSale,
    rate,
    ethWallet,
    token.address,
    openingTime,
    closingTime
  );

  const tokenSale = await AdonxTokenSale.deployed();  
  
  return true;
};
