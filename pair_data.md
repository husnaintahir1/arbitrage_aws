This script uses the Web3 library and Uniswap SDK to fetch the price of a token pair on two different decentralized exchanges (DEXs), SushiSwap and Uniswap.

The getPairPrice function takes the following parameters:

token1: The address of the first token in the pair.
token2: The address of the second token in the pair.
token1Name: A human-readable name for the first token.
token2Name: A human-readable name for the second token.
pairAddress: The address of the DEX pair contract.
dex: The name of the DEX (SushiSwap or Uniswap).
Inside the function, it first sets up an Ethereum node connection using Infura as the provider. It then creates instances of the two tokens and initializes a contract instance with the SushiSwap pair ABI and the provided pair address. Note that this script assumes the SushiSwap ABI can be used for both DEXs, which may not always be the case.

Next, the function fetches the token reserves from the pair contract and creates a Pair instance using the Uniswap SDK. It calculates the price for both tokens in the pair and logs the price of the first token in terms of the second token.

At the end of the script, getPairPrice is called twice to fetch the price of the WBTC/WETH pair on SushiSwap and Uniswap. It is important to note that the token names (wbtc and ebtc) are not actually used in the function's logic and are just used for the console output. The proper token names should be "WBTC" and "WETH" for both calls.