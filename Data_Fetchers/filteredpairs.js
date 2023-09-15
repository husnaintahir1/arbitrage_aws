const fs = require('fs');

// Token list
const tokenList = require("../uniqueTokens.json"); // replace with your token list

// Extract addresses from token list and convert them to lower case
const stableCoins = tokenList.map(token => token.address.toLowerCase());

// Assuming your data is stored in the variable 'data'
const data = require("../fineData/overlapped-pairs.json") // replace with your data

// Filter function
const filterPairs = (pairSet) => {
    let firstPair = pairSet[0];
    let tokenAAddress = firstPair.tokenA.address.toLowerCase();
    let tokenBAddress = firstPair.tokenB.address.toLowerCase();
    return (stableCoins.includes(tokenAAddress) && !stableCoins.includes(tokenBAddress)) || 
           (!stableCoins.includes(tokenAAddress) && stableCoins.includes(tokenBAddress));
};

// Get pairs which have exactly one stable coin
let result = data.filter(filterPairs);

// Write result to JSON file
fs.writeFileSync('result.json', JSON.stringify(result, null, 2), 'utf-8');