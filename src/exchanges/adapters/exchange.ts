import { BigNumber } from "ethers";
import { Quote } from "../types/Quote";

export type Cost = {
    gas?: BigNumber;
    costInDollars: number;
};

export type Token = {
    name: string;
    address: string;
    decimals?: number;
};

export type Receipt = {
    transactionHash?: string;
    amountIn: number;
    amountOut: number;
    price: number;
    exchanges: string[];
    path: Token[];
};

export interface Exchange<T, U> {
    name: string;
    type: "dex" | "cex";
    fee: number;

    // Properties
    delegate: T;
    // Methods
    getQuote(
        maxAvailableAmount: number,
        tokenA: Token,
        tokenB: Token,
        maximizeB: boolean,
        meta?: U
    ): Promise<Quote>; // Returns the best quote for the maximum given amount of tokenA
    estimateTransactionTime(tokenA: Token, tokenB: Token): Promise<number>; // Returns the estimated time to execute a transaction
    estimateTransactionCost(
        amountIn: number,
        price: number,
        tokenA: Token,
        tokenB: Token,
        direction: "buy" | "sell"
    ): Promise<Cost>; // Returns the estimated cost to execute a transaction in dollars

    /// Buy with fixed input
    buyAtMaximumOutput(
        amountIn: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt>; // Buys an exact amount of tokens for another token

    /// Buy with fixed output
    buyAtMinimumInput(
        amountOut: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt>; // Buys an exact amount of tokens for another token

    // Liquidity methods
    liquidityFor(token: Token): Promise<number>; // Returns the liquidity for the given token
}
