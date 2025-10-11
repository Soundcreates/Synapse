import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    "sepolia-testnet": {
      url: process.env.SEPOLIA_KEY,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
