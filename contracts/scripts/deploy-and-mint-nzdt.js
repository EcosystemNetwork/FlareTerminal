const { ethers } = require("hardhat");
const {
  runScript,
  getDeployer,
  deployContract,
  logBalance,
} = require("./helpers");

async function main() {
  await getDeployer();

  const initialSupply = ethers.utils.parseEther("1000000"); // 1 million NZDT
  const nzDollar = await deployContract("NZDollar", [initialSupply]);

  // Mint 10,000 NZDT to the specified address
  const mintAmount = ethers.utils.parseEther("10000");
  const mintTo = "0xE6d6F4a7857f0C9ED735397e9bbA36f093752872";

  console.log(`Minting ${ethers.utils.formatEther(mintAmount)} NZDT to ${mintTo}`);

  const mintTx = await nzDollar.transfer(mintTo, mintAmount);
  await mintTx.wait();

  console.log("Minting completed");

  await logBalance(nzDollar, mintTo, "NZDT");

  console.log("NZDollar contract address:", nzDollar.address);
}

runScript(main);
