require('dotenv').config()

const duration = require('../utils/duration.Helper');
const time = require('../utils/time.Helper')
const ether = require('../utils/ether.Helper');
var readline = require('readline');


const AdonxToken = artifacts.require("./AdonxToken.sol");
const AdonxTokenSale = artifacts.require("./AdonxTokenSale.sol");


module.exports = async function (deployer, network, accounts) {

  console.log('Admin wallet    # ' + accounts[0]);

  const rate = 5000;
  const ethWallet = process.env.ETH_WALLET_ADDR;

  const openingTime = process.env.OPENING_TIME;          //1613649600; // Math.floor(Date.now() / 1000) + duration.minutes(5);
  const closingTime = parseInt(openingTime) + duration.weeks(6);

  console.log('Opening Time    # ' + openingTime + '  #  ' + time.toDateTime(openingTime));
  console.log('Closing Time    # ' + closingTime + '  #  ' + time.toDateTime(closingTime));
  console.log('ETH Wallet      # ' + ethWallet);

  const token = await AdonxToken.deployed();

  console.log('Token Address   # ' + token.address);

  await deployer.deploy(
    AdonxTokenSale,
    rate,
    ethWallet,
    token.address,
    openingTime,
    closingTime
  );

  // const tokenSale = await AdonxTokenSale.deployed();
  
  // console.log('Setting up Release Agent             .....!');
  // await token.setReleaseAgent(accounts[0]);
  
  // console.log('Setting up Transfer Agent (Admin)    .....!');
  // await token.setTransferAgent(accounts[0], true);
  
  // console.log('Setting up Transfer Agent (Contract) .....!');
  // await token.setTransferAgent(tokenSale.address, true);

  // console.log('Funding Sale Contract                .....!');
  // await token.transfer(tokenSale.address, '550000000000000000000000', { from: accounts[0] });

  return true;
};
