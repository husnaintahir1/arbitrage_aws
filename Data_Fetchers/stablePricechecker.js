const axios = require('axios');
const Bottleneck = require('bottleneck');
const BigNumber = require('bignumber.js');
const { writeJson } = require("fs-extra");

const data = require('../fineData/result.json'); // Replace with your actual file path

const limiter = new Bottleneck({
  reservoir: 300,
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000,
//   minTime: 200, // ensure minimum 0.2 seconds between operations
});

// List of stable tokens
const stableTokens = require("../fineData/uniqueTokens.json")

async function getTokenPriceInUSD(tokenAddress) {
    try {
      const priceData = await limiter.schedule(async () => {
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
    let count = 0
    for (const pairSet of data) {
        console.log(count)
        const pair1 = pairSet[0];
        const pair2 = pairSet[1];

        const tokenA1IsStable = stableTokens.some(token => token.address.toLowerCase() === pair1.tokenA.address.toLowerCase());
        const tokenB1IsStable = stableTokens.some(token => token.address.toLowerCase() === pair1.tokenB.address.toLowerCase());
        const tokenA2IsStable = stableTokens.some(token => token.address.toLowerCase() === pair2.tokenA.address.toLowerCase());
        const tokenB2IsStable = stableTokens.some(token => token.address.toLowerCase() === pair2.tokenB.address.toLowerCase());

        const tokenAPrice = await getTokenPriceInUSD(pair1.tokenA.address);
        const tokenBPrice = await getTokenPriceInUSD(pair1.tokenB.address);

        console.log(tokenAPrice, tokenBPrice)
        count++

        const reserveAInUSD1 = new BigNumber(pair1.reserve0).dividedBy(new BigNumber(10).pow(pair1.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD1 = new BigNumber(pair1.reserve1).dividedBy(new BigNumber(10).pow(pair1.tokenB.decimal)).multipliedBy(tokenBPrice);
        const reserveAInUSD2 = new BigNumber(pair2.reserve0).dividedBy(new BigNumber(10).pow(pair2.tokenA.decimal)).multipliedBy(tokenAPrice);
        const reserveBInUSD2 = new BigNumber(pair2.reserve1).dividedBy(new BigNumber(10).pow(pair2.tokenB.decimal)).multipliedBy(tokenBPrice);

        if (tokenA1IsStable && reserveAInUSD1.isLessThan(500)) {
            continue;
        }
        if (tokenB1IsStable && reserveBInUSD1.isLessThan(500)) {
            continue;
        }
        if (tokenA2IsStable && reserveAInUSD2.isLessThan(500)) {
            continue;
        }
        if (tokenB2IsStable && reserveBInUSD2.isLessThan(500)) {
            continue;
        }

        const liquidity1 = reserveAInUSD1.plus(reserveBInUSD1);
        const liquidity2 = reserveAInUSD2.plus(reserveBInUSD2);

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
        processedPairs.push([processedPair1, processedPair2]);
    }
    return processedPairs;
}

processPairs().then(data => {
    console.log('Writing result to file...');
    writeJson('./processedPairs.json', data, { spaces: 2 })
        .then(() => console.log('Done writing result to file'))
        .catch(console.error);
});