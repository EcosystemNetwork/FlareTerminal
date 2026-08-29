const { ethers } = require("hardhat");
const {
  runScript,
  getDeployer,
  deployContract,
  logBalance,
} = require("./helpers");

const MOCK_TOKENS = [
  { contract: "MockUSDC", symbol: "USDC" },
  { contract: "MockEURC", symbol: "EURC" },
];

const MOCK_TOKEN_DECIMALS = 6;

async function main() {
  await getDeployer();

  const mintTo = "0xE6d6F4a7857f0C9ED735397e9bbA36f093752872";
  const mintAmount = ethers.utils.parseUnits("100000", MOCK_TOKEN_DECIMALS);

  for (const { contract, symbol } of MOCK_TOKENS) {
    const token = await deployContract(contract);

    console.log(`Minting 100,000 ${symbol} to ${mintTo}`);
    await token.mint(mintTo, mintAmount);

    await logBalance(token, mintTo, symbol, MOCK_TOKEN_DECIMALS);
    console.log(`${contract} contract address:`, token.address);
  }
}

runScript(main);
