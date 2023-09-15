// Import necessary libraries
const { async } = require("rxjs");
const Web3 = require("web3");

// Initialize provider URLs
const RPC_URL = "https://polygon-mainnet.infura.io/v3/4370c0c8b0f14824b6b6f276ed894657";
const quickswapRouter="0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
const sushiswapRouter="0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
// Create a new Web3 instance with the RPC endpoint for the Ethereum mainnet
const web3 = new Web3(RPC_URL);


// Initialize DEX routers with their respective contract addresses and ABIs
const dexRouters = {
  quickswap: new web3.eth.Contract(
    require("./abis/quickswap_polygon_router_abi.json"),  // Uniswap router ABI
    quickswapRouter  // Uniswap router contract address
  ),
  sushiswap: new web3.eth.Contract(
    require("./abis/sushiwap_polygon_router_abi.json"),  // Sushiswap router ABI
    sushiswapRouter  // Sushiswap router contract address
  ),
  // quickswapRouter:  web3.eth.Contract(['ABI_HERE'], 'QUICKSWAP_ROUTER_ADDRESS'), // Replace with actual Quickswap router address and ABI
};
// Define the trading pairs to monitor, along with the corresponding dex routers
// const pairs = [
//   {
//     tokenIn: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
//     tokenOut: '0xd5d84e75f48E75f01fb2EB6dFD8eA148eE3d0FEb', // QUICK
//     dexRouter: 'uniswapV2Router',
//   },
//   // Add more pairs and corresponding dex routers here
// ];

const pairs = [
  {
      "dex": "sushiswap",
      "key": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      "liquidity": "2321980924584720910816557033711505880345334810",
      "pairAddress": "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E",
      "pairSymbol": "WMATIC/WETH",
      "tokenA": {
          "address": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
          "decimal": "18",
          "decimalValue": "1000000000000000000",
          "name": "Wrapped Matic",
          "symbol": "WMATIC"
      },
      "tokenB": {
          "address": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
          "decimal": "18",
          "decimalValue": "1000000000000000000",
          "name": "Wrapped Ether",
          "symbol": "WETH"
      }
  },
  {
      "dex": "quickswap",
      "key": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      "liquidity": "950861973589256158610791630138692169378847250",
      "pairAddress": "0xadbF1854e5883eB8aa7BAf50705338739e558E5b",
      "pairSymbol": "WMATIC/WETH",
      "tokenA": {
          "address": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
          "decimal": "18",
          "decimalValue": "1000000000000000000",
          "name": "Wrapped Matic",
          "symbol": "WMATIC"
      },
      "tokenB": {
          "address": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
          "decimal": "18",
          "decimalValue": "1000000000000000000",
          "name": "Wrapped Ether",
          "symbol": "WETH"
      }
  }
];
/**
 * Gets the exchange rate for swapping a token for another token on a decentralized exchange.
 * @param {object} pair - The token pair to check.
 * @returns {array} - An array containing the input amount and output amount for the swap.
 */
async function getAmountsOut(pair) {

  const data = await dexRouters[pair.dex].methods
    .getAmountsOut(pair.tokenA.decimalValue, [
      pair.tokenA.address,
      pair.tokenB.address,
    ])
    .call();
  return data;
}
/**
 * Gets the exchange rate for swapping a token for another token on a decentralized exchange, using the output amount from a previous call as the input amount.
 * @param {object} pair - The token pair to check.
 * @param {number} amountIn - The output amount from the previous call to use as the input amount for this call.
 * @returns {array} - An array containing the input amount and output amount for the swap.
 */
async function getAmountsOutFromPreviousPair(pair, amountIn) {

  // Call the getAmountsOut method on the appropriate decentralized exchange router contract, passing in the output amount from the previous call as the input amount for this call and an array of the addresses of the second and first tokens in the pair.
  const data = await dexRouters[pair.dex].methods
    .getAmountsOut(amountIn, [pair.tokenB.address, pair.tokenA.address])
    .call();
  // Return an array containing the input amount and output amount for the swap.
  return data;
}
/**
 * Calculates the potential profit that can be made by swapping between two pairs of tokens on different decentralized exchanges.
 * @param {object} pair1 - The first token pair to check.
 * @param {object} pair2 - The second token pair to check.
 * @returns {object} - An object containing information about the potential profit and whether an opportunity was found.
 */
async function opportunity(pair1, pair2) {
  // Get the exchange rate for the first token in the first pair.
  // console.log(pair1)
  let [amountIn, amountOut] = await getAmountsOut(pair1);

  // Get the exchange rate for swapping the second token in the second pair for the first token in the first pair, using the output amount from the first call as the input amount.
  let [amountIn2, amountOut2] = await getAmountsOutFromPreviousPair(
    pair2,
    amountOut
  );
console.log(amountIn,amountOut,amountIn2,amountOut2)
  // console.log(amountIn,amountOut,amountIn2,amountOut2)
  // Calculate the potential profit that can be made by swapping between the two pairs of tokens.
  let result =(amountOut2 /= Math.pow(10, pair1.tokenA.decimal)) -(amountIn /= Math.pow(10, pair1.tokenA.decimal))
  let percentToMinus = (0.5 / 100) * result * 4;
  let slippage = (1 / 100) * result;
  let finalResult = result - percentToMinus - slippage;

  // If the potential profit is greater than 0.1, an opportunity was found to make a profit by swapping between the two pairs of tokens.
  if (finalResult > 0.1) {
    return {
      direction: "sushiToQuick",
      pair: pair1.pairSymbol,
      tokenAaddress:pair1.tokenA.address,
      tokenBaddress:pair1.tokenB.address,
      sushiswapRouter,
      quickswapRouter,
      difference: finalResult,
      percentToMinus,
      slippage,
      amountIn,
      amountOut,
      amountIn2,
      amountOut2,
      opportunityFound: true,
    };
  }
  // If the potential profit is less than -0.1, an opportunity was found to make a profit by swapping in the opposite direction.
  else if (finalResult < -0.1) {
    return {
      direction: "QuickToSuhi",
      pair: pair1.pairSymbol,
      tokenAaddress:pair1.tokenA.address,
      tokenBaddress:pair1.tokenB.address,
      sushiswapRouter,
      quickswapRouter,
      difference: finalResult,
      percentToMinus,
      slippage,
      amountIn,
      amountOut,
      amountIn2,
      amountOut2,
      opportunityFound: true,
    };
  }
  // If the potential profit is between -0.1 and 0.1, no opportunity was found to make a profit.
  else {
    return {
      direction: "none",
      pair: pair1.pairSymbol,
      tokenAaddress:pair1.tokenA.address,
      tokenBaddress:pair1.tokenB.address,
      sushiswapRouter,
      quickswapRouter,
      difference: finalResult,
      percentToMinus,
      slippage,
      amountIn,
      amountOut,
      amountIn2,
      amountOut2,
      opportunityFound: false,
    };
  }
}




module.exports = { opportunity };

