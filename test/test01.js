// SPDX-License-Identifier: MIT
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("SafeMoonLikeToken Contract", function () {
  let token;
  let wETHHolder
  let owner;
  let addr1;
  let addr2;
  let uniswapRouter;
  let wethAddress;
  let liquidityPool;
  const initialSupply = ethers.parseUnits("1000000000", 18); // 1 Billion tokens
  const buyTax = 5; // 5%
  const sellTax = 5; // 5%
  const liquidityAllocation = 2; // 2%
  const reflectionAllocation = 3; // 3%
  const MINIMUM_HOLDING_FOR_REFLECTION = ethers.parseUnits("250000", 18); // 250,000 tokens
  const amountSafeMoon = ethers.parseUnits("2500000", 18); // Amount of SafeMoon token to add as liquidity
  const amountWETH = ethers.parseEther("0.01"); // Amount of WETH to add as liquidity
  let not_added = true

  beforeEach(async () => {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Fetch the Uniswap V2 Router contract from forked mainnet
    const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";  // Replace with the actual Uniswap V2 Router address
    uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress);
    wethAddress = await uniswapRouter.WETH();
    uniswapRouter.address = uniswapRouter.target
    // Deploy the SafeMoonLikeToken contract
    const WETHHolder = await ethers.getContractFactory("WETHHolder");
    wETHHolder = await WETHHolder.deploy(owner.address);
    await wETHHolder.waitForDeployment();

    const SafeMoonLikeToken = await ethers.getContractFactory("SafeMoonLikeToken");
    token = await SafeMoonLikeToken.deploy(uniswapRouterAddress,wETHHolder.target);
    await token.waitForDeployment();

    await wETHHolder.transferOwnership(token.target)

    // Set liquidity pool address
    liquidityPool = await token.liquidityPool();
    console.log("liquidityPool" , liquidityPool)
    await token.excludeFromFees(wETHHolder.target, true)
    await token.excludeFromFees(liquidityPool, true)
    await token.approve(uniswapRouterAddress, amountSafeMoon);

    await uniswapRouter.addLiquidityETH(
      token.target, // SafeMoon token address
      amountSafeMoon,   // Amount of SafeMoon to add
      0,                // Min amount of SafeMoon (set to 0 for now)
      0,                // Min amount of ETH (set to 0 for now)
      owner.address,    // Address where liquidity tokens are sent
      Math.floor(Date.now() / 1000) + 60 * 10, // Deadline (10 minutes from now)
      { value: amountWETH } // Add ETH value here
    );
   
  });

  describe("Deployment", () => {
    it("Should set the correct token name and symbol", async () => {
      expect(await token.name()).to.equal("SafeMoonLikeToken");
      expect(await token.symbol()).to.equal("SMLT");
    });

    it("Should create a liquidity pool upon deployment", async () => {
      expect(liquidityPool).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Taxation", () => {
    it("Should correctly set buy and sell taxes", async () => {
      await token.setTaxes(6, 4);
      expect(await token.buyTax()).to.equal(6);
      expect(await token.sellTax()).to.equal(4);
    });

    it("Should revert if taxes exceed 10%", async () => {
      await expect(token.setTaxes(11, 5)).to.be.revertedWith("Tax cannot exceed 10%");
    });

    it("Should apply taxes on transfer", async () => {
      const amount = ethers.parseUnits("1", 18);

      // Exclude addr1 from fees
      await token.excludeFromFees(addr1.address, true);

      // Transfer tokens from owner to addr1, should not apply tax
      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
      console.log("DONE")
      // Now, include addr2 and transfer, should apply taxes
      await token.excludeFromFees(addr1.address, false);
      await token.transfer(addr2.address, amount);
      
      const taxAmount = (amount * BigInt(buyTax)) / BigInt(100);
      const amountAfterTax = amount - taxAmount;

      expect(await token.balanceOf(addr2.address)).to.equal(amountAfterTax);
    });
  });

  describe("Reflections", () => {
    it("Should correctly calculate claimable reflections", async () => {
      // Transfer tokens to addr1 and accumulate reflections
      await token.transfer(addr1.address, MINIMUM_HOLDING_FOR_REFLECTION);
      const claimableAfterTransfer = await token.calculateClaimable(owner.address);
      expect(claimableAfterTransfer).to.be.gt(BigInt(0));
    });

    it("Should allow users to claim reflections", async () => {
      // Transfer enough tokens to addr1 for reflection eligibility
      let tx = await token.transfer(addr1.address, MINIMUM_HOLDING_FOR_REFLECTION);
      await tx.wait()
      // Get reflection amount before claiming
      const claimableBefore = await token.calculateClaimable(owner.address);
      console.log(claimableBefore)
      // Claim reflections
      tx = await token.claimReflections(owner.address);
      await tx.wait()
      // Check reflection claim event
      // await expect(await token.claimableReflections(owner.address)).to.be.gt(0);
      // expect(await wethAddress.balanceOf(owner.address)).to.be.gt(claimableBefore);
    });

    it("Should prevent reflection claims below minimum holding", async () => {
      // Transfer less than minimum
      await token.transfer(addr1.address, ethers.parseUnits("100", 18));
      
      // Should return zero claimable
      const claimableAmount = await token.calculateClaimable(addr1.address);
      expect(claimableAmount).to.equal(0);
    });

  });

  
});
