import { BigNumber } from "ethers";
import { Exchange, Cost, Token, Receipt } from "./adapters/exchange";
import { Quote } from "./types/Quote";
import { version, exchanges, Exchange as CCXTExchange, pro } from "ccxt";
import Credentials, {
    ExchangeCredentials,
} from "../../server/credentials/Credentials";
type ExchangeKey = keyof typeof exchanges;
type ProKey = keyof typeof pro;

export class LiveCEX implements Exchange<CCXTExchange, void> {
    name: string;
    type: "cex" | "dex" = "cex";
    delegate: CCXTExchange;

    get fee(): number {
        return (this.delegate.fees as any).trading?.taker ?? 0;
    }

    constructor(exchange: string, credentials?: ExchangeCredentials) {
        this.name = exchange;
        const args =
            credentials ?? Credentials.shared.exchanges[exchange] ?? {};
        if (pro[exchange as ProKey]) {
            this.delegate = new pro[exchange as ProKey]({
                ...args,
                enableRateLimit: true,
                rateLimit: 100,
            }) as unknown as CCXTExchange;
        } else {
            this.delegate = new exchanges[exchange as ExchangeKey]({
                ...args,
                enableRateLimit: true,
                rateLimit: 100,
            }) as unknown as CCXTExchange;
        }

        if (process.env.USE_TESTNET === "TRUE") {
            this.delegate.setSandboxMode(true);
        }
    }

    async getQuote(
        maxAvailableAmount: number,
        tokenA: Token,
        tokenB: Token,
        maximizeB: boolean = true
    ): Promise<Quote> {
        // First we need to sort the tokens by their symbol
        const [token1, token2] = [tokenA, tokenB].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        const price = await this.delegate.fetchTicker(
            `${token1.name}/${token2.name}`
        );

        // Transaction price would be bid if pair is token1/token2, ask if token2/token1
        const transactionPrice =
            token1.name === tokenA.name ? price.bid : price.ask;

        return {
            exchangeType: this.name,
            exchangeName: this.name,
            amount: maxAvailableAmount,
            amountOut: maxAvailableAmount * (price.last ?? 0),
            price: price.last ?? 0,
            transactionPrice: transactionPrice ?? price.last ?? 0,
            bid: price.bid ?? 0,
            ask: price.ask ?? 0,
            tokenA,
            tokenB,
            meta: {},
        };
    }

    async estimateTransactionTime(
        tokenA: Token,
        tokenB: Token
    ): Promise<number> {
        // Random time in ms, between 1-3 seconds
        return Math.random() * 2000 + 1000;
    }

    async estimateTransactionCost(
        amountIn: number,
        price: number,
        tokenA: Token,
        tokenB: Token
    ): Promise<Cost> {
        // Random cost in wei, between 0.001-0.01 ETH
        return { costInDollars: Math.random() * 0.009 + 0.001 };
    }

    async buyAtMaximumOutput(
        amountIn: number,
        path: Token[],
        to: string,
        deadline: number
    ): Promise<Receipt> {
        // First we need to sort the tokens by their symbol
        const [tokenA, tokenB] = path.map((token) => token.name);
        const [token1, token2] = [tokenA, tokenB].sort((a, b) =>
            a.localeCompare(b)
        );
        const symbol = `${token1}/${token2}`;
        const side = tokenA === symbol.split("/")[0] ? "sell" : "buy";
        const type = this.delegate.has.createMarketOrder ? "market" : "limit";
        const order = await this.delegate.createOrder(
            symbol,
            type,
            side,
            amountIn
        );
        console.log(order);

        // Get amount out.
        return {
            amountIn,
            amountOut: order.cost,
            price: order.price,
            path,
            exchanges: [this.name],
        };
    }

    async buyAtMinimumInput(
        amountOut: number,
        path: Token[],
        to: string,
        deadline: number
    ): Promise<Receipt> {
        // First we need to sort the tokens by their symbol
        const [tokenA, tokenB] = path.map((token) => token.name);
        const [token1, token2] = [tokenA, tokenB].sort((a, b) =>
            a.localeCompare(b)
        );
        const symbol = `${token1}/${token2}`;
        const side = tokenA === symbol.split("/")[0] ? "sell" : "buy";
        const type = this.delegate.has.createMarketOrder ? "market" : "limit";
        const order = await this.delegate.createOrder(
            symbol,
            type,
            side,
            amountOut
        );
        console.log(order);
        return {
            amountIn: order.amount,
            amountOut,
            price: order.price,
            path,
            exchanges: [this.name],
        };
    }

    async liquidityFor(token: Token): Promise<number> {
        // Return balance for token
        const balances = await this.delegate.fetchBalance();
        return Number(balances[token.name].free ?? 0);
    }
}
