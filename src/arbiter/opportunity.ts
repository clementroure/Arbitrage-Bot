import { Exchange, Token } from "../exchanges/adapters/exchange";

export async function validateOpportunity({
    tokenA,
    tokenB,
    priceA,
    priceB,
    amountIn,
    exchangeA,
    exchangeB,
}: {
    tokenA: Token;
    tokenB: Token;
    priceA: number;
    priceB: number;
    amountIn: number;
    exchangeA: Exchange<any>;
    exchangeB: Exchange<any>;
}) {
    // Get the fees
    const fee = await exchangeA.estimateTransactionCost(
        amountIn,
        tokenA,
        tokenB,
        "sell"
    );
    const fee2 = await exchangeB.estimateTransactionCost(
        amountIn,
        tokenA,
        tokenB,
        "buy"
    );

    // Check if the fees are less than the profit
    const profit = amountIn * priceA - amountIn * priceB;
    const profitAfterFees = profit - fee - fee2;
    if (profitAfterFees <= 0) {
        return false;
    }

    return true;
}
