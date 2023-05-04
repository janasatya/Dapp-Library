require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: process.env.Alchemy_Key,
      accounts: [process.env.Private_Key]
    }
    // localhost: {
    //   url: "http://127.0.0.1:7545"
    // }
  }
};
