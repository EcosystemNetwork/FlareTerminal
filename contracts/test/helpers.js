const { ethers } = require("hardhat");

const NZDOLLAR_INITIAL_SUPPLY = ethers.utils.parseEther("1000000");

/** Deploys NZDollar with the standard test supply. */
async function deployNZDollar(initialSupply = NZDOLLAR_INITIAL_SUPPLY) {
  const NZDollar = await ethers.getContractFactory("NZDollar");
  const nzDollar = await NZDollar.deploy(initialSupply);
  await nzDollar.deployed();
  return nzDollar;
}

/** Deploys the vault owned by `owner`. */
async function deployVault(owner) {
  const BanknoteCollateralVault = await ethers.getContractFactory(
    "BanknoteCollateralVault"
  );
  const vault = await BanknoteCollateralVault.deploy(owner.address);
  await vault.deployed();
  return vault;
}

module.exports = { NZDOLLAR_INITIAL_SUPPLY, deployNZDollar, deployVault };
