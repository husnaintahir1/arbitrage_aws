// Import necessary modules
const cluster = require("cluster");
// const numCPUs = require("os").cpus().length;
const numCPUs = 1;
const express = require("express");
const fs = require("fs");
const Web3 = require("web3");
let counter = 0;
const BASE_COIN_ADDRESS = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";

// Define the log file path
const logFilePath = "./file.log";

// Initialize arrays to track worker tasks and task queues
const workersTasks = new Array(numCPUs).fill(0);
const workersTaskQueues = Array.from({ length: numCPUs }, () => []);
const util = require('util');


const logBuffer = []; // Buffer to store log data
const failed = 'failedExecution.txt'; // Default log file name
const success = 'successExecution.txt'; // Log file name for opportunity found

// Function to write log data to the log file
function writeToLog(data, filename) {
  logBuffer.push(util.format(data));

  if (!fs.existsSync(filename)) {
    // Create the log file if it doesn't exist
    fs.writeFileSync(filename, '');
  }

  fs.appendFile(filename, logBuffer.join('\n') + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

  logBuffer.length = 0; // Clear the log buffer
}
/**
 * Writes a message to the log file with a timestamp.
 * @param {string} message - The message to be written to the log file.
 */
// const executeArbitrageDummy = (privateKey, contractAddress, abi, amount, token, routers, index) => {
//     return new Promise((resolve, reject) => {
//       // Simulate an async task execution with a random delay between 1 and 5 seconds
//       setTimeout(() => {
//         const randomResult = Math.random() > 0.5 ? "success" : "error";
//         if (randomResult === "success") {
//           resolve(`Task ${index} executed successfully`);
//         } else {
//           reject(new Error(`Task ${index} execution failed`));
//         }
//       }, getRandomDelay(1000, 5000));
//     });
//   };


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
const { executeArbitrageETH, executeArbitrage } = require("./executer");

/**
 * Returns the worker with the shortest task queue.
 * @returns {Worker} - The least busy worker.
 */
const getLeastBusyWorker = () => {
  const leastBusyWorkerIndex = workersTaskQueues.reduce(
    (minIndex, currQueue, currIndex, arr) =>
      currQueue.length < arr[minIndex].length ? currIndex : minIndex,
    0
  );
  return Object.values(cluster.workers)[leastBusyWorkerIndex];
};

if (cluster.isMaster) {
  // Fork numCPUs number of workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Set up the Express server
  const app = express();
  app.use(bodyParser.json());

  // Assign incoming tasks to the least busy worker
  app.post("/", (req, res) => {
    counter++;
    req.body.index = counter;
    const leastBusyWorker = getLeastBusyWorker();
    const workerIndex = leastBusyWorker.id - 1;
    workersTaskQueues[workerIndex].push(req.body);

    // Process the first task in the queue if the worker is not busy
    if (workersTasks[workerIndex] === 0) {
      const task = workersTaskQueues[workerIndex].shift();
      workersTasks[workerIndex] += 1;
      leastBusyWorker.send(task);
    }

    res.send("Task enqueued");
  });

  // Listen for messages from the workers and update the workersTasks array
  cluster.on("message", (worker, response) => {
    console.log(response);
    const workerIndex = worker.id - 1;
    workersTasks[workerIndex] -= 1;

    // Process the next task in the queue if there is one and the worker is not busy
    if (
      workersTasks[workerIndex] === 0 &&
      workersTaskQueues[workerIndex].length > 0
    ) {
      setTimeout(() => {
        if (
          workersTasks[workerIndex] === 0 &&
          workersTaskQueues[workerIndex].length > 0
        ) {
          const task = workersTaskQueues[workerIndex].shift();
          workersTasks[workerIndex] += 1;
          worker.send(task);
        }
      }, 5000); // 5-second waiting time
    }
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
    let privateKey =
      "e3a5b9ef45d3e2176505af1a7b72bd4e97379c4d941fd7faf37bc22d87725926";
    let contractAddress = "0xd65E85Ce8301ff29B15Fd1528B9bE2921eDEd1f8";
    let abi = require("../abis/multibaseabi.json");
    let amount = Web3.utils.toWei("5"); // 1 ETH in wei
    let tokenA = message.tokenAaddress;
    let tokenB = message.tokenBaddress;
    let tokenAInvestment = message.tokenAInvestment;
    let tokenBInvestment = message.tokenBInvestment;
    let index = message.index;
    let routers;

    if (message.direction === "sushiToQuick") {
      routers = [message.sushiswapRouter, message.quickswapRouter];
    } else {
      routers = [message.quickswapRouter, message.sushiswapRouter];
    }

    if (tokenA === BASE_COIN_ADDRESS || tokenB === BASE_COIN_ADDRESS) {
      executeArbitrageETH(
        privateKey,
        contractAddress,
        abi,
        tokenA === BASE_COIN_ADDRESS ? tokenBInvestment : tokenAInvestment,
        tokenA === BASE_COIN_ADDRESS ? tokenB : tokenA,
        routers
      )
        .then((x) => {
          console.log(x, "success");
          message.transactionHash=x.transactionHash
          writeToLog(message,success);
          process.send(x);
        })
        .catch((error) => {
          // console.log(error,"ERRRRPR")
          const startIndex = error.message.indexOf("{"); // Find the index of the starting '{'
          const jsonSubstring = error.message.substring(startIndex); // Extract the JSON portion
          const errorObject = JSON.parse(jsonSubstring); // Parse the JSON string
          const transactionHash = errorObject.transactionHash;
          console.log(transactionHash, "HASHHAHAHSD");
          message.transactionHash=transactionHash
          writeToLog(message,failed);
          process.send({ error: error.message });
        });
    } else {
      executeArbitrage(
        privateKey,
        contractAddress,
        abi,
        tokenAInvestment,
        [tokenA, tokenB],
        routers,
        index
      )
        .then((x) => {
          console.log(x, "success");
          message.transactionHash=x.transactionHash
    writeToLog(message,success);
         
          process.send(x);
        })
        .catch((error) => {
          const startIndex = error.message.indexOf("{"); // Find the index of the starting '{'
          const jsonSubstring = error.message.substring(startIndex); // Extract the JSON portion
          const errorObject = JSON.parse(jsonSubstring); // Parse the JSON string
          const transactionHash = errorObject.transactionHash;
          console.log(transactionHash, "HASHHAHAHSD");
          message.transactionHash=transactionHash
          writeToLog(message,failed);
          process.send({ error: error.message });
        });
    }
  });
}
