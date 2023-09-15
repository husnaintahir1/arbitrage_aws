const fs = require("fs");
const _ = require("lodash");
const pairSets = require("./FileStructure/totalPairs.json");
const baseTokens = require("./FileStructure/baseTokens.json");
const filteredPairSets = pairSets.filter((pairSet) => {
  const tokenAIsBase = baseTokens.some(
    (baseToken) =>
      baseToken.address.toLowerCase() ===
      pairSet[0].tokenA.address.toLowerCase()
  );

  return tokenAIsBase;
});

//   console.log(filteredPairSets);

const outputFilename = "filteredPairSets.json";
const outputData = JSON.stringify(filteredPairSets, null, 2);

fs.writeFile(outputFilename, outputData, (err) => {
  if (err) {
    console.error("Error writing JSON file:", err);
  } else {
    console.log(`Filtered pair sets written to ${outputFilename}`);
  }
});
