import { Token } from "../adapters/exchange";

export type Quote = {
    exchangeType: string;
    exchangeName: string;
    amount: number; // Amount of tokenA
    amountOut: number; // Amount of tokenB
    price: number; // Average price
    transactionPrice: number; // The price at which we would buy/sell
    tokenA: Token;
    tokenB: Token;
    ask?: number;
    bid?: number;
    ttf?: number;
    meta?: any;
};
