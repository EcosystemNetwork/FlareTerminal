const { expect } = require("chai");
const { ethers } = require("hardhat");

const VAULT = "contracts/banknoteCollateralVault.sol:BanknoteCollateralVault";
const ONE = ethers.utils.parseEther("1");

describe("BanknoteCollateralVault", function () {
  let vault;
  let nzDollar;
  let owner;
  let minter;
  let merchant;
  let notePubkey;

  const denomination = 100;
  const noteValue = ONE.mul(denomination);

  beforeEach(async function () {
    [owner, minter, merchant, notePubkey] = await ethers.getSigners();

    const NZDollar = await ethers.getContractFactory("NZDollar");
    nzDollar = await NZDollar.deploy(ethers.utils.parseEther("1000000"));
    await nzDollar.deployed();

    const BanknoteCollateralVault = await ethers.getContractFactory(VAULT);
    vault = await BanknoteCollateralVault.deploy(owner.address);
    await vault.deployed();

    // The deployer holds the initial supply; fund the minter used by most tests.
    await nzDollar.transfer(minter.address, ethers.utils.parseEther("10000"));
    await nzDollar
      .connect(minter)
      .approve(vault.address, ethers.utils.parseEther("10000"));
  });

  describe("getters", function () {
    it("Should start with a next id of zero", async function () {
      expect(await vault.getNextId()).to.equal(0);
    });

    it("Should report zero surplus for an unknown minter", async function () {
      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(0);
    });

    it("Should report empty info for an unknown banknote", async function () {
      const info = await vault.getBanknoteInfo(42);
      expect(info[0]).to.equal(ethers.constants.AddressZero);
      expect(info[1]).to.equal(ethers.constants.AddressZero);
      expect(info[2]).to.equal(ethers.constants.AddressZero);
      expect(info[3]).to.equal(0);
    });
  });

  describe("mintBanknote", function () {
    it("Should mint a banknote and emit banknoteMinted", async function () {
      await expect(
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, denomination)
      )
        .to.emit(vault, "banknoteMinted")
        .withArgs(minter.address, nzDollar.address, 0, denomination);
    });

    it("Should escrow the face value of the banknote", async function () {
      await expect(() =>
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, denomination)
      ).to.changeTokenBalances(
        nzDollar,
        [minter, vault],
        [noteValue.mul(-1), noteValue]
      );
    });

    it("Should store the banknote details and increment the next id", async function () {
      await vault
        .connect(minter)
        .mintBanknote(nzDollar.address, notePubkey.address, denomination);

      const [storedMinter, pubkey, erc20, storedDenomination] =
        await vault.getBanknoteInfo(0);
      expect(storedMinter).to.equal(minter.address);
      expect(pubkey).to.equal(notePubkey.address);
      expect(erc20).to.equal(nzDollar.address);
      expect(storedDenomination).to.equal(denomination);
      expect(await vault.getNextId()).to.equal(1);
    });

    it("Should allocate sequential ids to successive banknotes", async function () {
      await vault
        .connect(minter)
        .mintBanknote(nzDollar.address, notePubkey.address, 5);
      await vault
        .connect(minter)
        .mintBanknote(nzDollar.address, notePubkey.address, 10);

      expect((await vault.getBanknoteInfo(0))[3]).to.equal(5);
      expect((await vault.getBanknoteInfo(1))[3]).to.equal(10);
      expect(await vault.getNextId()).to.equal(2);
    });

    it("Should reject an unsupported denomination", async function () {
      await expect(
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, 3)
      ).to.be.revertedWith("Invalid denomination");
    });

    it("Should consume existing surplus before transferring tokens", async function () {
      const surplus = ONE.mul(30);
      await vault.connect(minter).DepositFrom(nzDollar.address, surplus);

      // Face value (100) exceeds the surplus (30), so only the shortfall moves.
      await expect(() =>
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, denomination)
      ).to.changeTokenBalance(nzDollar, minter, noteValue.sub(surplus).mul(-1));

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(0);
    });

    it("Should mint entirely from surplus when the surplus is larger", async function () {
      const surplus = ONE.mul(500);
      await vault.connect(minter).DepositFrom(nzDollar.address, surplus);

      await expect(() =>
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, denomination)
      ).to.changeTokenBalance(nzDollar, minter, 0);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        surplus.sub(noteValue)
      );
    });
  });

  describe("DepositFrom", function () {
    it("Should credit surplus and emit Deposited", async function () {
      const amount = ONE.mul(25);
      await expect(vault.connect(minter).DepositFrom(nzDollar.address, amount))
        .to.emit(vault, "Deposited")
        .withArgs(minter.address, nzDollar.address, amount);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        amount
      );
    });

    it("Should accumulate repeated deposits", async function () {
      await vault.connect(minter).DepositFrom(nzDollar.address, ONE);
      await vault.connect(minter).DepositFrom(nzDollar.address, ONE.mul(2));
      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        ONE.mul(3)
      );
    });
  });

  describe("redeemBanknote", function () {
    const description = ethers.utils.formatBytes32String("coffee");

    beforeEach(async function () {
      await vault
        .connect(minter)
        .mintBanknote(nzDollar.address, notePubkey.address, denomination);
    });

    it("Should pay the redeemer and emit banknoteRedeemed", async function () {
      const amount = ONE.mul(60);
      await expect(
        vault.connect(merchant).redeemBanknote(0, amount, "0x", description)
      )
        .to.emit(vault, "banknoteRedeemed")
        .withArgs(
          merchant.address,
          nzDollar.address,
          amount,
          description,
          0
        );
    });

    it("Should transfer the redeemed amount out of the vault", async function () {
      const amount = ONE.mul(60);
      await expect(() =>
        vault.connect(merchant).redeemBanknote(0, amount, "0x", description)
      ).to.changeTokenBalances(
        nzDollar,
        [vault, merchant],
        [amount.mul(-1), amount]
      );
    });

    it("Should return the change to the minter as surplus", async function () {
      const amount = ONE.mul(60);
      await vault.connect(merchant).redeemBanknote(0, amount, "0x", description);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        noteValue.sub(amount)
      );
    });

    it("Should leave no surplus when the full face value is redeemed", async function () {
      await vault
        .connect(merchant)
        .redeemBanknote(0, noteValue, "0x", description);
      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(0);
    });

    it("Should delete the banknote so it cannot be redeemed twice", async function () {
      await vault.connect(merchant).redeemBanknote(0, ONE, "0x", description);

      const info = await vault.getBanknoteInfo(0);
      expect(info[0]).to.equal(ethers.constants.AddressZero);
      expect(info[3]).to.equal(0);

      await expect(
        vault.connect(merchant).redeemBanknote(0, ONE, "0x", description)
      ).to.be.revertedWith("Bad banknote");
    });

    it("Should reject an unknown banknote", async function () {
      await expect(
        vault.connect(merchant).redeemBanknote(99, ONE, "0x", description)
      ).to.be.revertedWith("Bad banknote");
    });

    it("Should reject an amount above the face value", async function () {
      await expect(
        vault
          .connect(merchant)
          .redeemBanknote(0, noteValue.add(1), "0x", description)
      ).to.be.revertedWith("Amount too large");
    });
  });

  describe("skimSurplus", function () {
    beforeEach(async function () {
      await vault.connect(minter).DepositFrom(nzDollar.address, ONE.mul(100));
    });

    it("Should withdraw the requested amount and emit surplusFundsSkimmed", async function () {
      const amount = ONE.mul(40);
      await expect(vault.connect(minter).skimSurplus(nzDollar.address, amount))
        .to.emit(vault, "surplusFundsSkimmed")
        .withArgs(minter.address, nzDollar.address, amount);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        ONE.mul(60)
      );
    });

    it("Should withdraw the whole surplus when the amount is zero", async function () {
      await expect(() =>
        vault.connect(minter).skimSurplus(nzDollar.address, 0)
      ).to.changeTokenBalance(nzDollar, minter, ONE.mul(100));

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(0);
    });

    it("Should reject a skim when there is no surplus", async function () {
      await expect(
        vault.connect(merchant).skimSurplus(nzDollar.address, 0)
      ).to.be.revertedWith("No surplus funds");
    });

    it("Should reject a skim larger than the surplus", async function () {
      await expect(
        vault.connect(minter).skimSurplus(nzDollar.address, ONE.mul(101))
      ).to.be.revertedWith("Amount exceeds surplus");
    });
  });

  describe("signature utilities", function () {
    it("Should split a signature into r and s", async function () {
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["address"], [merchant.address])
      );
      const signature = await notePubkey.signMessage(
        ethers.utils.arrayify(messageHash)
      );
      const expected = ethers.utils.splitSignature(signature);

      const [r, s] = await vault.splitSignature(signature);
      expect(r).to.equal(expected.r);
      expect(s).to.equal(expected.s);
    });

    it("Should read v from the wrong offset, so recovery cannot succeed", async function () {
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["address"], [merchant.address])
      );
      const signature = await notePubkey.signMessage(
        ethers.utils.arrayify(messageHash)
      );
      const bytes = ethers.utils.arrayify(signature);

      // The assembly loads v from `signature + 65` instead of `signature + 96`,
      // which yields byte 33 of the signature rather than the real v.
      const [, , v] = await vault.splitSignature(signature);
      expect(v).to.equal(bytes[33]);
      expect(v).to.not.equal(ethers.utils.splitSignature(signature).v);
    });

    it("Should reject a signature of the wrong length", async function () {
      await expect(vault.splitSignature("0x1234")).to.be.revertedWith(
        "Invalid signature length"
      );
    });

    it("Should fail to recover the signer because of the malformed v", async function () {
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["address"], [merchant.address])
      );
      const signature = await notePubkey.signMessage(
        ethers.utils.arrayify(messageHash)
      );

      expect(
        await vault.verifySignatureOfAddress(merchant.address, signature)
      ).to.not.equal(notePubkey.address);
    });

    it("Should not recover the signer for a different address", async function () {
      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["address"], [merchant.address])
      );
      const signature = await notePubkey.signMessage(
        ethers.utils.arrayify(messageHash)
      );

      expect(
        await vault.verifySignatureOfAddress(minter.address, signature)
      ).to.not.equal(notePubkey.address);
    });
  });

  describe("stringToAddress", function () {
    it("Should parse a lowercase address string", async function () {
      const address = merchant.address.toLowerCase();
      expect(await vault.stringToAddress(address)).to.equal(merchant.address);
    });

    it("Should parse a checksummed address string", async function () {
      expect(await vault.stringToAddress(merchant.address)).to.equal(
        merchant.address
      );
    });

    it("Should reject a string of the wrong length", async function () {
      await expect(vault.stringToAddress("0x1234")).to.be.revertedWith(
        "Invalid address length"
      );
    });

    it("Should reject a string containing non hex characters", async function () {
      const invalid = "0x" + "z".repeat(40);
      await expect(vault.stringToAddress(invalid)).to.be.revertedWith(
        "Invalid hex character"
      );
    });
  });

  it("Should accept plain ETH transfers", async function () {
    await expect(() =>
      owner.sendTransaction({ to: vault.address, value: ONE })
    ).to.changeEtherBalance(vault, ONE);
  });
});
