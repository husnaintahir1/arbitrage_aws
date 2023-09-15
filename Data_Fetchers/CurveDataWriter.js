const fs = require('fs');

const data = require("../fineData/pools.json");
const BigNumber = require('bignumber.js');
// Function to generate a decimal value string.
function generateDecimalValue(decimalCount) {
  return '1' + '0'.repeat(decimalCount);
}

// Convert tokens to pairs
const result = [];
const seenPairs = new Set(); // to keep track of pairs we have already seen

data.forEach(pool => {
  const { tokens, id } = pool;
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {

      // Sort the tokens by their address
      const [tokenA, tokenB] = [tokens[i], tokens[j]].sort((a, b) => a.address.localeCompare(b.address));

      const key = `${tokenA.address}/${tokenB.address}`;

      if (seenPairs.has(key)) continue; // skip if we have already seen this pair

      seenPairs.add(key); // remember that we have seen this pair

      const pair = {
        dex: 'CurveFinance',
        key: key,
        pairAddress: id, // Using pool id as the pair address
        pairSymbol: `${tokenA.symbol}/${tokenB.symbol}`,
        rawReserve0: tokenA.balance,
        rawReserve1: tokenB.balance,
        reserve0: new BigNumber(tokenA.balance).times(new BigNumber(10).pow(tokenA.decimals)).toFixed().toString(),
        reserve1: new BigNumber(tokenB.balance).times(new BigNumber(10).pow(tokenB.decimals)).toFixed().toString(),
        tokenA: {
          address: tokenA.address,
          decimal: tokenA.decimals,
          decimalValue: generateDecimalValue(tokenA.decimals),
          name: tokenA.symbol, // You might want to replace this with actual token name
          symbol: tokenA.symbol
        },
        tokenB: {
          address: tokenB.address,
          decimal: tokenB.decimals,
          decimalValue: generateDecimalValue(tokenB.decimals),
          name: tokenB.symbol, // You might want to replace this with actual token name
          symbol: tokenB.symbol
        }
      };
      result.push(pair);
    }
  }
});

// Write to a JSON file
fs.writeFile('CurvePair.json', JSON.stringify(result, null, 2), err => {
  if (err) throw err;
  console.log('Data written to file');
});
