const { writeJson, readJson } = require("fs-extra");
const loading = require("loading-cli");
const { groupPairsAndOverlapped, getPairs } = require("../utils/utils");
const sushiFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const path = require('path');
const uniPath = path.join(__dirname, '..', 'data', 'uniPairs.json');
const sushiPath = path.join(__dirname, '..', 'data', 'sushiPair.json');
async function fetchAndStorePairs(start = 0) {
  const load = loading("Fetching pairs...").start();
  let nextStart = start; // Start from the specified index (0 by default)
  let sushiPairs = [];
  let uniPairs = [];
  let errorCount = 0;

  while (nextStart !== null) {
    try {
      const uniBatch = await getPairs(
        uniFactoryAddress,
        require("../../abis/eth-uni-factory-abi.json"),
        "uniswap",
        nextStart,
        100,
        100
      );
      uniPairs = [...uniPairs, ...uniBatch.pairs];
      nextStart = uniBatch.nextStart;
      console.log(`Fetched ${uniPairs.length} UniSwap pairs.`);
    } catch (error) {
      errorCount++;
      console.error(`Error fetching UniSwap pairs (Attempt ${errorCount}): ${error.message}`);
      if (errorCount >= 3) {
        console.error("Reached max retry attempts. Exiting.");
        break;
      }
    }
  }

  try {
    await writeJson(uniPath, uniPairs);
    console.log("Stored UniSwap pairs to 'uniPairs.json'.");
  } catch (error) {
    console.error(`Error storing UniSwap pairs: ${error.message}`);
  }

  nextStart = 0;
  errorCount = 0;

  while (nextStart !== null) {
    try {
      const sushiBatch = await getPairs(
        sushiFactoryAddress,
        require("../../abis/eth-sushi-factory-abi.json"),
        "sushiswap",
        nextStart,
        100,
        100
      );
      sushiPairs = [...sushiPairs, ...sushiBatch.pairs];
      nextStart = sushiBatch.nextStart;
      console.log(`Fetched ${sushiPairs.length} SushiSwap pairs.`);
    } catch (error) {
      errorCount++;
      console.error(`Error fetching SushiSwap pairs (Attempt ${errorCount}): ${error.message}`);
      if (errorCount >= 3) {
        console.error("Reached max retry attempts. Exiting.");
        break;
      }
    }
  }

  try {
    await writeJson(sushiPath, sushiPairs);
    console.log("Stored SushiSwap pairs to 'SushiPairs.json'.");
  } catch (error) {
    console.error(`Error storing SushiSwap pairs: ${error.message}`);
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
