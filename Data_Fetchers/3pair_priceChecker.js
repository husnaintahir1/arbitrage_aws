const axios = require('axios');
const Bottleneck = require('bottleneck');
const BigNumber = require('bignumber.js');
const { writeJson } = require("fs-extra");
const MAGIC_NUMBER=3000
const _ = require('lodash');
const data = require('../fineData/overlapped-pairs-curved.json'); // Replace with your actual file path

const limiter = new Bottleneck({
  reservoir: 300,
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000,
  minTime: 200, // ensure minimum 0.2 seconds between operations
});
const coingeckoApi = 'https://api.coingecko.com/api/v3/';

// Define sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getTokenPriceInUSD(tokenAddress) {
    try {
      const priceData = await limiter.schedule(async () => {
        // await sleep(600); // Sleep for 600 milliseconds before making a request
        const response = await axios.get(
        `https://pro-api.coingecko.com/api/v3/simple/token_price/polygon-pos?contract_addresses=${tokenAddress}&vs_currencies=usd&x_cg_pro_api_key=CG-h6TUTQQSzMbdoAkp1G6as1hE`
          
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
    let count = 0;
    for (const pairSet of data) {
        console.log(count);
        const pair1 = pairSet[0];
        const pair2 = pairSet[1];
        const pair3 = pairSet[2];

        // Fetch token prices concurrently
        const [tokenAPrice, tokenBPrice] = await Promise.all([
            getTokenPriceInUSD(pair1.tokenA.address),
            getTokenPriceInUSD(pair1.tokenB.address)
        ]);

        console.log(tokenAPrice, tokenBPrice);
        count++;

        const reserveAInUSD1 = new BigNumber(pair1.reserve0).dividedBy(new BigNumber(10).pow(pair1.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD1 = new BigNumber(pair1.reserve1).dividedBy(new BigNumber(10).pow(pair1.tokenB.decimal)).multipliedBy(tokenBPrice);
        const reserveAInUSD2 = new BigNumber(pair2.reserve0).dividedBy(new BigNumber(10).pow(pair2.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD2 = new BigNumber(pair2.reserve1).dividedBy(new BigNumber(10).pow(pair2.tokenB.decimal)).multipliedBy(tokenBPrice);
        const reserveAInUSD3 = new BigNumber(pair3.reserve0).dividedBy(new BigNumber(10).pow(pair3.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD3 = new BigNumber(pair3.reserve1).dividedBy(new BigNumber(10).pow(pair3.tokenB.decimal)).multipliedBy(tokenBPrice);

        // if (reserveAInUSD1.isLessThan(MAGIC_NUMBER) || reserveBInUSD1.isLessThan(MAGIC_NUMBER) || reserveAInUSD2.isLessThan(MAGIC_NUMBER) || reserveBInUSD2.isLessThan(MAGIC_NUMBER) || reserveAInUSD3.isLessThan(MAGIC_NUMBER) || reserveBInUSD3.isLessThan(MAGIC_NUMBER)) {
        //     continue;
        // }

        const liquidity1 = reserveAInUSD1.plus(reserveBInUSD1);
        const liquidity2 = reserveAInUSD2.plus(reserveBInUSD2);
        const liquidity3 = reserveAInUSD3.plus(reserveBInUSD3);

        const processedPair1 = {
            ...pair1,
            liquidity: liquidity1.toString(),
            tokenAPrice,
            tokenBPrice
        };
        const processedPair2 = {
            ...pair2,
            liquidity: liquidity2.toString(),
            tokenAPrice,
            tokenBPrice
        };
        const processedPair3 = {
            ...pair3,
            liquidity: liquidity3.toString(),
            tokenAPrice,
            tokenBPrice
        };
        processedPairs.push([processedPair1, processedPair2, processedPair3]);
    }
    return processedPairs;
}

processPairs()
  .then(processedPairs => {
    console.log(processedPairs, processedPairs.length);
    // You can write processedPairs to a file or do other operations
    writeJson("./fineData/Overlapped-pairs-with-liquidity-All-dexes.json", processedPairs)
    .then(() => {
      console.log("Data written to file successfully ");
    })
    .catch((error) => {
      console.log(error);
    });
  })
  .catch(err => console.error(err));

