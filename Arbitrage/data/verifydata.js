console.log(require("./Fine_data_without_liquidity.json").length)

// async function fetchAndStorePairs(start = 0, batchSize = 3000) {
//     const load = loading("Fetching pairs...").start();
//     let nextStart = start;
//     let uniPairs = [];
//     let errorCount = 0;
  
//     while (nextStart !== null) {
//       try {
//         const uniBatch = await getPairs(
//           uniFactoryAddress,
//           require("../../abis/eth-uni-factory-abi.json"),
//           "uniswap",
//           nextStart
//         );
  
//         uniPairs = [...uniPairs, ...uniBatch.pairs];
  
//         // Check if uniPairs array has reached the batchSize
//         if (uniPairs.length >= batchSize) {
//           // Write the batch to the JSON file
//           await appendToJsonFile(uniPath, uniPairs);
  
//           // Clear memory occupied by the batch
//           uniPairs = null;
//           uniPairs = [];
  
//           console.log(`Stored ${batchSize} UniSwap pairs to 'uniPairs.json'.`);
//         }
  
//         nextStart = uniBatch.nextStart;
//         console.log(`Fetched ${uniPairs.length} UniSwap pairs.`);
//       } catch (error) {
//         errorCount++;
//         console.error(`Error fetching UniSwap pairs (Attempt ${errorCount}): ${error.message}`);
//         if (errorCount >= 3) {
//           console.error("Reached max retry attempts. Exiting.");
//           break;
//         }
//       }
//     }
  
//     // After the loop, check if there are any remaining pairs in uniPairs
//     if (uniPairs && uniPairs.length > 0) {
//       await appendToJsonFile(uniPath, uniPairs);
//       console.log(`Stored ${uniPairs.length} remaining UniSwap pairs to 'uniPairs.json'.`);
//     }
  
//     load.stop();
  
//     if (errorCount < 3) {
//       console.log("Fetching and storing pairs completed successfully.");
//     }
//   }
  