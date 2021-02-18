require('dotenv').config()

const duration = require('../utils/duration.Helper');
const time = require('../utils/time.Helper')

const AdonxToken = artifacts.require("./AdonxToken.sol");
const AdonxTokenSale = artifacts.require("./AdonxTokenSale.sol");

const ether = require('../utils/ether.Helper');

module.exports = async function (deployer, network, accounts) {

  console.log('Admin wallet    # ' + accounts[0]);

  const rate = 5000;
  const ethWallet = process.env.ETH_WALLET_ADDR;

  const openingTime = Math.floor(new Date(Date.UTC(2021, 1, 18, 14, 0, 0)).getTime() / 1000); //1613649600; // Math.floor(Date.now() / 1000) + duration.minutes(5);
  const closingTime = openingTime + duration.weeks(6);

  console.log('Opening Time    # ' + time.toDateTime(openingTime));
  console.log('Closing Time    # ' + time.toDateTime(closingTime));

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
  console.log('Setting up Release Agent             .....');
  await token.setReleaseAgent(accounts[0]);
  console.log('Setting up Transfer Agent (Admin)    .....');
  await token.setTransferAgent(accounts[0], true);
  console.log('Setting up Transfer Agent (Contract) .....');
  await token.setTransferAgent(tokenSale.address, true);

  return true;
};
