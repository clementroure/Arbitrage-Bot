import { create } from "zustand";
import { BigNumber } from "ethers";

const usePriceStore = create((set, get) => ({
    quotes: new Map(),

    addQuote: (exchange, tokenA, tokenB, quote) => {
        // First we sort the tokens using their addresses
        const [token0, token1] = [tokenA, tokenB].sort();
        const pair = `${token0}/${token1}`;
        set((state) => {
            const quotes = new Map(state.quotes);
            quotes.set(`${exchange}-${pair}`, quote);
            return { quotes };
        });
    },

    getQuote: (exchange, tokenA, tokenB) => {
        // First we sort the tokens using their addresses
        const [token0, token1] = [tokenA, tokenB].sort();
        const pair = `${token0}/${token1}`;
        return get().quotes.get(`${exchange}-${pair.toLowerCase()}`);
    },

    getAverageQuote: (tokenA, tokenB) => {
        // First we sort the tokens using their addresses
        const [token0, token1] = [tokenA, tokenB].sort();
        const pair = `${token0}/${token1}`;
        const { quotes } = get();
        let total = 0;
        let count = 0;
        for (const [key, quote] of quotes.entries()) {
            if (key.includes(pair.toLowerCase())) {
                total = total + quote.price;
                if (quote.price > 0) {
                    count++;
                }
            }
        }
        if (count === 0) return 0;
        return { average: total / count, count };
    },

    getAllQuotes: (tokenA, tokenB) => {
        // First we sort the tokens using their addresses
        const [token0, token1] = [tokenA, tokenB].sort();
        const pair = `${token0}/${token1}`;
        const { quotes } = get();
        const out = [];
        for (const [key, quote] of quotes.entries()) {
            if (key.includes(pair.toLowerCase())) {
                out.push(quote);
            }
        }
        return out;
    },

    getArbitrage: () => {
        const { quotes } = get();
        // Look at all the quotes and find the two with the highest price difference
        let bestOpportunity = {};
        let bestProfit = 0;

        for (const [exchange1, quote1] of quotes.entries()) {
            for (const [exchange2, quote2] of quotes.entries()) {
                if (exchange1 === exchange2) continue;

                const price1 = quote1.ask ?? quote1.price;
                const price2 = quote2.bid ?? quote2.price;
                const priceDifference = price1 - price2;
                const amount = Math.min(quote1.amount, quote2.amount);
                const profit = priceDifference * amount;

                if (profit > bestProfit) {
                    bestProfit = profit;
                    bestOpportunity = {
                        exchange1,
                        exchange2,
                        profit,
                        percentProfit: (priceDifference / price1) * 100,
                        quote1,
                        quote2,
                        tokenA: quote1.tokenA,
                        tokenB: quote1.tokenB,
                    };
                }
            }
        }

        return bestOpportunity;
    },
}));

export default usePriceStore;
