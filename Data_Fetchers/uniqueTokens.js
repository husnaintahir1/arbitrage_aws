const fs = require('fs');

// Replace this with your actual data
let data = require("../fineData/Overlapped-pairs-with-liquidity-all-dexes.json")

function getUniqueTokens(data) {
    let uniqueTokens = new Set();
    for (let dexData of data) {
        for (let exchangeData of dexData) {
            uniqueTokens.add(JSON.stringify(exchangeData['tokenA']));
            uniqueTokens.add(JSON.stringify(exchangeData['tokenB']));
        }
    }
    return Array.from(uniqueTokens).map(JSON.parse);
}

let tokens = getUniqueTokens(data);

fs.writeFile('uniqueTokens.json', JSON.stringify(tokens, null, 2), (err) => {
    if (err) throw err;
    console.log('Unique tokens written to file');
});