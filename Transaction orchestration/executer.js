const Web3 = require('web3');

async function executeArbitrageETH(privateKey, contractAddress, abi, amount, token, routers,index) {
  // Connect to Polygon network using an RPC provider (e.g., Infura, QuickNode, etc.)
  const web3 = new Web3('https://polygon-mainnet.infura.io/v3/0ff8efdf465d4b7ab2083e31297760bc');

  // Create an instance of the contract
  const contract = new web3.eth.Contract(abi, contractAddress);

  // Encode the function call data
  const functionAbi = contract.methods.executeArbitrageETH(amount, token, routers).encodeABI();

  // Get the sender address from the private key
  const senderAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  const startingNonce = await web3.eth.getTransactionCount(senderAddress);
console.log("NONCE",startingNonce)
    // Get the latest block data
    // Estimate gas for the method
  //   const checksummedAddress = web3.utils.toChecksumAddress(senderAddress);
  //   const from =senderAddress
  //   console.log("+++++++")
  // const gasEstimate = await contract.methods.executeArbitrage(amount, token, routers).estimateGas({ from:checksummedAddress });
  // console.log("---------")

  // Apply gas multiplier if provided
  // const adjustedGasEstimate = Math.ceil(gasEstimate * 2);
  
  const gasPrice = await web3.eth.getGasPrice();
  // Create a new transaction object
  const txObject = {
    from: senderAddress,
    to: contractAddress,
    value: amount,
    gas: web3.utils.toHex(4000000),
    gasPrice: gasPrice ,
    data: functionAbi,
    // nonce:startingNonce+index
  };

  // Sign the transaction with the private key
  const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

  // Send the signed transaction
  const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
 
  // Print the transaction receipt
  console.log(txReceipt,"TRANSACTION",signedTx)
  return txReceipt
}

async function executeArbitrage(privateKey, contractAddress, abi, amount, token, routers,index) {
  // Connect to Polygon network using an RPC provider (e.g., Infura, QuickNode, etc.)
  const web3 = new Web3('https://polygon-mainnet.infura.io/v3/0ff8efdf465d4b7ab2083e31297760bc');

  // Create an instance of the contract
  const contract = new web3.eth.Contract(abi, contractAddress);

  // Encode the function call data
  const functionAbi = contract.methods.executeArbitrage(amount, token[0],token[1], routers).encodeABI();

  // Get the sender address from the private key
  const senderAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  const startingNonce = await web3.eth.getTransactionCount(senderAddress);
console.log("NONCE",startingNonce)
    
  
  const gasPrice = await web3.eth.getGasPrice();
  // Create a new transaction object
  const txObject = {
    from: senderAddress,
    to: contractAddress,
    value: amount,
    gas: web3.utils.toHex(4000000),
    gasPrice: gasPrice ,
    data: functionAbi,
    // nonce:startingNonce+index
  };

  // Sign the transaction with the private key
  const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

  // Send the signed transaction
  const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
 
  // Print the transaction receipt
  console.log(txReceipt,"TRANSACTION",signedTx)
  return txReceipt
}

// Export the function
module.exports = {executeArbitrageETH,executeArbitrage};
