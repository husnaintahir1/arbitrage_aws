const { writeJson, readJson, pathExists, readFile } = require("fs-extra");
const loading = require("loading-cli");
const { groupPairsAndOverlapped, getPairs } = require("../utils/utils");
const sushiFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const path = require("path");
const uniPath = path.join(__dirname, "..", "data", "uniPairs.json");
const sushiPath = path.join(__dirname, "..", "data", "sushiPairs.json");

async function appendToJsonFile(filePath, data) {
  try {
    let existingData = [];

    // Check if the file exists
    const fileExists = await pathExists(filePath);

    if (fileExists) {
      try {
        // Attempt to read existing data from the file
        const fileContents = await readFile(filePath, "utf-8");
        existingData = JSON.parse(fileContents);

        // Check if existing data is an array; if not, initialize as an empty array
        if (!Array.isArray(existingData)) {
          existingData = [];
        }
      } catch (err) {
        console.warn(
          `Error reading existing JSON data from '${filePath}': ${err.message}`
        );
      }
    } else {
      console.warn(
        `The file '${filePath}' doesn't exist. Creating a new file.`
      );
    }

    // Combine the existing data with the new data
    const newData = [...existingData, ...data];

    // Write the combined data back to the file
    await writeJson(filePath, newData, { spaces: 2 });

    console.log(`Appended ${data.length} items to '${filePath}'.`);
  } catch (error) {
    console.error(`Error appending data to JSON file: ${error.message}`);
  }
}
async function fetchAndStorePairs(start = 0, batchSize = 10000) {
  const load = loading("Fetching pairs...").start();
  let nextStart = start; // Start from the specified index (0 by default)
  let sushiPairs = [];
  let uniPairs = [];
  let errorCount = 0;
  // while (nextStart !== null) {
  //   try {
  //     const sushiBatch = await getPairs(
  //       sushiFactoryAddress,
  //       require("../../abis/eth-sushi-factory-abi.json"),
  //       "sushiswap",
  //       nextStart,
  //     );
  //     sushiPairs = [...sushiPairs, ...sushiBatch.pairs];
  //     nextStart = sushiBatch.nextStart;
  //     console.log(`Fetched ${sushiPairs.length} SushiSwap pairs.`);
  //   } catch (error) {
  //     errorCount++;
  //     console.error(`Error fetching SushiSwap pairs (Attempt ${errorCount}): ${error.message}`);
  //     if (errorCount >= 3) {
  //       console.error("Reached max retry attempts. Exiting.");
  //       break;
  //     }
  //   }
  // }

  // try {
  //   await writeJson(sushiPath, sushiPairs,{ flag: "w", spaces: 2 });
  //   console.log("Stored SushiSwap pairs to 'SushiPairs.json'.");
  // } catch (error) {
  //   console.error(`Error storing SushiSwap pairs: ${error.message}`);
  // }

  nextStart = 0;
  errorCount = 0;
  try {
    // Check if the file exists
    const fileExists = await pathExists(uniPath);

    if (fileExists) {
      // Read the existing data from the file
      const existingData = await readJson(uniPath);

      // Determine the start index based on the length of existing data
      nextStart = existingData.length;
      console.log(`Resuming from index ${nextStart}...`);
    } else {
      console.warn(`The file '${uniPath}' doesn't exist. Creating a new file.`);
    }
  } catch (err) {
    console.error(`Error reading existing JSON data from '${uniPath}': ${err.message}`);
  }

  while (nextStart !== null) {
    try {
      const uniBatch = await getPairs(
        uniFactoryAddress,
        require("../../abis/eth-uni-factory-abi.json"),
        "uniswap",
        nextStart
      );

      uniPairs = [...uniPairs, ...uniBatch.pairs];

      // Check if uniPairs array has reached the batchSize
      if (uniPairs.length >= batchSize) {
        // Write the batch to the JSON file
        const batchToWrite = uniPairs.splice(0, batchSize);
        await appendToJsonFile(uniPath, batchToWrite);
        uniPairs = null;
        uniPairs = [];
        console.log(
          `Stored ${batchToWrite.length} UniSwap pairs to 'uniPairs.json'.`
        );
      }

      nextStart = uniBatch.nextStart;
      console.log(`Fetched ${uniPairs.length} UniSwap pairs.`);
    } catch (error) {
      errorCount++;
      console.error(
        `Error fetching UniSwap pairs (Attempt ${errorCount}): ${error.message}`
      );
      if (errorCount >= 3) {
        console.error("Reached max retry attempts. Exiting.");
        break;
      }
    }
  }

  // After the loop, check if there are any remaining pairs in uniPairs
  if (uniPairs.length > 0) {
    await appendToJsonFile(uniPath, uniPairs);
    console.log(
      `Stored ${uniPairs.length} remaining UniSwap pairs to 'uniPairs.json'.`
    );
  }

  load.stop();

  if (errorCount < 3) {
    console.log("Fetching and storing pairs completed successfully.");
  }
}

fetchAndStorePairs().then(() => {
  RefineData();
});

const RefineData = async () => {
  const sushiData = await readJson(sushiPath);
  const uniData = await readJson(uniPath);
  groupPairsAndOverlapped(sushiData, uniData);
};
