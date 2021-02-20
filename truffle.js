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
      gas: 3000000,        
      gasPrice: 200e9,
    },
    development: {
      protocol: 'http',
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 3000000,        
      gasPrice: 150e9,
    },
    mainnet: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 1,
      gas: 3000000,        
      gasPrice: 150e9,
      skipDryRun: true
    },
    ropsten: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 3,
      gas: 3000000,        
      gasPrice: 150e9,
      skipDryRun: true
    },
    goerli: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://goerli.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 5,
      gas: 3000000,        
      gasPrice: 150e9,
      skipDryRun: true
    },
    rinkeby: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 4,
      gas: 3000000,        
      gasPrice: 150e9,
      skipDryRun: true
    },
    kovan: {
      provider: new HDWalletProvider(`${process.env.MNEMONIC}`, `wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`),
      network_id: 42,
      gas: 3000000,        
      gasPrice: 150e9,
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
