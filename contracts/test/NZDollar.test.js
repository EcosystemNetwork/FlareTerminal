const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployNZDollar } = require("./helpers");

describe("NZDollar", function () {
  let nzDollar;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    nzDollar = await deployNZDollar();
  });

  it("Should have correct name and symbol", async function () {
    expect(await nzDollar.name()).to.equal("New Zealand Dollar");
    expect(await nzDollar.symbol()).to.equal("NZDT");
  });

  it("Should mint initial supply to owner", async function () {
    const ownerBalance = await nzDollar.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("999000")); // 1000000 - 1000 (transferred in constructor)
  });

  it("Should transfer initial amount to specified address", async function () {
    const recipientBalance = await nzDollar.balanceOf("0xD0E31F3Bd528b17DB25Af9a6014B56D2E3B6d773");
    expect(recipientBalance).to.equal(ethers.utils.parseEther("1000"));
  });
});