const path = require("path");
const data =require("../data/data_with_liquidity.json");
const { writeJson } = require("fs-extra");
const filePath = path.join(__dirname, "..", "data", "data_ready_for_trade.json");
async  function modifyAndFilterPairs(data) {
    // Step 1: Filter the main array
    const filteredData = data.filter(pairSet => {
        const isEthereumInPair = pairSet.some(pair => {
            return pair.tokenA.symbol === 'WETH' || pair.tokenB.symbol === 'WETH';
        });
        return isEthereumInPair;
    });

    // Step 2: Modify the filtered data
    const modifiedData = filteredData.map(pairSet => {
        // Check and swap if tokenA is not Ethereum for the first pair
        pairSet[0].tokenA.minInvValue=pairSet[0].tokenA.decimalValue+"0"
        if (pairSet[0].tokenA.symbol !== 'WETH') {
            const isSwapped = true;
            // Swap tokenA, tokenB, and associated properties for the first object
            [pairSet[0].tokenA, pairSet[0].tokenB] = [pairSet[0].tokenB, pairSet[0].tokenA];
            [pairSet[0].tokenALiquidity, pairSet[0].tokenBLiquidity] = [pairSet[0].tokenBLiquidity, pairSet[0].tokenALiquidity];
            [pairSet[0].tokenAPrice, pairSet[0].tokenBPrice] = [pairSet[0].tokenBPrice, pairSet[0].tokenAPrice];
            [pairSet[0].reserve0, pairSet[0].reserve1] = [pairSet[0].reserve1, pairSet[0].reserve0];
            [pairSet[0].rawReserve0, pairSet[0].rawReserve1] = [pairSet[0].rawReserve1, pairSet[0].rawReserve0];

            // Update the pair symbol for the first object
            pairSet[0].pairSymbol = `${pairSet[0].tokenA.symbol}/${pairSet[0].tokenB.symbol}`;
            
            // Add the "swapped" property for the first object
            pairSet[0].swapped = isSwapped;
        }

        // Check and swap if tokenA is not Ethereum for the second pair
        pairSet[1].tokenA.minInvValue=pairSet[1].tokenA.decimalValue+"0"

        if (pairSet[1].tokenA.symbol !== 'WETH') {
            const isSwapped = true;
            // Swap tokenA, tokenB, and associated properties for the second object
            [pairSet[1].tokenA, pairSet[1].tokenB] = [pairSet[1].tokenB, pairSet[1].tokenA];
            [pairSet[1].tokenALiquidity, pairSet[1].tokenBLiquidity] = [pairSet[1].tokenBLiquidity, pairSet[1].tokenALiquidity];
            [pairSet[1].tokenAPrice, pairSet[1].tokenBPrice] = [pairSet[1].tokenBPrice, pairSet[1].tokenAPrice];
            [pairSet[1].reserve0, pairSet[1].reserve1] = [pairSet[1].reserve1, pairSet[1].reserve0];
            [pairSet[1].rawReserve0, pairSet[1].rawReserve1] = [pairSet[1].rawReserve1, pairSet[1].rawReserve0];

            // Update the pair symbol for the second object
            pairSet[1].pairSymbol = `${pairSet[1].tokenA.symbol}/${pairSet[1].tokenB.symbol}`;
            // Add the "swapped" property for the second object
            pairSet[1].swapped = isSwapped;
        }

        return pairSet;
    });
    await writeJson(filePath, modifiedData, { spaces: 2 });
    return modifiedData;
}




const modifiedData = modifyAndFilterPairs(data);

// modifiedData.forEach(pairSet => {
//     pairSet.forEach(pair => {
//         console.log(pair);
//     });
// });
