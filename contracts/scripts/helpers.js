const { ethers } = require("hardhat");

/**
 * Runs a script entrypoint and exits with the conventional status codes.
 */
function runScript(main) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

/** Returns the first signer and logs the account used for deployments. */
async function getDeployer() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  return deployer;
}

/** Deploys a contract, waits for it to be mined and logs its address. */
async function deployContract(name, args = []) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  console.log(`${name} deployed to:`, contract.address);
  return contract;
}

/** Logs an ERC20 balance formatted with the given number of decimals. */
async function logBalance(token, account, symbol, decimals = 18) {
  const balance = await token.balanceOf(account);
  console.log(
    `Balance of ${account}: ${ethers.utils.formatUnits(
      balance,
      decimals
    )} ${symbol}`
  );
  return balance;
}

module.exports = { runScript, getDeployer, deployContract, logBalance };
