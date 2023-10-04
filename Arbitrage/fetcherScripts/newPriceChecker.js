const axios = require('axios');
const Bottleneck = require('bottleneck');
const BigNumber = require('bignumber.js');
const { writeJson } = require("fs-extra");
const path = require("path");

const liquidDataPath = path.join(
  __dirname,
  "..",
  "data",
  "data_with_liquidity.json"
  );
const _ = require('lodash');
const data = require('../data/Fine_data_without_liquidity.json'); // Replace with your actual file path

const limiter = new Bottleneck({
  reservoir: 300,
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000,
//   minTime: 100, // ensure minimum 0.2 seconds between operations
});
const coingeckoApi = 'https://api.coingecko.com/api/v3/';

// Define sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getTokenPriceInUSD(tokenAddress) {
    try {
      const priceData = await limiter.schedule(async () => {
        // await sleep(600); // Sleep for 600 milliseconds before making a request
        const response = await axios.get(
        `https://pro-api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd&x_cg_pro_api_key=CG-h6TUTQQSzMbdoAkp1G6as1hE`
          
        );
        return response.data[tokenAddress.toLowerCase()];
      });
  
      if (!priceData) {
        console.warn(`No price data for token ${tokenAddress}`);
        return 0;
      }
      return priceData.usd.toFixed(4);
    } catch (error) {
      console.error(`Failed to fetch price for token ${tokenAddress}: ${error}`);
      return 0;
    }
  }

async function processPairs() {
    const processedPairs = [];
    let count=0
    for (const pairSet of data) {
        console.log(count)
        const pair1 = pairSet[0];
        const pair2 = pairSet[1];

        const tokenAPrice = await getTokenPriceInUSD(pair1.tokenA.address);
        const tokenBPrice = await getTokenPriceInUSD(pair1.tokenB.address);

        console.log(tokenAPrice,tokenBPrice)
        count++

        const reserveAInUSD1 = new BigNumber(pair1.reserve0).dividedBy(new BigNumber(10).pow(pair1.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD1 = new BigNumber(pair1.reserve1).dividedBy(new BigNumber(10).pow(pair1.tokenB.decimal)).multipliedBy(tokenBPrice);
        const reserveAInUSD2 = new BigNumber(pair2.reserve0).dividedBy(new BigNumber(10).pow(pair2.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD2 = new BigNumber(pair2.reserve1).dividedBy(new BigNumber(10).pow(pair2.tokenB.decimal)).multipliedBy(tokenBPrice);

        // const condition1 = (reserveAInUSD1.isGreaterThan(10000) && reserveBInUSD1.isLessThan(3000)) || 
        //                    (reserveBInUSD1.isGreaterThan(10000) && reserveAInUSD1.isLessThan(3000));
        // const condition2 = (reserveAInUSD2.isGreaterThan(10000) && reserveBInUSD2.isLessThan(3000)) || 
        //                    (reserveBInUSD2.isGreaterThan(10000) && reserveAInUSD2.isLessThan(3000));
        const condition1 = (
          reserveAInUSD1.isGreaterThan(0) && 
          reserveBInUSD1.isGreaterThan(0)
        );
        
        const condition2 = (
          reserveAInUSD2.isGreaterThan(0) && 
          reserveBInUSD2.isGreaterThan(0)
        );

        if (!condition1 || !condition2) {
            continue;
        }

        const liquidity1 = reserveAInUSD1.plus(reserveBInUSD1);
        const liquidity2 = reserveAInUSD2.plus(reserveBInUSD2);

        const processedPair1 = {
            ...pair1,
            liquidity: liquidity1.toString(),
            tokenAPrice,
            tokenBPrice,
            tokenALiquidity: reserveAInUSD1.toString(),
            tokenBLiquidity: reserveBInUSD1.toString()
        };
        const processedPair2 = {
            ...pair2,
            liquidity: liquidity2.toString(),
            tokenAPrice,
            tokenBPrice,
            tokenALiquidity: reserveAInUSD2.toString(),
            tokenBLiquidity: reserveBInUSD2.toString()
        };
        processedPairs.push([processedPair1, processedPair2]);
    }
    return processedPairs;
}



processPairs()
  .then(processedPairs => {
    console.log(processedPairs,processedPairs.length);
    // You can write processedPairs to a file or do other operations
    writeJson(liquidDataPath, processedPairs)
    .then(() => {
      console.log("Data written to file successfully ");
    })
    .catch((error) => {
      console.log(error);
    });
  })
  .catch(err => console.error(err));