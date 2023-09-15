Project Documentation
Overview
This project is a Node.js application that interacts with the Ethereum blockchain to fetch data about token pairs from Uniswap and Sushiswap decentralized exchanges. The app filters pairs based on their liquidity, retrieves token details, and saves the fetched data to a JSON file. The application also exposes an API endpoint for getting pair data and another for listing overlapping pairs from both exchanges.

Key Components
Express, CORS, and app: These components are used to set up an Express server that listens for incoming HTTP requests and handles CORS.

Web3: This is the Ethereum JavaScript API library used to interact with Ethereum blockchain.

Axios: A promise-based HTTP client for making API calls to external services.

getPairs: This function fetches token pairs with liquidity above a certain threshold from a specified DEX (Uniswap or Sushiswap) by interacting with their smart contracts. It also retrieves token details and formats the data.

getContractABI: This function fetches the ABI (Application Binary Interface) of a smart contract from Etherscan API using its address.

API Endpoints
GET /getPairsFor: This route handles an HTTP GET request to fetch pair data from both Uniswap and Sushiswap, groups the data by token pair addresses, and saves it to a JSON file.

GET /: This route handles an HTTP GET request to list overlapping pairs, i.e., pairs that exist in both Uniswap and Sushiswap. The overlapping pairs are saved to another JSON file.

Running the Application
To run this application, you need to have Node.js installed on your machine. Then, follow these steps:

Install the required dependencies by running npm install in the project folder.
Start the application by running node app.js (or npm start, if you have a start script defined in your package.json).
Use a tool like Postman or your browser to make HTTP requests to the endpoints (/getPairsFor and /) and see the results.
Limitations and Future Work
The current implementation does not account for gas fees, which can significantly affect the profitability of arbitrage opportunities. Additionally, the script does not execute the actual trades; it only identifies potential opportunities. Future work could include adding functionality to interact with smart contracts and send transactions to execute the trades. Furthermore, refining the filtering criteria for token pairs or extending the application to support more DEXs could be considered.