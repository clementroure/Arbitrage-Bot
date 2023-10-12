/**
 * Calculates the recommended bet size for a given arbitrage opportunity.
 */

import { BigNumber } from "ethers";

export type UniData = {
    inputBalance: number;
    fee: number;
    reserve0: BigNumber;
    reserve1: BigNumber;
};

export type CexData = {
    inputBalance: number;
    fee: number;
    price: number;
    ask?: number;
    bid?: number;
};

type ExecutionQuote = {
    amountIn: number;
    amountOut: number;
};

function calculateOutputAmount(
    exchange: UniData | CexData,
    amountIn: number,
    isDex: boolean
): number {
    if (isDex) {
        const dex = exchange as UniData;
        const truePriceTokenA = dex.reserve0.div(dex.reserve1);
        const truePriceTokenB = dex.reserve1.div(dex.reserve0);
        const [, , outputAmount] = computeProfitMaximizingTrade(
            truePriceTokenA,
            truePriceTokenB,
            dex.reserve0,
            dex.reserve1,
            dex.fee
        );
        return outputAmount.toNumber();
    } else {
        const cex = exchange as CexData;
        return amountIn * cex.price * (1 - cex.fee);
    }
}

export function betSize(exchanges: (UniData | CexData)[]): ExecutionQuote[] {
    const quotes: ExecutionQuote[] = [];
    let inputAmount = exchanges[0].inputBalance;

    for (let i = 0; i < exchanges.length; i++) {
        const isDex = "reserve0" in exchanges[i];
        const outputAmount = calculateOutputAmount(
            exchanges[i],
            inputAmount,
            isDex
        );

        quotes.push({ amountIn: inputAmount, amountOut: outputAmount });
        inputAmount = outputAmount;
    }

    return quotes;
}

function computeProfitMaximizingTrade(
    truePriceTokenA: BigNumber,
    truePriceTokenB: BigNumber,
    reserveA: BigNumber,
    reserveB: BigNumber,
    fee: number
): [boolean, BigNumber, BigNumber, BigNumber] {
    const aToB = BigNumber.from(reserveA)
        .mul(truePriceTokenB)
        .div(reserveB)
        .lt(truePriceTokenA);

    const invariant = BigNumber.from(reserveA).mul(reserveB);

    function sqrt(number: BigNumber): BigNumber {
        const a = number.toBigInt();
        if (a < 0n)
            throw new Error("square root of negative numbers is not supported");
        if (a < 2n) return number;
        function newtonIteration(n: bigint, x0: bigint): bigint {
            const x1 = (n / x0 + x0) >> 1n;
            if (x0 === x1 || x0 === x1 - 1n) return x0;
            return newtonIteration(n, x1);
        }
        return BigNumber.from(newtonIteration(a, 1n));
    }

    const Fee = 1000 - Math.floor(fee * 1000);

    const leftSide = sqrt(
        invariant
            .mul(1000)
            .mul(aToB ? truePriceTokenA : truePriceTokenB)
            .div((aToB ? truePriceTokenB : truePriceTokenA).mul(Fee))
    );
    const rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)).div(Fee);

    if (leftSide.lt(rightSide))
        return [false, BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)];

    // compute the amount that must be sent to move the price to the profit-maximizing price
    const amountIn = leftSide.sub(rightSide);

    // compute the amount out using the constant product formula for both exchanges
    const amountOutA = aToB
        ? reserveB.sub(invariant.div(reserveA.add(amountIn)))
        : reserveA.sub(invariant.div(reserveB.add(amountIn)));

    // compute the amount out using the constant product formula for the second exchange
    const amountOutB = aToB
        ? reserveA.sub(invariant.div(reserveB.add(amountOutA)))
        : reserveB.sub(invariant.div(reserveA.add(amountOutA)));

    return [aToB, amountIn, amountOutA, amountOutB];
}

function adjustAmounts(
    amountInA: number,
    amountOutA: number,
    amountInB: number,
    amountOutB: number,
    inputBalanceA: number,
    inputBalanceB: number
): {
    amountInA: number;
    amountOutA: number;
    amountInB: number;
    amountOutB: number;
} {
    let scaleFactorA = 1;
    let scaleFactorB = 1;

    if (amountInA > inputBalanceA) {
        scaleFactorA = inputBalanceA / amountInA;
    }

    if (amountInB > inputBalanceB) {
        scaleFactorB = inputBalanceB / amountInB;
    }

    const scaleFactor = Math.min(scaleFactorA, scaleFactorB);

    return {
        amountInA: amountInA * scaleFactor,
        amountOutA: amountOutA * scaleFactor,
        amountInB: amountInB * scaleFactor,
        amountOutB: amountOutB * scaleFactor,
    };
}
