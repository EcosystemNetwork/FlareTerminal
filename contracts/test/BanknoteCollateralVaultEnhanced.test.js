const { expect } = require("chai");
const { ethers } = require("hardhat");

const VAULT =
  "contracts/banknoteCollateralVault_enhanced.sol:BanknoteCollateralVault";
const ONE = ethers.utils.parseEther("1");

describe("BanknoteCollateralVault (enhanced)", function () {
  let vault;
  let coordinator;
  let nzDollar;
  let owner;
  let minter;
  let merchant;
  let notePubkey;
  let subscriptionId;

  const denomination = 50;
  const noteValue = ONE.mul(denomination);

  beforeEach(async function () {
    [owner, minter, merchant, notePubkey] = await ethers.getSigners();

    const Coordinator = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    coordinator = await Coordinator.deploy(ONE.div(10), 1e9);
    await coordinator.deployed();

    const subTx = await coordinator.createSubscription();
    const subReceipt = await subTx.wait();
    subscriptionId = subReceipt.events.find(
      (e) => e.event === "SubscriptionCreated"
    ).args.subId;
    await coordinator.fundSubscription(subscriptionId, ONE.mul(100));

    const NZDollar = await ethers.getContractFactory("NZDollar");
    nzDollar = await NZDollar.deploy(ethers.utils.parseEther("1000000"));
    await nzDollar.deployed();

    const Vault = await ethers.getContractFactory(VAULT);
    vault = await Vault.deploy(
      owner.address,
      coordinator.address,
      subscriptionId
    );
    await vault.deployed();
    await coordinator.addConsumer(subscriptionId, vault.address);

    await nzDollar.transfer(minter.address, ethers.utils.parseEther("10000"));
    await nzDollar
      .connect(minter)
      .approve(vault.address, ethers.utils.parseEther("10000"));
  });

  const mint = () =>
    vault
      .connect(minter)
      .mintBanknote(nzDollar.address, notePubkey.address, denomination);

  describe("mintBanknote", function () {
    it("Should mint a banknote and emit banknoteMinted", async function () {
      await expect(mint())
        .to.emit(vault, "banknoteMinted")
        .withArgs(minter.address, nzDollar.address, 0, denomination);
    });

    it("Should request randomness from the VRF coordinator", async function () {
      await expect(mint()).to.emit(coordinator, "RandomWordsRequested");
    });

    it("Should escrow the face value and store the banknote", async function () {
      await expect(() => mint()).to.changeTokenBalances(
        nzDollar,
        [minter, vault],
        [noteValue.mul(-1), noteValue]
      );

      const [storedMinter, pubkey, erc20, storedDenomination, uniqueIdentifier] =
        await vault.getBanknoteInfo(0);
      expect(storedMinter).to.equal(minter.address);
      expect(pubkey).to.equal(notePubkey.address);
      expect(erc20).to.equal(nzDollar.address);
      expect(storedDenomination).to.equal(denomination);
      expect(uniqueIdentifier).to.equal(0);
      expect(await vault.getNextId()).to.equal(1);
    });

    it("Should reject an unsupported denomination", async function () {
      await expect(
        vault
          .connect(minter)
          .mintBanknote(nzDollar.address, notePubkey.address, 7)
      ).to.be.revertedWith("Invalid denomination");
    });
  });

  describe("fulfillRandomWords", function () {
    it("Should write the identifier to the next id instead of the minted one", async function () {
      const tx = await mint();
      const receipt = await tx.wait();
      const requestId = coordinator.interface.parseLog(
        receipt.logs.find((log) => log.address === coordinator.address)
      ).args.requestId;

      await expect(coordinator.fulfillRandomWords(requestId, vault.address))
        .to.emit(vault, "RandomnessFulfilled");

      // requestRandomness() records `nextId` after mintBanknote() already
      // incremented it, so the randomness lands on the following slot.
      expect((await vault.getBanknoteInfo(0))[4]).to.equal(0);
      expect((await vault.getBanknoteInfo(1))[4]).to.not.equal(0);
    });
  });

  describe("redeemBanknote", function () {
    const description = ethers.utils.formatBytes32String("groceries");

    beforeEach(async function () {
      await mint();
    });

    it("Should pay the redeemer and return change to the minter", async function () {
      const amount = ONE.mul(20);

      await expect(
        vault.connect(merchant).redeemBanknote(0, amount, "0x", description)
      )
        .to.emit(vault, "banknoteRedeemed")
        .withArgs(merchant.address, nzDollar.address, amount, description, 0);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(
        noteValue.sub(amount)
      );
    });

    it("Should reject a second redemption of the same banknote", async function () {
      await vault.connect(merchant).redeemBanknote(0, ONE, "0x", description);
      await expect(
        vault.connect(merchant).redeemBanknote(0, ONE, "0x", description)
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

  describe("surplus funds", function () {
    it("Should credit deposits and allow them to be skimmed", async function () {
      const amount = ONE.mul(10);
      await expect(vault.connect(minter).DepositFrom(nzDollar.address, amount))
        .to.emit(vault, "Deposited")
        .withArgs(minter.address, nzDollar.address, amount);

      await expect(vault.connect(minter).skimSurplus(nzDollar.address, 0))
        .to.emit(vault, "surplusFundsSkimmed")
        .withArgs(minter.address, nzDollar.address, amount);

      expect(await vault.getSurplus(minter.address, nzDollar.address)).to.equal(0);
    });

    it("Should reject a skim without surplus and a skim that is too large", async function () {
      await expect(
        vault.connect(merchant).skimSurplus(nzDollar.address, 0)
      ).to.be.revertedWith("No surplus funds");

      await vault.connect(minter).DepositFrom(nzDollar.address, ONE);
      await expect(
        vault.connect(minter).skimSurplus(nzDollar.address, ONE.mul(2))
      ).to.be.revertedWith("Amount exceeds surplus");
    });
  });

  describe("utilities", function () {
    it("Should parse an address string and reject malformed input", async function () {
      expect(await vault.stringToAddress(merchant.address)).to.equal(
        merchant.address
      );
      await expect(vault.stringToAddress("0xdead")).to.be.revertedWith(
        "Invalid address length"
      );
      await expect(
        vault.stringToAddress("0x" + "z".repeat(40))
      ).to.be.revertedWith("Invalid hex character");
    });

    it("Should reject a signature of the wrong length", async function () {
      await expect(vault.splitSignature("0x00")).to.be.revertedWith(
        "Invalid signature length"
      );
    });

    it("Should accept plain ETH transfers", async function () {
      await expect(() =>
        owner.sendTransaction({ to: vault.address, value: ONE })
      ).to.changeEtherBalance(vault, ONE);
    });
  });
});
