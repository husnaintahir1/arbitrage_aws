const Web3 = require("web3");
const { ChainId, Token, TokenAmount, Pair } = require("@uniswap/sdk");

// SushiSwap Pair ABI
const SUSHISWAP_PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

async function getPairPrice(token1,token2,token1Name,token2Name,pairAddress,dex) {
  // Set up your Ethereum node connection
  const infuraUrl = "https://mainnet.infura.io/v3/5ef7bfd2b69f481da5cff7e282d3d55d";
  const web3 = new Web3(infuraUrl);

  // Define token addresses
  // Example: WETH and DAI
  const WETH_address = token1;
  const DAI_address = token2;

  // Replace with the SushiSwap pair contract address for your tokens
  const pairContractAddress = pairAddress;

  // Create Token instances
  const WETH = new Token(ChainId.MAINNET, WETH_address, 18);
  const DAI = new Token(ChainId.MAINNET, DAI_address, 18);

  // Create a contract instance with the SushiSwap pair ABI
  const pairContract = new web3.eth.Contract(SUSHISWAP_PAIR_ABI, pairContractAddress);

  // Fetch token reserves
  const reserves = await pairContract.methods.getReserves().call();
  const WETH_reserve = reserves._reserve0;
  const DAI_reserve = reserves._reserve1;

  // Create Pair instance and get the price
  const pair = new Pair(new TokenAmount(WETH, WETH_reserve), new TokenAmount(DAI, DAI_reserve));
  const price = pair.priceOf(WETH);
  const price1 = pair.priceOf(DAI);

  console.log(`Current price of ${token1Name}/${token2Name} pair on ${dex}: ${price.toSignificant(8)}`,);

}

getPairPrice(
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "wbtc","weth",
  "0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58",
  "sushi"
);

getPairPrice(
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "ebtc","weth",
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",
  "uniswap"
);
