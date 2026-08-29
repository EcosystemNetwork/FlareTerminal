const fs = require('fs');
const { runScript, getDeployer, deployContract } = require('./helpers');

async function main() {
  const deployer = await getDeployer();

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const vault = await deployContract("BanknoteCollateralVault", [
    deployer.address,
  ]);

  const addresses = {
    vault: vault.address,
    usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    eurc: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    nzdt: "0xaB0e2aEF0d236E0754E79eD34380a0Ec9700fE02"
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Contract addresses saved to deployed-addresses.json");
}

runScript(main);
