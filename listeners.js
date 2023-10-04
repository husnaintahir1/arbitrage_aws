// Import required modules
const cron = require('node-cron'); // Import 'node-cron' module for scheduling tasks
const data = require("./Arbitrage/data/data_with_liq_over_5000")
// .filter(x=>{
//   return !x[0].swapped
// })
console.log(data.length)
// .filter(x=>{
//   return x[0].pairSymbol.includes("DPI")
// }); // Import data from JSON file containing overlapped pairs
const { opportunity } = require('./newOpportunity'); // Import 'opportunity' function from the custom module
const axios = require("axios"); // Import 'axios' module for making HTTP requests
const util = require('util');
const fs = require('fs');


const logBuffer = []; // Buffer to store log data
const logFilename = 'Opportunity_log.txt'; // Default log file name
const foundLogFilename = 'found-log.txt'; // Log file name for opportunity found

// Function to write log data to the log file

function writeToLog(data, filename) {
  const textData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // Remove ANSI color codes from the text data
  const plainTextData = textData.replace(/\x1b\[\d+m/g, '');

  if (!fs.existsSync(filename)) {
    // Create the log file if it doesn't exist
    fs.writeFileSync(filename, '');
  }

  fs.appendFile(filename, plainTextData + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
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
  try {
    let simulate=`
    **********************  START  *************************\n
    =======Direction : Sushiswap to Uniswap =======\n
    Invested Token A ${resp.pair.split("/")[0]} :\x1b[32m${resp.amountIn/Math.pow(10, resp.decimalA)}\x1b[0m ==> Amount Out Token B ${resp.pair.split("/")[1]}:\x1b[32m${resp.amountOut/Math.pow(10, resp.decimalB)}\x1b[0m\n
    Invested Token B ${resp.pair.split("/")[1]} :\x1b[32m${resp.amountIn2/Math.pow(10, resp.decimalB)}\x1b[0m ==> Amount Out Token A ${resp.pair.split("/")[0]}:\x1b[32m${resp.amountOut2/Math.pow(10, resp.decimalA)}\x1b[0m\n\n
    Result : \x1b[34m${resp.difference}\x1b[0m\n
    Slippage : \x1b[33m${resp.slippage}\x1b[0m\n
    Percentage to Minus : \x1b[31m${resp.percentToMinus}\x1b[0m\n

    =======Direction : Uniswap to Sushiswap =======\n

    Invested Token A ${resp.pair.split("/")[0]} :\x1b[32m${resp.amountIn3/Math.pow(10, resp.decimalA)}\x1b[0m ==> Amount Out Token B ${resp.pair.split("/")[1]}:\x1b[32m${resp.amountOut3/Math.pow(10, resp.decimalB)}\x1b[0m\n
    Invested Token B ${resp.pair.split("/")[1]} :\x1b[32m${resp.amountIn4/Math.pow(10, resp.decimalB)}\x1b[0m ==> Amount Out Token A ${resp.pair.split("/")[0]}:\x1b[32m${resp.amountOut4/Math.pow(10, resp.decimalA)}\x1b[0m\n\n
    Result : \x1b[34m${resp.reverseDifferent}\x1b[0m\n
    Slippage : \x1b[33m${resp.slippage}\x1b[0m\n
    Percentage to Minus : \x1b[31m${resp.percentToMinus}\x1b[0m\n\n
    ----------------------- Opportunity Stats ----------------------

    Opportunity Status : \x1b[34m${resp.direction}\x1b[0m
    Opportunity Found : \x1b[33m${resp.opportunityFound}\x1b[0m


    
    ***********************  ENDD  **************************\n
    `;
    // const plainTextSimulate = simulate.replace(/\x1b\[\d+m/g, '');
      console.log(simulate);
  writeToLog(simulate,logFilename);

  } catch (error) {
    console.log(error)
  }

  if (resp.opportunityFound === true) {
    writeToLog(resp,foundLogFilename);
  
    axios
      .post('http://localhost:8000/', resp)
      .then((response) => {
        // console.log(response.data.data);
      })
      .catch((error) => {
        // console.log(error.message);
      });
  }
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
