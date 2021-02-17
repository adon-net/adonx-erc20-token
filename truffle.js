require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config()

module.exports = {

  networks: {
    ganache: {
      protocol: 'http',
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      type: "quorum"
    },
    development: {
      protocol: 'http',
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
    },

    mainnet: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 1,
      gasPrice: 10e9,
      skipDryRun: true
    },
    ropsten: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 3,
      gasPrice: 10e9,
      skipDryRun: true
    },
    goerli: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://goerli.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 5,
      gasPrice: 10e9,
      skipDryRun: true
    },
    rinkeby: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 4,
      gasPrice: 10e9,
      skipDryRun: true
    },
    kovan: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 42,
      gasPrice: 10e9,
      skipDryRun: true
    }
  },

  mocha: {
    useColors: true
  },

  compilers: {
    solc: {
      version: "^0.5.5",
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },

  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: process.env.ETHSCAN_API_KEY,
  }
};
