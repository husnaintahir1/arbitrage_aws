const Web3 = require("web3"); // Import the Web3 library for interacting with the Ethereum blockchain
const RPC_URL = "https://mainnet.infura.io/v3/18a978ab26804ca5a6bd3dfce90a2099";
const AWSHttpProvider = require("@aws/web3-http-provider");
const endpoint = process.env.AMB_HTTP_ENDPOINT;


async function getPairs(
  factoryAddress,
  factoryABI,
  dex,
  batchStart = 0,
  batchSize = 200,
  maxIndex = Infinity,
  maxRetries = 8,
  retryDelay = 10000
) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const provider = new AWSHttpProvider(endpoint);
      const web3 = new Web3(provider);

      const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);
      // console.log(factoryContract.methods)
      const allPairsLength = Math.min(
        await factoryContract.methods.allPairsLength().call(),
        maxIndex
      );
      let batchEnd = Math.min(batchStart + batchSize, allPairsLength);
      if (batchStart >= batchEnd) {
        console.log("All pairs have been fetched.");
        return;
      }
      const pairs = [];
      console.log(`Fetching pairs ${batchStart} to ${batchEnd}...`);
      for (let i = batchStart; i < batchEnd; i++) {
        const pairAddress = await factoryContract.methods.allPairs(i).call();
        pairs.push(pairAddress);
      }
      console.log(`Fetched ${pairs.length} pairs.`);

      const pairsInfo = await Promise.all(
        pairs.map(async (pairAddress) => {
          const pairContract = new web3.eth.Contract(
            require("../abis/contract-abi.json"),
            pairAddress
          );
          const reserves = await pairContract.methods.getReserves().call();
          const [tokenAAddress, tokenBAddress] = await Promise.all([
            pairContract.methods.token0().call(),
            pairContract.methods.token1().call(),
          ]);
          // const price0 = await getTokenPriceInUSD(tokenAAddress);
          // const price1 = await getTokenPriceInUSD(tokenBAddress);

          // if (price0 === null || price1 === null) {
          //   return null;
          // }

          return {
            pairAddress,
            reserve0: reserves[0], // raw reserve0
            reserve1: reserves[1], // raw reserve1
            //   price0,
            //   price1,
            tokenA: { address: tokenAAddress },
            tokenB: { address: tokenBAddress },
          };
        })
      );

      // const validPairsInfo = pairsInfo.filter((pair) => pair !== null);

      //   console.log(pairsInfo);
      // const pairsWithLiquidityOver100 = pairsInfo.filter(
      //   (pair) => pair.liquidity > 10147133434804668n
      // );

      const pairsWithTokenData = await Promise.all(
        pairsInfo.map(async (pair) => {
          const token0Contract = new web3.eth.Contract(
            require("../abis/erc20-abi.json"),
            pair.tokenA.address
          );
          const token1Contract = new web3.eth.Contract(
            require("../abis/erc20-abi.json"),
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
                require("../abis/newabi.json"),
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
                require("../abis/newabi.json"),
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
          //   const liquidityThreshold = 20000; // Minimum liquidity threshold in dollars

          //   // Calculate liquidity
          //   const reserveValue0 = BigInt(pair.reserve0) / BigInt(10 ** token0decimal) * pair.price0;
          //   const reserveValue1 = BigInt(pair.reserve1) / BigInt(10 ** token1decimal) * pair.price1;

          //   let liquidity;

          //   // Check if either reserve value is less than the threshold
          //   if (reserveValue0 < liquidityThreshold || reserveValue1 < liquidityThreshold) {
          //     liquidity = 0;
          //   } else {
          //     liquidity = reserveValue0 + reserveValue1;
          //   }

          return {
            ...pair,
            rawReserve0: pair.reserve0,
            rawReserve1: pair.reserve1,

            // liquidity: liquidity.toString(),
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
            key: `${pair.tokenA.address}/${pair.tokenB.address}`,
          };
        })
      );

      //   const pairsWithLiquidityOver100000 = pairsWithTokenData.filter(
      //       (pair) => Number(pair.liquidity) > 40000
      //     );
      const nextBatchStart = batchEnd >= maxIndex ? null : batchEnd;

      return {
        pairs: pairsWithTokenData,
        nextStart: nextBatchStart,
      };
    } catch (error) {
      console.error(`Error in getPairs, attempt ${retries + 1}:`, error);
      retries++;
      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.error(`Failed to get pairs after ${maxRetries} attempts.`);
        // You can choose to return an empty result or throw an error to stop further execution
        return { pairs: [], nextStart: null };
      }
    }
  }
}

module.exports = { getPairs };
