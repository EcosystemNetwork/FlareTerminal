const { expect } = require("chai");
const { ethers } = require("hardhat");

const mocks = [
  { contract: "MockUSDC", name: "USD Coin", symbol: "USDC" },
  { contract: "MockEURC", name: "Euro Coin", symbol: "EURC" },
];

mocks.forEach(({ contract, name, symbol }) => {
  describe(contract, function () {
    let token;
    let owner;
    let other;

    const initialSupply = ethers.BigNumber.from(10).pow(6).mul(1000000);

    beforeEach(async function () {
      [owner, other] = await ethers.getSigners();
      const Token = await ethers.getContractFactory(contract);
      token = await Token.deploy();
      await token.deployed();
    });

    it("Should have the correct name and symbol", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should use six decimals", async function () {
      expect(await token.decimals()).to.equal(6);
    });

    it("Should mint the initial supply to the deployer", async function () {
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should make the deployer the owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should let the owner mint to any address", async function () {
      const amount = 1500000;
      await token.mint(other.address, amount);

      expect(await token.balanceOf(other.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(initialSupply.add(amount));
    });

    it("Should reject minting by a non owner", async function () {
      await expect(
        token.connect(other).mint(other.address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should transfer tokens between accounts", async function () {
      await expect(() => token.transfer(other.address, 250)).to.changeTokenBalances(
        token,
        [owner, other],
        [-250, 250]
      );
    });

    it("Should support the approve and transferFrom flow", async function () {
      await token.approve(other.address, 400);
      expect(await token.allowance(owner.address, other.address)).to.equal(400);

      await token.connect(other).transferFrom(owner.address, other.address, 400);
      expect(await token.balanceOf(other.address)).to.equal(400);
      expect(await token.allowance(owner.address, other.address)).to.equal(0);
    });

    it("Should reject a transfer above the balance", async function () {
      await expect(
        token.connect(other).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
});
