// Import required libraries
const express = require("express"); // Import the Express web framework
const cors = require("cors"); // Import the CORS middleware for cross-origin requests
const app = express(); // Initialize a new Express app
const Web3 = require("web3"); // Import the Web3 library for interacting with the Ethereum blockchain
const data = require("./FileStructure/polydata.json"); // Import JSON data from the 'data.json' file
const loading = require("loading-cli"); // Import the 'loading-cli' library for command-line loading indicators
const { writeJson } = require("fs-extra"); // Import the 'writeJson' function from the 'fs-extra' library for handling files
const path = "./FileStructure/polydata.json"; // Set the file path for the 'data.json' file

// Import the Axios HTTP client for making requests to APIs
const axios = require("axios");
// Set the RPC URL to connect to the Ethereum mainnet through the Infura API
const RPC_URL = "https://polygon-mainnet.infura.io/v3/4370c0c8b0f14824b6b6f276ed894657";

// Enable CORS middleware for cross-origin requests
app.use(cors());

// Configure the app to parse incoming JSON payloads
app.use(express.json());

// Configure the app to parse incoming URL-encoded payloads
app.use(express.urlencoded({ extended: true }));


/**
 * Fetches and processes the top pairs with liquidity from a given Decentralized Exchange (DEX) factory contract
 * on the Ethereum blockchain. Utilizes the Web3 library to interact with Ethereum smart contracts.
 *
 * @async
 * @param {string} factoryAddress - The Ethereum address of the factory contract of the DEX.
 * @param {Array} factoryABI - The ABI (Application Binary Interface) of the factory contract.
 * @param {string} dex - The name of the Decentralized Exchange, used to tag the pairs fetched.
 * @returns {Promise<Array>} - Returns a promise that resolves to an array of token pairs with their details.
 * @throws {Error} - Throws an error if there is an issue with fetching or processing the pairs.
 */
async function getPairs(factoryAddress, factoryABI, dex) {
  try {
    const web3 = new Web3(RPC_URL);
    const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);
    // console.log(factoryContract.methods)
    const allPairsLength = await factoryContract.methods
      .allPairsLength()
      .call();
    const pairs = [];
    for (let i = 0; i < 500; i++) {
      const pairAddress = await factoryContract.methods.allPairs(i).call();
      pairs.push(pairAddress);
    }

    const pairsInfo = await Promise.all(
      pairs.map(async (pairAddress) => {
        const pairContract = new web3.eth.Contract(
          require("./abis/contract-abi.json"),
          pairAddress
        );
        const reserves = await pairContract.methods.getReserves().call();
        const reserve0 = BigInt(reserves[0]);
        const reserve1 = BigInt(reserves[1]);
        const liquidity = reserve0 * reserve1;
        const [tokenAAddress, tokenBAddress] = await Promise.all([
          pairContract.methods.token0().call(),
          pairContract.methods.token1().call(),
        ]);

        return {
          pairAddress,
          liquidity: liquidity.toString(),
          tokenA: { address: tokenAAddress },
          tokenB: { address: tokenBAddress },
          // reserves:BigInt(reserves)
        };
      })
    );
    const pairsWithLiquidityOver100 = pairsInfo.filter(
      (pair) => pair.liquidity > 10147133434804668n
    );

    const pairsWithTokenData = await Promise.all(
      pairsWithLiquidityOver100.map(async (pair) => {
        const token0Contract = new web3.eth.Contract(
          require("./abis/erc20-abi.json"),
          pair.tokenA.address
        );
        const token1Contract = new web3.eth.Contract(
          require("./abis/erc20-abi.json"),
          pair.tokenB.address
        );
        let token0Name;
        let token0Symbol;
        let token0decimal;
        let token1Name;
        let token1Symbol;
        let token1decimal;
        try {
          token0Name = await token0Contract.methods.name().call();
          token0Symbol = await token0Contract.methods.symbol().call();
          token0decimal = await token0Contract.methods.decimals().call();
        } catch (error) {
          console.log();
          if (error.reason === "overflow") {
            const token0 = new web3.eth.Contract(
              require("./abis/newabi.json"),
              pair.tokenA.address
            );

            token0Name = await token0.methods.name().call();
            token0Name = web3.utils.hexToUtf8(token0Name);
            token0Symbol = await token0.methods.symbol().call();
            token0Symbol = web3.utils.hexToUtf8(token0Symbol);
            token0decimal = await token0Contract.methods.decimals().call();
          } else {
            console.log(error);
          }
        }
        try {
          token1Name = await token1Contract.methods.name().call();
          token1Symbol = await token1Contract.methods.symbol().call();
          token1decimal = await token1Contract.methods.decimals().call();
        } catch (error) {
          if (error.reason === "overflow") {
            const token1 = new web3.eth.Contract(
              require("./abis/newabi.json"),
              pair.tokenB.address
            );

            token1Name = await token1.methods.name().call();
            token1Name = web3.utils.hexToUtf8(token1Name);
            token1Symbol = await token1.methods.symbol().call();
            token1Symbol = web3.utils.hexToUtf8(token1Symbol);
            token1decimal = await token1Contract.methods.decimals().call();
          } else {
            console.log(error);
          }
        }

        return {
          ...pair,
          tokenA: {
            ...pair.tokenA,
            name: token0Name,
            symbol: token0Symbol,
            decimal: token0decimal,
            decimalValue: "1".padEnd(+token0decimal + +"1", 0),
          },
          tokenB: {
            ...pair.tokenB,
            name: token1Name,
            symbol: token1Symbol,
            decimal: token1decimal,
            decimalValue: "1".padEnd(+token1decimal + +"1", 0),
          },
          pairSymbol: `${token0Symbol}/${token1Symbol}`,
          dex,
          key:`${pair.tokenA.address}/${pair.tokenB.address}`
        };
      })
    );
   

    return pairsWithTokenData;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Fetches the ABI (Application Binary Interface) of an Ethereum smart contract using the Etherscan API.
 *
 * @async
 * @param {string} contractAddress - The Ethereum address of the smart contract.
 * @returns {Promise<Array>} - Returns a promise that resolves to the ABI of the contract.
 * @throws {Error} - Throws an error if there is an issue with fetching the ABI.
 */
async function getContractABI(contractAddress) {
  const FACTORY_ABI_URL = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}`;

  let resp = await axios.get(FACTORY_ABI_URL);
  return JSON.parse(resp.data.result);
}
app.get("/getPairsFor", async (req, res) => {
  const load = loading("loading text!!").start();

  
  // sushiData
  const sushiFactoryAddress = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
  // uniData
  const uniFactoryAddress = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
  

  const sushiPairs = await getPairs(
    sushiFactoryAddress,
    require("./abis/sushiswap_polygon_factory_abi.json"),
    "sushiswap"
  );
  const uniPairs = await getPairs(
    uniFactoryAddress,
    require("./abis/quickswap_polygon_factory_abi.json"),
    "quickswap"
  );

  console.log(sushiPairs,uniPairs)
  const key = "key";
  const grouped = [...sushiPairs, ...uniPairs].reduce((groups, item) => {
    const val = item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
  console.log(grouped);

  console.log(Object.keys(grouped)?.length, "ADSADADADSAD");
  if (Object.keys(grouped)?.length) {
    writeJson(path, grouped)
      .then(() => {
        console.log("Data written to file successfully ");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  load.stop();
  res.send("hello world");
});


/**
 * Route to filter and fetch token pairs that are available on both SushiSwap and Uniswap.
 * Writes the overlapping pairs to a JSON file.
 *
 * @name root
 * @route {GET} /
 * @returns {void}
 */

app.get("/", (req, res) => {
  let fdata = Object.keys(data);

    console.log(
      fdata
    )
  let tempArray = [];
  for (let i = 0; i < fdata.length; i++) {
    if (data[fdata[i]]?.length > 1) {
      if((data[fdata[i]][0].dex==="sushiswap" && data[fdata[i]][1].dex==="quickswap")||(data[fdata[i]][0].dex==="quickswap" && data[fdata[i]][1].dex==="sushiswap") )
      tempArray.push(data[fdata[i]]);
    }
  }
  console.log(tempArray, "TEMP",tempArray.length);

  writeJson("ovrlapped-pairs.json", tempArray)
    .then(() => {
      console.log("Data written to file successfully ");
    })
    .catch((error) => {
      console.log(error);
    });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
