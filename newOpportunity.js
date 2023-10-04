// Import necessary libraries
const { async } = require("rxjs");
const Web3 = require("web3");
const AWSHttpProvider = require("@aws/web3-http-provider");
const endpoint = process.env.AMB_HTTP_ENDPOINT;
const provider = new AWSHttpProvider(endpoint);
// Initialize provider URLs
const RPC_URL = "https://polygon-mainnet.infura.io/v3/4370c0c8b0f14824b6b6f276ed894657";
const uniswapRouter="0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const sushiswapRouter="0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
// Create a new Web3 instance with the RPC endpoint for the Ethereum mainnet
const web3 = new Web3(provider);
const { v4: uuidv4 } = require('uuid');


// Initialize DEX routers with their respective contract addresses and ABIs
const dexRouters = {
  uniswap: new web3.eth.Contract(
    require("./abis/uniswap_eth_router.json"),  // Uniswap router ABI
    uniswapRouter  // Uniswap router contract address
  ),
  sushiswap: new web3.eth.Contract(
    require("./abis/sushiswap_eth_router.json"),  // Sushiswap router ABI
    sushiswapRouter  // Sushiswap router contract address
  ),
  // uniswapRouter:  web3.eth.Contract(['ABI_HERE'], 'QUICKSWAP_ROUTER_ADDRESS'), // Replace with actual Quickswap router address and ABI
};



/**
 * Gets the exchange rate for swapping a token for another token on a decentralized exchange.
 * @param {object} pair - The token pair to check.
 * @returns {array} - An array containing the input amount and output amount for the swap.
 */
async function getAmountsOut(pair) {
  // Combine your hard-coded number with a string of 'decimal' number of zeros
  const valueWithZeros = '5' + '0'.repeat(pair.tokenA.decimal);

  const data = await dexRouters[pair.dex].methods
    .getAmountsOut(valueWithZeros, [
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
   try {
     // Get the exchange rate for the first token in the first pair.
     let [amountIn, amountOut] = await getAmountsOut(pair1);
  
     // Simulate the reverse trade on Quickswap with the output amount from the first trade
     let [amountIn2, amountOut2] = await getAmountsOutFromPreviousPair(pair2, amountOut);
   
     // Calculate the potential profit from the Sushiswap to Quickswap trade
     let result = (amountOut2 / Math.pow(10, pair1.tokenA.decimal)) - (amountIn / Math.pow(10, pair1.tokenA.decimal));
   
    //  console.log(
    //   pair1.pairSymbol,
    //   amountIn / Math.pow(10, pair1.tokenA.decimal),
    //   amountOut / Math.pow(10, pair1.tokenB.decimal),
    //   amountIn2 / Math.pow(10, pair1.tokenB.decimal),
    //   amountOut2 / Math.pow(10, pair1.tokenA.decimal),
    //   result,
    //   )
    //  // Simulate the reverse trade on Sushiswap with the output amount from the simulated Quickswap trade
     let [amountIn3, amountOut3] = await getAmountsOut(pair2);
     let [amountIn4, amountOut4] = await getAmountsOutFromPreviousPair(pair1, amountOut3);
   
     // Calculate the potential profit from the Quickswap to Sushiswap trade
     let reverseResult = (amountOut4 / Math.pow(10, pair2.tokenA.decimal)) - (amountIn3 / Math.pow(10, pair2.tokenA.decimal));
   
     // Calculate fees for both trades
     let percentToMinus = (0.5 / 100) * (result + reverseResult) * 4;
     let slippage = (1 / 100) * (result + reverseResult);
   
     // Final profit calculations after accounting for fees
     let finalResult = result - percentToMinus - slippage;
     let finalReverseResult = reverseResult - percentToMinus - slippage;
   
     let baseReturn = {
      id:uuidv4(),
       pair: pair1.pairSymbol,
       decimalA:pair1.tokenA.decimal,
       decimalB:pair1.tokenB.decimal,
       tokenAaddress: pair1.tokenA.address,
       tokenBaddress: pair1.tokenB.address,
       tokenAInvestment:pair1.tokenA.decimalValue,
       tokenBInvestment:pair1.tokenB.decimalValue,
       difference: finalResult,
       reverseDifferent:finalReverseResult,
       percentToMinus,
       slippage,
       amountIn,
       amountOut,
       amountIn2,
       amountOut2,
       amountIn3,
       amountOut3,
       amountIn4,
       amountOut4,
       sushiswapRouter:sushiswapRouter,
       uniswapRouter:uniswapRouter
     };
   
    //  Depending on which potential profit is larger, return different results
     if (finalResult > finalReverseResult && finalResult > 0.1) {
       return {
         ...baseReturn,
         direction: "sushiToUni",
         opportunityFound: true
       };
     } else if (finalReverseResult > finalResult && finalReverseResult > 0.1) {
       return {
         ...baseReturn,
         direction: "uniToSushi",
         opportunityFound: true
       };
     } else {
       return {
         ...baseReturn,
         direction: "none",
         opportunityFound: false
       };
     }
    
   } catch (error) {
    console.log(error)
   }
  }
  




module.exports = { opportunity };

