const BigNumber=require("bignumber.js")
function calculatePriceImpact(reserveIn, reserveOut, amountIn) {
  // Convert inputs to big numbers (assuming you're using a library like bn.js or bignumber.js)
  reserveIn = new BigNumber(reserveIn);
  reserveOut = new BigNumber(reserveOut);
  amountIn = new BigNumber(amountIn);
  
  // Calculate expected output without price impact
  let amountOutWithoutImpact = amountIn.times(reserveOut).div(reserveIn);

  // Calculate actual output (using the formula from Uniswap's getAmountsOut function)
  let numerator = reserveOut.times(amountIn);
  let denominator = reserveIn.plus(amountIn);
  let amountOut = numerator.div(denominator);

  // Calculate price impact
  let priceImpact = amountOutWithoutImpact.minus(amountOut).div(amountOutWithoutImpact).times(100);

  return {
      amountOutWithoutImpact: amountOutWithoutImpact.toString(),
      amountOut: amountOut.toString(),
      priceImpact: priceImpact.toString() + '%'
  };
}

// Example usage:
let result = calculatePriceImpact('182978726445839900048', '752054370', '831597057248019380');
console.log(result);
