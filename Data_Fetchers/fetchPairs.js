const { writeJson, readJson } = require('fs-extra');
const loading = require('loading-cli');

const { getPairs } = require('./utils');
const sushiFactoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
const uniFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
// async function fetchAndStorePairs() {
//     const load = loading('loading text!!').start();
//     let nextStart = 0;
//     let batchNumber = 0;

//     while(nextStart !== null) {
//         const uniBatch = await getPairs(
//             uniFactoryAddress,
//             require('../abis/eth-uni-factory-abi.json'),
//             'uniswap',
//             nextStart,
//             100,
//         );

//         // write each batch to a new file
//         await writeJson(`./UniPairs_batch_${batchNumber}.json`, uniBatch.pairs);
//         nextStart = uniBatch.nextStart;
//         batchNumber++;
//     }

//     nextStart = 0;
//     batchNumber = 0;

//     while(nextStart !== null) {
//         const sushiBatch = await getPairs(
//             sushiFactoryAddress,
//             require('../abis/eth-sushi-factory-abi.json'),
//             'sushiswap',
//             nextStart,
//             100,
//         );

//         // write each batch to a new file
//         await writeJson(`./SushiPairs_batch_${batchNumber}.json`, sushiBatch.pairs);
//         nextStart = sushiBatch.nextStart;
//         batchNumber++;
//     }

//     load.stop();
// }

async function fetchAndStorePairs() {
    const load = loading('loading text!!').start();
    let nextStart = 0;
    let sushiPairs = [];
    let uniPairs = [];
    while(nextStart !== null) {
        const uniBatch = await getPairs(
            uniFactoryAddress,
            require('../abis/eth-uni-factory-abi.json'),
            'uniswap',
            nextStart,
            100,
            250000
        );
        uniPairs = [...uniPairs, ...uniBatch.pairs];
        nextStart = uniBatch.nextStart;
    }

    await writeJson('./uniPairs.json', uniPairs);
    nextStart = 0;

    while(nextStart !== null) {
        const sushiBatch = await getPairs(
            sushiFactoryAddress,
            require('../abis/eth-sushi-factory-abi.json'),
            'sushiswap',
            nextStart,
            100,
        );
        sushiPairs = [...sushiPairs, ...sushiBatch.pairs];
        nextStart = sushiBatch.nextStart;
    }

    await writeJson('./SushiPairs.json', sushiPairs);


    

    load.stop();
}

async function groupPairs() {
    const curvePairs = await readJson('./fineData/CurvePair.json');
    const quickPairs = await readJson('./fineData/QuickPairs.json');

     quickPairs.forEach(item => item.key = item.key.toLowerCase());
    curvePairs.forEach(item => item.key = item.key.toLowerCase());
    const grouped = [...curvePairs, ...quickPairs].reduce((groups, item) => {
        const val = item.key;
        groups[val] = groups[val] || [];
        groups[val].push(item);
        return groups;
    }, {});

    console.log(Object.keys(grouped)?.length);
    if (Object.keys(grouped)?.length) {
        writeJson('./fineData/curveQuickPairs.json', grouped)
            .then(() => {
                console.log('Data written to file successfully');
            })
            .catch((error) => {
                console.log(error);
            });
    }
}

fetchAndStorePairs().then(() => {
    // groupPairs();
    console.log("fetched")
});

// groupPairs().then(x=>{
//     console.log("DONEEEEE")
// })



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
