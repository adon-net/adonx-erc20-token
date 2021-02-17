const utils = require('web3-utils');

const toWei = (eth) => {
  return web3.utils.toBN(web3.utils.toWei(eth.toString(), 'ether'));
};

const fromWei = (wei) => {
  return web3.utils.toBN(web3.utils.fromWei(wei.toString(), 'ether'));
}

module.exports = { toWei , fromWei }