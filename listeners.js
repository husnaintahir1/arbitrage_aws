// Import required modules
const cron = require('node-cron'); // Import 'node-cron' module for scheduling tasks
const data = require("./Arbitrage/data/Fine_data_without_liquidity.json")

// .filter(x=>{
//   return x[0].pairSymbol.includes("DPI")
// }); // Import data from JSON file containing overlapped pairs
const { opportunity } = require('./newOpportunity'); // Import 'opportunity' function from the custom module
const axios = require("axios"); // Import 'axios' module for making HTTP requests
const util = require('util');
const fs = require('fs');


const logBuffer = []; // Buffer to store log data
const logFilename = 'log.txt'; // Default log file name
const foundLogFilename = 'found-log.txt'; // Log file name for opportunity found

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
// console.log(data)
/**
 * An async function to process each item in the data array.
 * Calls the 'opportunity' function with the item data and
 * sends the result to the specified API endpoint using axios
 * if the opportunity is found.
 *
 * @param {Array} item - An array containing two elements representing a data item
 */
async function processItem(item,index) {
  // console.log(index,"INDEX")
  const resp = await opportunity(item[0], item[1]);
  console.log(resp);
  // writeToLog(resp,logFilename);

  // if (resp.opportunityFound === true) {
  //   writeToLog(resp,foundLogFilename);
  
  //   axios
  //     .post('http://localhost:8000/', resp)
  //     .then((response) => {
  //       // console.log(response.data.data);
  //     })
  //     .catch((error) => {
  //       // console.log(error.message);
  //     });
  // }
}

/**
 * Schedules tasks for processing data items using 'node-cron'.
 * Iterates through the data array and creates a cron job
 * for each item to be processed every 5 seconds.
 */
function scheduleTasks() {
  data.forEach((item, index) => {
    const cronSchedule = `*/5 * * * * *`;

    cron.schedule(cronSchedule, async () => {
      await processItem(item,index);
    });
  });
}

// Call the 'scheduleTasks' function to start scheduling tasks
scheduleTasks();
