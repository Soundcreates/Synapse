import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1️ Deploy SynTK (token)
  const SynTK = await ethers.getContractFactory("SynTK");
  const syntk = await SynTK.deploy(deployer.address);
  await syntk.waitForDeployment();
  const tokenAddress = await syntk.getAddress();
  const synData = {
    address: tokenAddress,
    abi: syntk.interface.formatJson(),
  };
  writeFileSync(
    "C:/Users/Shantanav Mukherjee/OneDrive/Desktop/backend or mern projects/Synapse/client3/contractData/SynTK.json",
    JSON.stringify(synData, null, 2)
  );
  console.log(" SynTK deployed at:", tokenAddress);

  // 2️ Deploy RoyaltyDistribution
  const RoyaltyDistribution = await ethers.getContractFactory(
    "RoyaltyDistribution"
  );
  const royalty = await RoyaltyDistribution.deploy(tokenAddress);
  await royalty.waitForDeployment();
  const royaltyAddress = await royalty.getAddress();
  const royaltyData = {
    address: tokenAddress,
    abi: royalty.interface.formatJson(),
  };
  writeFileSync(
    "C:/Users/Shantanav Mukherjee/OneDrive/Desktop/backend or mern projects/Synapse/client3/contractData/RoyaltyDistribution.json",
    JSON.stringify(royaltyData, null, 2)
  );
  console.log(" RoyaltyDistribution deployed at:", royaltyAddress);

  // 3️ Deploy DataRegistry
  const DataRegistry = await ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(royaltyAddress);
  await dataRegistry.waitForDeployment();
  const dataRegistryAddress = await dataRegistry.getAddress();
  const dataRegistryData = {
    address: tokenAddress,
    abi: dataRegistry.interface.formatJson(),
  };
  writeFileSync(
    "C:/Users/Shantanav Mukherjee/OneDrive/Desktop/backend or mern projects/Synapse/client3/contractData/DataRegistry.json",
    JSON.stringify(synData, null, 2)
  );
  console.log("DataRegistry deployed at:", dataRegistryAddress);

  // 4️ Link RoyaltyDistribution to DataRegistry
  const tx = await royalty.setDataRegistry(dataRegistryAddress);
  await tx.wait();
  console.log(" Linked DataRegistry in RoyaltyDistribution!");
}

main().catch((err) => {
  console.error(" Deployment failed:", err);
  process.exit(1);
});
