import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTradeBookStore = create(
    persist(
        (set, get) => ({
            trades: [
                {
                    timestamp: 0,
                    token: "ETH",
                    startAmount: 61.54,
                    route: [
                        {
                            exchange: "uniswap",
                            token: "ETH",
                        },
                        {
                            exchange: "pancakeswap",
                            token: "USDC",
                        },
                        {
                            exchange: "uniswap",
                            token: "ETH",
                        },
                    ],
                    profit: 2.5,
                    fees: 0.03,
                },
            ],
            addTrade: (obj) =>
                // If a trade with the same timestamp already exists, replace it
                set((state) => {
                    const index = state.trades.findIndex(
                        (trade) => trade.timestamp === obj.timestamp
                    );
                    if (index === -1) return { trades: [...state.trades, obj] };
                    const trades = [...state.trades];
                    trades[index] = obj;
                    return { trades };
                }),
            removeTrade: (date) => {
                set((state) => {
                    const index = state.trades.findIndex(
                        (trade) => trade.timestamp === date
                    );
                    if (index === -1) return state;
                    const trades = [...state.trades];
                    trades.splice(index, 1);
                    return { trades };
                });
            },
        }),
        {
            name: "trade-store",
            skipHydration: true,
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);

export default useTradeBookStore;
