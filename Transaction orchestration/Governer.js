// Import necessary modules
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const express = require("express");
const flatted = require("flatted");
const fs = require("fs");
const Web3 = require("web3");
let counter=0
// Define the log file path
const logFilePath = "./file.log";

/**
 * Writes a message to the log file with a timestamp.
 * @param {string} message - The message to be written to the log file.
 */
function writeToLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err}`);
    }
  });
}

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min - The minimum number.
 * @param {number} max - The maximum number.
 * @returns {number} - A random integer between min and max.
 */
const getRandomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const bodyParser = require("body-parser");
const executeArbitrage = require("./executer");
const web3 = require("web3");
// const { default: Web3 } = require("web3");

// Check if the current process is the master process
if (cluster.isMaster) {
  // Initialize an array to keep track of the number of tasks assigned to each worker
  const workersTasks = new Array(1).fill(0);

  /**
   * Returns the worker with the least number of tasks assigned.
   * @returns {Worker} - The least busy worker.
   */
  const getLeastBusyWorker = () => {
    const leastBusyWorkerIndex = workersTasks.reduce(
      (minIndex, currValue, currIndex, arr) =>
        currValue < arr[minIndex] ? currIndex : minIndex,
      0
    );
    return Object.values(cluster.workers)[leastBusyWorkerIndex];
  };

  // Fork numCPUs number of workers
  for (let i = 0; i <1; i++) {
    cluster.fork();
  }

  // Set up the Express server
  const app = express();
  app.use(bodyParser.json());

  // Assign incoming tasks to the least busy worker
  app.post("/", (req, res) => {
    counter++
    req.body.index=counter
    const leastBusyWorker = getLeastBusyWorker();
    const workerIndex = leastBusyWorker.id - 1;
    workersTasks[workerIndex] += 1;
    leastBusyWorker.send(req.body);
    res.send("Task assigned");
  });

  // Listen for messages from the workers and update the workersTasks array
  cluster.on("message", (worker, response) => {

  console.log(response)
    const workerIndex = worker.id - 1;
    workersTasks[workerIndex] -= 1;
  });

  // Listen for the 'exit' event and replace exited workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.id} exited with code ${code}`);
    cluster.fork(); // Restart the worker process
  });

  // Start the server on port 8000
  app.listen(8000, () => {
    console.log("Server started on port 8000");
  });
} else {
  // Generate a random delay between 500 ms and 5000 ms
  const delay = getRandomDelay(500, 5000);

  // Listen for messages from the master process
  process.on("message", (message) => {
    let privateKey = "e51986f880659c6802a035eecbc534e4e020fedff61d4f965ba0b831e9d2633b";
    let contractAddress = "0xC411BeA798C3268fE5E70AD20F891c0B4778a226";
    let abi = require("../abis/arbCotractabi.json");
    let amount = Web3.utils.toWei("0.01"); // 1 ETH in wei
    let token = message.tokenAddress;
   let index=message.index
    let routers;

    if(message.direction==="sushiToQuick"){
      routers=[message.sushiswapRouter,message.quickswapRouter]
    }
    else{
      routers=[message.quickswapRouter,message.sushiswapRouter]
    }

    executeArbitrage(privateKey, contractAddress, abi, amount, token, routers,index)
      .then((x) => {
        console.log(x,"success")
        writeToLog(
          `Worker ${cluster.worker.id} handled the task \n` +
            `Received data: ${JSON.stringify(message)}\n` +
            `Receipt: ${JSON.stringify(x)}\n`
        );
        process.send(x);
      })
      .catch((error) => {
        // console.log(error,"ERRRRPR")
        process.send({ error: error.message });
      });

    
  });
}
