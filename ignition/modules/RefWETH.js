// deploy/SafeMoonLikeToken.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Uniswap V2 Router address (mainnet)
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

// Deployment configuration
const INITIAL_SUPPLY = ethers.parseUnits("1000000000", 18); // 1 Billion tokens
const BUY_TAX = 5;
const SELL_TAX = 5;
const LIQUIDITY_ALLOCATION = 2;
const REFLECTION_ALLOCATION = 3;
const AMOUNT_SAFEMOON = ethers.parseUnits("2500000", 18);
const AMOUNT_WETH = ethers.parseEther("0.1");

const SafeMoonLikeTokenModule = buildModule("SafeMoonLikeTokenDeploymentTestMOD", (m) => {
  // Deploy WETHHolder first
  const owner = m.getAccount(0);

  const wethHolder = m.contract("WETHHolder", [owner]);

  
  const token = m.contract("SafeMoonLikeToken", [
    UNISWAP_V2_ROUTER, 
    wethHolder
  ]);

  
  m.call(wethHolder, "transferOwnership", [token]);

  
  m.call(token, "setTaxes", [BUY_TAX, SELL_TAX]);
  m.call(token, "setTaxAllocations", [LIQUIDITY_ALLOCATION, REFLECTION_ALLOCATION]);

 
  m.call(token, "excludeFromFees", [UNISWAP_V2_ROUTER, true], {
    id: "excludeFromFees_UNISWAP"
  });
  
  m.call(token, "excludeFromFees", [wethHolder, true], {
    id: "excludeFromFees_WETHHolder"
  });

  m.call(token, "approve", [UNISWAP_V2_ROUTER, AMOUNT_SAFEMOON]);
  

  return { token, wethHolder };
});


module.exports = SafeMoonLikeTokenModule;