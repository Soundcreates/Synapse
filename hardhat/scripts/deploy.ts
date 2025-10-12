import { ethers } from "hardhat";

async function main() {
  //grabbing the deployer
  const [deployer] = await ethers.getSigners();
  //printing deployer info
  console.log("Deployer object: ", deployer);
  console.log("Deploying with the acc: ", deployer.address);

  //deploying the SynTK (token) first
  const syntk = ethers.getContractFactory("SynTK");
  const SynTK = (await syntk).deploy(deployer.address); //passing down the initialowner as required in the contract
  (await SynTK).waitForDeployment();
  console.log("SynTK has been deployed at: ", (await SynTK).getAddress());
}

main().catch((err) => {
  process.exit(0);
});
