function psiaAdj(num) {
    return num + 14.696;
}

function rankinAdj(num) {
    return num - 459.67;
}

function ptEquation(num, id, press, temp) {
    let pt = 0;
    const e = Math.E;

    switch (id) {
        case 1:
            pt = Math.pow(10, 29.35754453 - 3845.193152 / num - 7.86103122 * Math.log10(num)
                + 0.002190939044 * num + (305.8268131 * (686.1 - num)) / (686.1 * num) * Math.log10(686.1 - num));
            break;
        case 2:
            const X = (1 - (num / temp)) - 0.2086902;
            pt = Math.pow(e, (1 / (num / temp)) * (-1.4376 + (-6.8715 * X) + (-0.53623 * Math.pow(X, 2))
                + (-3.82642 * Math.pow(X, 3)) + (-4.06875 * Math.pow(X, 4)) + (-1.2333 * Math.pow(X, 5))));
            pt *= press;
            break;
        case 3:
            pt = Math.pow(10, 43.25629 + -4293.056 / num + -13.06883 * Math.log10(num)
                + .004231114 * num + .2342564 * ((677 - num) / num) * Math.log10(677 - num));
            break;
        case 4:
            pt = Math.pow(e, 57.5859 + (-6522.92 / num) + (-6.58061 * Math.log(num)) + (.00000394176 * (num * num)));
            break;
        case 5:
            pt = Math.pow(e, 43.3622 + (-6020.28 / num) + (-4.39387 * Math.log(num)) + (0.00000212036 * (num * num)));
            break;
        default:
            console.log("RefID not found");
            return 69;
    }
    return pt;
}

function comparePoints(num1, num2) {
    return (num1 < num2) ? "Over" : "Under";
}

function midFinder(num1, num2) {
    return (num1 + num2) / 2;
}

function errorFind(num1, num2) {
    return Math.abs((num1 - num2) / num2) * 100;
}

function finalSub(num1, num2) {
    return num1 - num2;
}

function bisection(numL, numR, numSolve, refID, press, temp) {
    while (true) {
        const midVal = midFinder(numL, numR);
        const ptEq = ptEquation(midVal, refID, press, temp);
        if (errorFind(ptEq, numSolve) < 0.000000000001) {
            return midVal;
        } else {
            if (comparePoints(ptEq, numSolve) === "Over") {
                numL = midVal;
            } else {
                numR = midVal;
            }
        }
    }
}

async function main() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const prompt = (query) => new Promise(resolve => readline.question(query, resolve));

    console.log("Enter refrigerant type\nType 1 for R-22\nType 2 for R-410A\nType 3 for R-134a\nType 4 for R-404A\nType 5 for R-407C");
    const refType = parseInt(await prompt(""), 10);

    const maxPress = [0, 707.21, 714.5, 588.9, 541.2, 669.95];
    const maxTemp = [0, 204.81, 161.83, 213.9, 161.73, 188.13];

    if (refType < 1 || refType > 5) {
        console.log("Refrigerant input not found");
        readline.close();
        return;
    }

    console.log("\n\nEnter Liquid Line Pressure");
    const liquidLinePress = parseFloat(await prompt(""));
    
    console.log("\nEnter Liquid Line Temperature");
    const liquidLineTemp = parseFloat(await prompt(""));
        
    console.log("\nEnter Vapor Line Pressure");
    const vaporLinePress = parseFloat(await prompt(""));
    
    console.log("\nEnter Vapor Line Temperature");
    const vaporLineTemp = parseFloat(await prompt(""));

    if (liquidLinePress > maxPress[refType] || vaporLinePress > maxPress[refType]) {
        console.log("Gauge reading is above critical pressure");
        readline.close();
        return;
    } else if (liquidLinePress < 0 || vaporLinePress < 0) {
        console.log("Charged system pressure cannot be below zero PSIG");
        readline.close();
        return;
    } else if (liquidLineTemp > maxTemp[refType] || vaporLineTemp > maxTemp[refType]) {
        console.log("Thermometer reading is above critical temperature");
        readline.close();
        return;
    }

    const liquidLinePressAdjPSIA = psiaAdj(liquidLinePress);
    const vaporLinePressAdjPSIA = psiaAdj(vaporLinePress);

    const RLos = [0, 418.3339585682146, 408, 444.7, 407.7, 416];
    const RHis = [0, 664.5086257144121, 621.5, 673.6, 621.4, 647.8];
    const satRLo = RLos[refType];
    const satRHi = RHis[refType];
    const liquidSatR = bisection(satRLo, satRHi, liquidLinePressAdjPSIA, refType, maxPress[refType], satRHi);
    const liquidSatF = rankinAdj(liquidSatR);
    const vaporSatR = bisection(satRLo, satRHi, vaporLinePressAdjPSIA, refType, maxPress[refType], satRHi);
    const vaporSatF = rankinAdj(vaporSatR);
    const subCooling = finalSub(liquidSatF, liquidLineTemp);
    const superHeat = finalSub(vaporLineTemp, vaporSatF);

    if (subCooling < 0) {
        console.log("Subcooling cannot be below zero");
    } else if (superHeat < 0) {
        console.log("Superheat cannot be below zero");
    } else {
        console.log(`\n\nSubcooling is ${subCooling}\nSuperheat is ${superHeat}`);
    }

    readline.close();
}

main();
