

// Grouping for 3 dexes

// async function groupPairs() {
//     const sushiPairs = await readJson('./fineData/SushiPairs.json');
//     const quickPairs = await readJson('./fineData/QuickPairs.json');
//     const curvePairs = await readJson('./fineData/CurvePair.json');

//     // Ensure keys are all in lower case
//     sushiPairs.forEach(item => item.key = item.key.toLowerCase());
//     quickPairs.forEach(item => item.key = item.key.toLowerCase());
//     curvePairs.forEach(item => item.key = item.key.toLowerCase());

//     const grouped = [...sushiPairs, ...quickPairs, ...curvePairs].reduce((groups, item) => {
//         const val = item.key;
//         groups[val] = groups[val] || [];
//         groups[val].push(item);
//         return groups;
//     }, {});

//     console.log(Object.keys(grouped)?.length);
//     if (Object.keys(grouped)?.length) {
//         writeJson('./fineData/AllpairsCurve.json', grouped)
//             .then(() => {
//                 console.log('Data written to file successfully');
//             })
//             .catch((error) => {
//                 console.log(error);
//             });
//     }
// }

// groupPairs().then(x=>{
//     console.log("DONEEEEE")
// })