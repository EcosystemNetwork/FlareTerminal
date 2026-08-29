const { ethers } = require("hardhat");
const { runScript, getDeployer, deployContract } = require("./helpers");

async function main() {
  const deployer = await getDeployer();

  await deployContract("NZDollar", [ethers.utils.parseEther("1000000")]);
  await deployContract("BanknoteCollateralVault", [deployer.address]);
}

runScript(main);
