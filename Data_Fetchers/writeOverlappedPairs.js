// const { writeJson } = require("fs-extra");
// const data = require("../fineData/curveQuickPairs.json");
// function writeOverlappedPairs() {
//   let fdata = Object.keys(data);
//   let tempArray = [];

//   for (let i = 0; i < fdata.length; i++) {
//     if (data[fdata[i]]?.length > 1) {
//       if((data[fdata[i]][0].dex==="CurveFinance" && data[fdata[i]][1].dex==="quickswap")||(data[fdata[i]][0].dex==="quickswap" && data[fdata[i]][1].dex==="CurveFinance") )
//       tempArray.push(data[fdata[i]]);
//     }
//   }
//   console.log(tempArray, "TEMP", tempArray.length);

//   writeJson("./fineData/overlapped-pairs-curveQuick.json", tempArray)
//     .then(() => {
//       console.log("Data written to file successfully ");
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// }

// writeOverlappedPairs()

const { writeJson } = require("fs-extra");
const data = require("../fineData/AllpairsCurve.json");
const datad =Object.keys( require("../fineData/Allpairs.json"))



function writeOverlappedPairs() {
  let fdata = Object.keys(data);
  
  let tempArray = [];

  for (let i = 0; i < fdata.length; i++) {
   
    if (data[fdata[i]]?.length > 1) {
      let dexes = data[fdata[i]].map(item => item.dex);
      
      console.log(dexes)
      if (dexes.includes('sushiswap') && dexes.includes('quickswap')) {
        tempArray.push(data[fdata[i]]);
      }
    }
  }
  console.log(tempArray, "TEMP", tempArray.length);

  writeJson("./fineData/overlapped-pairs-curved.json", tempArray)
    .then(() => {
      console.log("Data written to file successfully ");
    })
    .catch((error) => {
      console.log(error);
    });
}

writeOverlappedPairs();


