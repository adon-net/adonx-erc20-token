// Returns the time of the last mined block in seconds
const latestBlockTime = () => {
  return web3.eth.getBlock('latest').timestamp;
};

module.exports = { latestBlockTime }