const { writeJson } = require("fs-extra");
const data = require("../data/data_ready_for_trade.json")
const path = require("path");
const filePath = path.join(__dirname, "..", "data", "data_with_liq_over_5000.json");// Define a function to filter and add subarrays where both objects meet the criteria
async function filterAndAddPairs(data) {
    // Create an array to store the filtered subarrays (pairs)
    const filteredPairs = [];

    for (const pairData of data) {
        // Check if both objects within the subarray meet the criteria
        if (
            pairData[0].tokenALiquidity > 5000 &&
            pairData[0].tokenBLiquidity > 5000 &&
            pairData[1].tokenALiquidity > 5000 &&
            pairData[1].tokenBLiquidity > 5000
        ) {
            // If both objects meet the criteria, add the subarray to the filteredPairs array
            filteredPairs.push(pairData);
        }
    }

    await writeJson(filePath, filteredPairs, { spaces: 2 });
    return filteredPairs;
}

// Call the function to filter and add the subarrays
 filterAndAddPairs(data);

// Print the filtered subarrays (pairs)
// for (const pair of filteredPairs) {
//     console.log(pair);
// }
