const { expect } = require("chai");
const { ethers } = require("hardhat");

const SEED_RECIPIENT = "0xD0E31F3Bd528b17DB25Af9a6014B56D2E3B6d773";
const SEED_AMOUNT = ethers.utils.parseEther("1000");

describe("NZDollar", function () {
  let nzDollar;
  let owner;
  let addr1;

  const initialSupply = ethers.utils.parseEther("1000000");

  beforeEach(async function () {
    const NZDollar = await ethers.getContractFactory("NZDollar");
    [owner, addr1] = await ethers.getSigners();
    nzDollar = await NZDollar.deploy(initialSupply);
    await nzDollar.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await nzDollar.name()).to.equal("New Zealand Dollar");
    expect(await nzDollar.symbol()).to.equal("NZDT");
  });

  it("Should use eighteen decimals", async function () {
    expect(await nzDollar.decimals()).to.equal(18);
  });

  it("Should mint initial supply to owner", async function () {
    const ownerBalance = await nzDollar.balanceOf(owner.address);
    expect(ownerBalance).to.equal(initialSupply.sub(SEED_AMOUNT));
  });

  it("Should transfer initial amount to specified address", async function () {
    expect(await nzDollar.balanceOf(SEED_RECIPIENT)).to.equal(SEED_AMOUNT);
  });

  it("Should keep the total supply equal to the initial supply", async function () {
    expect(await nzDollar.totalSupply()).to.equal(initialSupply);
  });

  it("Should transfer tokens between accounts", async function () {
    await expect(() =>
      nzDollar.transfer(addr1.address, SEED_AMOUNT)
    ).to.changeTokenBalances(
      nzDollar,
      [owner, addr1],
      [SEED_AMOUNT.mul(-1), SEED_AMOUNT]
    );
  });

  it("Should support the approve and transferFrom flow", async function () {
    await nzDollar.approve(addr1.address, SEED_AMOUNT);
    expect(await nzDollar.allowance(owner.address, addr1.address)).to.equal(
      SEED_AMOUNT
    );

    await nzDollar
      .connect(addr1)
      .transferFrom(owner.address, addr1.address, SEED_AMOUNT);
    expect(await nzDollar.balanceOf(addr1.address)).to.equal(SEED_AMOUNT);
    expect(await nzDollar.allowance(owner.address, addr1.address)).to.equal(0);
  });

  it("Should reject a transfer above the balance", async function () {
    await expect(
      nzDollar.connect(addr1).transfer(owner.address, 1)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Should reject a transferFrom without allowance", async function () {
    await expect(
      nzDollar.connect(addr1).transferFrom(owner.address, addr1.address, 1)
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("Should revert when the initial supply cannot cover the seed transfer", async function () {
    const NZDollar = await ethers.getContractFactory("NZDollar");
    await expect(NZDollar.deploy(SEED_AMOUNT.sub(1))).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance"
    );
  });
});
